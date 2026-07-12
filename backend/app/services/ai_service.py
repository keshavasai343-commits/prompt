import asyncio
import json
import re
import time
from typing import AsyncGenerator, Optional
from loguru import logger
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.prompt import PromptCategory, TargetAI

CATEGORY_CONTEXTS = {
    PromptCategory.CODING: "software development, programming, code architecture, and engineering best practices",
    PromptCategory.UI_UX: "UI/UX design, user interfaces, user experience, accessibility, and visual design",
    PromptCategory.WRITING: "content writing, copywriting, storytelling, and creative writing",
    PromptCategory.MARKETING: "digital marketing, growth hacking, SEO, and brand strategy",
    PromptCategory.BUSINESS: "business strategy, product management, entrepreneurship, and operations",
    PromptCategory.IMAGE_GENERATION: "AI image generation, visual art direction, and prompt engineering for visual AI",
    PromptCategory.DATA_SCIENCE: "data science, machine learning, analytics, and statistical analysis",
    PromptCategory.DEVOPS: "DevOps, cloud infrastructure, CI/CD, and system reliability",
    PromptCategory.GENERAL: "general knowledge and problem-solving",
}

TARGET_AI_CONTEXTS = {
    TargetAI.CHATGPT: "ChatGPT (GPT-4). Use conversational, role-based prompts with clear context and examples.",
    TargetAI.CLAUDE: "Claude by Anthropic. Use detailed, well-structured prompts with XML tags for complex tasks.",
    TargetAI.GEMINI: "Google Gemini. Use multimodal-aware prompts with clear task decomposition.",
    TargetAI.CURSOR: "Cursor AI IDE. Use code-focused prompts with file structure context and tech stack details.",
    TargetAI.COPILOT: "GitHub Copilot. Use inline-code-aware prompts with function signatures and comments.",
    TargetAI.MIDJOURNEY: "Midjourney image AI. Use descriptive visual prompts with style, lighting, and composition details.",
    TargetAI.STABLE_DIFFUSION: "Stable Diffusion. Use weighted prompt syntax with positive/negative prompt separation.",
    TargetAI.GROK: "Grok AI by xAI. Use direct, factual prompts with real-time context awareness.",
    TargetAI.GENERAL: "any AI assistant. Use clear, structured prompts applicable to multiple AI systems.",
}

# Used by non-Gemini models (Claude, OpenAI, Grok)
SYSTEM_PROMPT = """You are an expert AI prompt engineer with deep knowledge of how to craft effective prompts for various AI systems.

Your task is to transform a user's simple input into a comprehensive, highly effective AI prompt.

Guidelines for enhancement:
1. Add relevant role/persona context (e.g., "Act as a senior software engineer...")
2. Specify exact requirements, constraints, and expected output format
3. Include technical depth appropriate to the domain
4. Add quality indicators (production-ready, best practices, etc.)
5. Specify technologies, frameworks, or tools when relevant
6. Include edge cases or specific requirements that improve output quality
7. Structure the prompt for maximum clarity and precision
8. For coding: include architecture patterns, testing, error handling requirements
9. For image generation: add style, composition, lighting, color palette, resolution details
10. Make the output actionable and specific

Return ONLY the enhanced prompt text, without any explanation or meta-commentary."""

# Used by the non-streaming Gemini endpoint â€” returns structured JSON
GEMINI_JSON_SYSTEM_PROMPT = """You are an expert AI prompt engineer specializing in creating highly effective, optimized prompts for AI systems.

Analyze the user's input and respond with ONLY a valid JSON object. Do NOT include markdown code fences, explanations, or any text outside the JSON.

The JSON must have exactly these keys:
{
  "detected_intent": "One clear sentence describing what the user wants to accomplish",
  "assigned_role": "The ideal expert role/persona for this task (e.g. 'Senior React Developer with TypeScript expertise')",
  "standard_prompt": "A clear, direct 2-3 sentence prompt that works well with any AI assistant. Include the core task and basic requirements.",
  "advanced_prompt": "A detailed prompt (4-8 sentences) with: expert role assignment, specific context and background, step-by-step requirements, output format specification, and key constraints.",
  "expert_prompt": "A comprehensive prompt (8-20 sentences) with: detailed expert role definition, clear objectives and success criteria, complete technical specifications, edge cases to handle, output format with examples, quality standards, and testing/validation requirements.",
  "quality_score": <integer 0-100 rating the original input's specificity. 0-30=very vague, 31-60=somewhat clear, 61-80=good detail, 81-100=excellent specificity>,
  "suggested_improvements": ["3-5 specific, actionable ways the user could improve their input for better AI results"],
  "missing_information": ["2-4 critical pieces of information not provided that would significantly improve the output"],
  "follow_up_questions": ["2-4 clarifying questions an AI should ask to better understand the requirements"]
}"""

# Used by the streaming endpoint â€” uses XML section markers so expert text streams visibly
GEMINI_STREAMING_SYSTEM_PROMPT = """You are an expert AI prompt engineer. Respond in this EXACT format using these XML-like section tags:

<expert_prompt>
Write a comprehensive expert-level prompt here: detailed role definition, clear objectives, complete technical specifications, edge cases to handle, output format requirements, quality standards, and concrete examples. This should be 8-20 sentences.
</expert_prompt>

<analysis>
{"standard_prompt":"A clear 2-3 sentence prompt for any AI assistant","advanced_prompt":"A detailed 4-8 sentence prompt with role, context, step-by-step requirements, and output format","detected_intent":"One sentence describing user goal","assigned_role":"Ideal expert persona for this task","quality_score":75,"suggested_improvements":["improvement 1","improvement 2","improvement 3"],"missing_information":["missing detail 1","missing detail 2"],"follow_up_questions":["clarifying question 1","clarifying question 2"]}
</analysis>

Use EXACTLY these tags. Write NOTHING outside these two sections."""


def build_enhancement_prompt(input_text: str, category: PromptCategory, target_ai: TargetAI) -> str:
    category_ctx = CATEGORY_CONTEXTS.get(category, CATEGORY_CONTEXTS[PromptCategory.GENERAL])
    target_ctx = TARGET_AI_CONTEXTS.get(target_ai, TARGET_AI_CONTEXTS[TargetAI.GENERAL])
    return (
        f"Transform this simple input into a detailed, high-quality AI prompt.\n\n"
        f"Domain: {category_ctx}\n"
        f"Target AI: {target_ctx}\n\n"
        f'User Input: "{input_text}"\n\n'
        f"Create an enhanced prompt that is specific, actionable, and optimized for {target_ctx}"
    )


def build_gemini_request(input_text: str, category: PromptCategory, target_ai: TargetAI) -> str:
    category_ctx = CATEGORY_CONTEXTS.get(category, CATEGORY_CONTEXTS[PromptCategory.GENERAL])
    target_ctx = TARGET_AI_CONTEXTS.get(target_ai, TARGET_AI_CONTEXTS[TargetAI.GENERAL])
    return (
        f"Analyze and generate optimized prompts for this user task.\n\n"
        f"Domain: {category_ctx}\n"
        f"Target AI System: {target_ctx}\n"
        f'User Input: "{input_text}"\n\n'
        f"Tailor all prompt variants specifically for {target_ctx}."
    )


def _strip_json_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n?```\s*$", "", text, flags=re.MULTILINE)
    return text.strip()


class AIService:
    def __init__(self):
        self._openai_client: Optional[AsyncOpenAI] = None

    @property
    def openai_client(self) -> AsyncOpenAI:
        if not self._openai_client:
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    # ------------------------------------------------------------------ #
    #  Public API                                                          #
    # ------------------------------------------------------------------ #

    async def enhance_prompt(
        self,
        input_text: str,
        category: PromptCategory,
        target_ai: TargetAI,
        model: str = "gemini-2.5-flash",
    ) -> dict:
        start_time = time.time()
        try:
            if model.startswith("gemini"):
                result = await self._call_gemini(input_text, model, category, target_ai)
            elif model.startswith("claude"):
                user_prompt = build_enhancement_prompt(input_text, category, target_ai)
                result = await self._call_claude(user_prompt, model)
            elif model.startswith("grok"):
                user_prompt = build_enhancement_prompt(input_text, category, target_ai)
                result = await self._call_grok(user_prompt, model)
            else:
                user_prompt = build_enhancement_prompt(input_text, category, target_ai)
                result = await self._call_openai(user_prompt, model)

            result["generation_time_ms"] = int((time.time() - start_time) * 1000)
            return result

        except Exception as e:
            logger.error(f"AI enhancement failed with model {model}: {e}")
            return self._rule_based_enhance(input_text, category, target_ai)

    async def enhance_prompt_stream(
        self,
        input_text: str,
        category: PromptCategory,
        target_ai: TargetAI,
        model: str = "gemini-2.5-flash",
    ) -> AsyncGenerator[dict, None]:
        """Yields SSE event dicts: {type: 'token'|'complete'|'error'}"""
        start_time = time.time()
        try:
            if model.startswith("gemini"):
                async for event in self._call_gemini_stream(
                    input_text, model, category, target_ai, start_time
                ):
                    yield event
            else:
                result = await self.enhance_prompt(input_text, category, target_ai, model)
                yield {"type": "complete", "data": result}
        except Exception as e:
            logger.error(f"Stream generation failed: {e}")
            yield {"type": "error", "message": str(e)}

    # ------------------------------------------------------------------ #
    #  Gemini (non-streaming) â€” structured JSON response                  #
    # ------------------------------------------------------------------ #

    def _call_gemini_sync(
        self,
        input_text: str,
        model: str,
        category: PromptCategory = PromptCategory.GENERAL,
        target_ai: TargetAI = TargetAI.GENERAL,
    ) -> dict:
        """Synchronous Gemini call â€” safe to run in any event loop context via executor."""
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        request_text = build_gemini_request(input_text, category, target_ai)

        response = client.models.generate_content(
            model=model,
            contents=request_text,
            config=types.GenerateContentConfig(
                system_instruction=GEMINI_JSON_SYSTEM_PROMPT,
                temperature=0.7,
                max_output_tokens=3000,
            ),
        )

        raw = response.text.strip()
        usage = response.usage_metadata
        tokens = usage.total_token_count if usage else None

        try:
            data = json.loads(_strip_json_fences(raw))
            expert = data.get("expert_prompt", raw)
            return {
                "enhanced_prompt": expert,
                "standard_prompt": data.get("standard_prompt", ""),
                "advanced_prompt": data.get("advanced_prompt", ""),
                "expert_prompt": expert,
                "detected_intent": data.get("detected_intent", ""),
                "assigned_role": data.get("assigned_role", ""),
                "quality_score": int(data.get("quality_score", 0)),
                "suggested_improvements": data.get("suggested_improvements", []),
                "missing_information": data.get("missing_information", []),
                "follow_up_questions": data.get("follow_up_questions", []),
                "tokens_used": tokens,
                "model_used": model,
            }
        except (json.JSONDecodeError, ValueError, KeyError) as exc:
            logger.warning(f"Gemini JSON parse failed ({exc}). Returning raw text.")
            return {"enhanced_prompt": raw, "tokens_used": tokens, "model_used": model}

    async def _call_gemini(
        self,
        input_text: str,
        model: str,
        category: PromptCategory = PromptCategory.GENERAL,
        target_ai: TargetAI = TargetAI.GENERAL,
    ) -> dict:
        """Async wrapper â€” offloads the blocking Gemini call to a thread pool executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._call_gemini_sync,
            input_text,
            model,
            category,
            target_ai,
        )

    # ------------------------------------------------------------------ #
    #  Gemini streaming â€” streams expert prompt tokens, then full data    #
    # ------------------------------------------------------------------ #

    async def _call_gemini_stream(
        self,
        input_text: str,
        model: str,
        category: PromptCategory,
        target_ai: TargetAI,
        start_time: float,
    ) -> AsyncGenerator[dict, None]:
        """Get full structured result, then stream the expert prompt as a typewriter effect."""
        result = await self._call_gemini(input_text, model, category, target_ai)
        expert_text = result.get("expert_prompt") or result.get("enhanced_prompt", "")

        # Stream the expert prompt in small chunks (~8 chars) at ~15 ms intervals
        # giving ~50 chars/sec typewriter speed â€” same UX as real streaming
        CHUNK_SIZE = 8
        DELAY = 0.015  # seconds
        for i in range(0, len(expert_text), CHUNK_SIZE):
            chunk = expert_text[i : i + CHUNK_SIZE]
            yield {"type": "token", "text": chunk}
            await asyncio.sleep(DELAY)

        result["generation_time_ms"] = int((time.time() - start_time) * 1000)
        yield {"type": "complete", "data": result}

    # ------------------------------------------------------------------ #
    #  Other model callers                                                 #
    # ------------------------------------------------------------------ #

    async def _call_openai(self, user_prompt: str, model: str) -> dict:
        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        return {
            "enhanced_prompt": response.choices[0].message.content.strip(),
            "tokens_used": response.usage.total_tokens if response.usage else None,
            "model_used": model,
        }

    async def _call_claude(self, user_prompt: str, model: str) -> dict:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = await client.messages.create(
            model=model,
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return {
            "enhanced_prompt": response.content[0].text.strip(),
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
            "model_used": model,
        }

    async def _call_grok(self, user_prompt: str, model: str) -> dict:
        client = AsyncOpenAI(api_key=settings.XAI_API_KEY, base_url="https://api.x.ai/v1")
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        return {
            "enhanced_prompt": response.choices[0].message.content.strip(),
            "tokens_used": response.usage.total_tokens if response.usage else None,
            "model_used": model,
        }

    def _rule_based_enhance(self, input_text: str, category: PromptCategory, target_ai: TargetAI) -> dict:
        templates = {
            PromptCategory.CODING: (
                f"Act as a senior software engineer with 10+ years of experience. "
                f"Your task: {input_text}\n\n"
                "Requirements:\n"
                "- Write clean, production-ready code following SOLID principles\n"
                "- Include comprehensive error handling and input validation\n"
                "- Add TypeScript types/interfaces where applicable\n"
                "- Follow best practices for the relevant tech stack\n"
                "- Include unit tests for critical functionality\n"
                "- Document complex logic with clear comments\n"
                "- Ensure the code is scalable, maintainable, and performant"
            ),
            PromptCategory.IMAGE_GENERATION: (
                f"{input_text}, highly detailed, 8k resolution, professional photography, "
                "dramatic lighting, vibrant colors, sharp focus, masterpiece quality, "
                "trending on ArtStation, photorealistic"
            ),
        }
        enhanced = templates.get(
            category,
            f"Act as an expert in {CATEGORY_CONTEXTS.get(category, 'this domain')}. "
            f"Task: {input_text}\n\n"
            "Provide a comprehensive, detailed, and actionable response. "
            "Include relevant context, best practices, and specific recommendations. "
            "Structure your response clearly with examples where appropriate.",
        )
        return {
            "enhanced_prompt": enhanced,
            "tokens_used": None,
            "model_used": "rule-based-fallback",
            "generation_time_ms": 0,
        }


ai_service = AIService()
