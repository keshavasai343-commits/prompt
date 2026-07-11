from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.prompt import PromptCategory, TargetAI


class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_text: str
    category: PromptCategory = PromptCategory.GENERAL
    target_ai: TargetAI = TargetAI.GENERAL
    is_public: bool = True
    tags: Optional[str] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_text: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[str] = None


class TemplateResponse(TemplateBase):
    id: int
    user_id: Optional[int] = None
    is_system: bool
    use_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    items: List[TemplateResponse]
    total: int
