from sqlalchemy.orm import Session
from app.models.template import Template
from app.models.prompt import PromptCategory, TargetAI

SYSTEM_TEMPLATES = [
    # Coding
    {
        "name": "Full-Stack Feature",
        "description": "Generate a complete full-stack feature implementation",
        "template_text": "Act as a senior full-stack engineer. Build {feature} using {tech_stack}. Include: REST API endpoints, database schema, React components, TypeScript types, validation, error handling, unit tests, and documentation.",
        "category": PromptCategory.CODING,
        "target_ai": TargetAI.CHATGPT,
        "is_system": True,
        "tags": "fullstack,feature,api,react",
    },
    {
        "name": "React Component",
        "description": "Create a reusable React component",
        "template_text": "Act as a React expert. Create a reusable {component_name} component with TypeScript, Tailwind CSS, and shadcn/ui. Include: props interface, accessibility (ARIA), responsive design, dark mode support, loading/error states, and JSDoc documentation.",
        "category": PromptCategory.CODING,
        "target_ai": TargetAI.CURSOR,
        "is_system": True,
        "tags": "react,component,typescript,tailwind",
    },
    {
        "name": "Python API Endpoint",
        "description": "Create a FastAPI endpoint",
        "template_text": "Act as a Python backend expert. Create a FastAPI endpoint for {operation}. Include: Pydantic request/response schemas, JWT authentication, input validation, error handling, logging, repository pattern, and pytest unit tests.",
        "category": PromptCategory.CODING,
        "target_ai": TargetAI.COPILOT,
        "is_system": True,
        "tags": "python,fastapi,backend,api",
    },
    # UI/UX
    {
        "name": "Modern UI Page",
        "description": "Design a modern, responsive page",
        "template_text": "Act as a senior UI/UX designer and React developer. Create a modern, responsive {page_name} page. Include: glassmorphism design, smooth animations (Framer Motion), dark/light mode, loading skeletons, mobile-first responsive layout, accessibility (WCAG 2.1 AA), and micro-interactions.",
        "category": PromptCategory.UI_UX,
        "target_ai": TargetAI.CURSOR,
        "is_system": True,
        "tags": "ui,ux,design,responsive,react",
    },
    # Writing
    {
        "name": "Blog Article",
        "description": "Write an SEO-optimized blog article",
        "template_text": "Act as an expert content writer and SEO specialist. Write a comprehensive, engaging blog article about {topic}. Include: compelling headline, SEO-optimized introduction, well-structured sections with H2/H3 headings, actionable insights, statistics, conclusion with CTA, and meta description.",
        "category": PromptCategory.WRITING,
        "target_ai": TargetAI.CHATGPT,
        "is_system": True,
        "tags": "blog,seo,writing,content",
    },
    # Marketing
    {
        "name": "Marketing Campaign",
        "description": "Create a complete marketing campaign",
        "template_text": "Act as a growth marketing expert. Create a comprehensive marketing campaign for {product/service}. Include: target audience analysis, value proposition, campaign messaging, social media strategy, email sequence, ad copy variants, KPIs, and A/B testing plan.",
        "category": PromptCategory.MARKETING,
        "target_ai": TargetAI.CHATGPT,
        "is_system": True,
        "tags": "marketing,campaign,growth,ads",
    },
    # Image Generation
    {
        "name": "Photorealistic Portrait",
        "description": "Generate a photorealistic portrait",
        "template_text": "{subject}, photorealistic, 8K resolution, professional photography, studio lighting, shallow depth of field, sharp focus on face, detailed skin texture, natural colors, Canon EOS R5, 85mm lens, f/1.4 aperture --ar 2:3 --v 6",
        "category": PromptCategory.IMAGE_GENERATION,
        "target_ai": TargetAI.MIDJOURNEY,
        "is_system": True,
        "tags": "portrait,photorealistic,midjourney",
    },
    {
        "name": "Stable Diffusion Art",
        "description": "Generate artistic AI image",
        "template_text": "(masterpiece:1.4), (best quality:1.4), {subject}, {art_style}, highly detailed, intricate details, volumetric lighting, dramatic shadows, vivid colors, 8k uhd --neg (blurry:1.3), (bad anatomy:1.3), (watermark:1.3), (text:1.3), (deformed:1.3)",
        "category": PromptCategory.IMAGE_GENERATION,
        "target_ai": TargetAI.STABLE_DIFFUSION,
        "is_system": True,
        "tags": "stable-diffusion,art,image-generation",
    },
    # Business
    {
        "name": "Business Plan",
        "description": "Create a comprehensive business plan",
        "template_text": "Act as an experienced business consultant and entrepreneur. Create a comprehensive business plan for {business_idea}. Include: executive summary, market analysis, competitive landscape, revenue model, go-to-market strategy, financial projections, risk analysis, and 90-day action plan.",
        "category": PromptCategory.BUSINESS,
        "target_ai": TargetAI.CHATGPT,
        "is_system": True,
        "tags": "business,plan,strategy,startup",
    },
]


def init_db(db: Session) -> None:
    existing_count = db.query(Template).filter(Template.is_system == True).count()  # noqa: E712
    if existing_count > 0:
        return

    for template_data in SYSTEM_TEMPLATES:
        template = Template(**template_data)
        db.add(template)

    db.commit()
