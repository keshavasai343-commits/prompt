import time
from typing import Optional
from loguru import logger
from openai import OpenAI, AsyncOpenAI
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


def build_enhancement_prompt(
    input_text: str,
    category: PromptCategory,
    target_ai: TargetAI,
) -> str:
    category_ctx = CATEGORY_CONTEXTS.get(category, CATEGORY_CONTEXTS[PromptCategory.GENERAL])
    target_ctx = TARGET_AI_CONTEXTS.get(target_ai, TARGET_AI_CONTEXTS[TargetAI.GENERAL])

    return f"""Transform this simple input into a detailed, high-quality AI prompt.

Domain: {category_ctx}
Target AI: {target_ctx}

User Input: "{input_text}"

Create an enhanced prompt that is specific, actionable, and optimized for {target_ctx}"""


class AIService:
    def __init__(self):
        self._openai_client: Optional[AsyncOpenAI] = None
        self._openai_sync: Optional[OpenAI] = None

    @property
    def openai_client(self) -> AsyncOpenAI:
        if not self._openai_client:
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    @property
    def openai_sync(self) -> OpenAI:
        if not self._openai_sync:
            self._openai_sync = OpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_sync

    async def enhance_prompt(
        self,
        input_text: str,
        category: PromptCategory,
        target_ai: TargetAI,
        model: str = "gpt-4o",
    ) -> dict:
        start_time = time.time()

        user_prompt = build_enhancement_prompt(input_text, category, target_ai)

        try:
            if model.startswith("claude"):
                result = await self._call_claude(user_prompt, model)
            elif model.startswith("gemini"):
                result = await self._call_gemini(user_prompt, model)
            elif model.startswith("grok") or model.startswith("grok"):
                result = await self._call_grok(user_prompt, model)
            else:
                result = await self._call_openai(user_prompt, model)

            elapsed_ms = int((time.time() - start_time) * 1000)
            result["generation_time_ms"] = elapsed_ms
            return result

        except Exception as e:
            logger.error(f"AI enhancement failed with model {model}: {e}")
            # Fallback to rule-based enhancement
            return self._rule_based_enhance(input_text, category, target_ai)

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

    async def _call_gemini(self, user_prompt: str, model: str) -> dict:
        import google.generativeai as genai

        genai.configure(api_key=settings.GOOGLE_API_KEY)
        gemini_model = genai.GenerativeModel(model)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"
        response = await gemini_model.generate_content_async(full_prompt)
        return {
            "enhanced_prompt": response.text.strip(),
            "tokens_used": None,
            "model_used": model,
        }

    async def _call_grok(self, user_prompt: str, model: str) -> dict:
        client = AsyncOpenAI(
            api_key=settings.XAI_API_KEY,
            base_url="https://api.x.ai/v1",
        )
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

    def _rule_based_enhance(
        self, input_text: str, category: PromptCategory, target_ai: TargetAI
    ) -> dict:
        """Fallback when AI APIs are unavailable."""
        templates = {
            PromptCategory.CODING: (
                f"Act as a senior software engineer with 10+ years of experience. "
                f"Your task: {input_text}\n\n"
                f"Requirements:\n"
                f"- Write clean, production-ready code following SOLID principles\n"
                f"- Include comprehensive error handling and input validation\n"
                f"- Add TypeScript types/interfaces where applicable\n"
                f"- Follow best practices for the relevant tech stack\n"
                f"- Include unit tests for critical functionality\n"
                f"- Document complex logic with clear comments\n"
                f"- Ensure the code is scalable, maintainable, and performant"
            ),
            PromptCategory.IMAGE_GENERATION: (
                f"{input_text}, highly detailed, 8k resolution, professional photography, "
                f"dramatic lighting, vibrant colors, sharp focus, masterpiece quality, "
                f"trending on ArtStation, photorealistic"
            ),
        }

        enhanced = templates.get(
            category,
            f"Act as an expert in {CATEGORY_CONTEXTS.get(category, 'this domain')}. "
            f"Task: {input_text}\n\n"
            f"Provide a comprehensive, detailed, and actionable response. "
            f"Include relevant context, best practices, and specific recommendations. "
            f"Structure your response clearly with examples where appropriate.",
        )

        return {
            "enhanced_prompt": enhanced,
            "tokens_used": None,
            "model_used": "rule-based-fallback",
            "generation_time_ms": 0,
        }


ai_service = AIService()
