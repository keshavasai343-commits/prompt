from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator
from app.models.prompt import PromptCategory, TargetAI


class PromptGenerateRequest(BaseModel):
    input_text: str
    category: PromptCategory = PromptCategory.GENERAL
    target_ai: TargetAI = TargetAI.CHATGPT
    ai_model: str = "gpt-4o"
    save_to_history: bool = True

    @field_validator("input_text")
    @classmethod
    def input_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Input text cannot be empty")
        if len(v) > 2000:
            raise ValueError("Input text cannot exceed 2000 characters")
        return v


class PromptGenerateResponse(BaseModel):
    enhanced_prompt: str
    category: PromptCategory
    target_ai: TargetAI
    ai_model_used: str
    tokens_used: Optional[int] = None
    generation_time_ms: Optional[int] = None


class PromptBase(BaseModel):
    title: str
    original_input: str
    enhanced_prompt: str
    category: PromptCategory = PromptCategory.GENERAL
    target_ai: TargetAI = TargetAI.CHATGPT
    is_favorite: bool = False
    is_public: bool = False
    tags: Optional[str] = None


class PromptCreate(PromptBase):
    ai_model_used: Optional[str] = None


class PromptUpdate(BaseModel):
    title: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_public: Optional[bool] = None
    tags: Optional[str] = None
    enhanced_prompt: Optional[str] = None


class PromptResponse(PromptBase):
    id: int
    user_id: int
    ai_model_used: Optional[str] = None
    copy_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PromptListResponse(BaseModel):
    items: List[PromptResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PromptExportRequest(BaseModel):
    prompt_ids: List[int]
    format: str = "json"

    @field_validator("format")
    @classmethod
    def valid_format(cls, v: str) -> str:
        if v not in ("json", "csv", "txt", "md"):
            raise ValueError("Format must be json, csv, txt, or md")
        return v
