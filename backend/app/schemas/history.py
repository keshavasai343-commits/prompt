from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.prompt import PromptCategory, TargetAI


class HistoryResponse(BaseModel):
    id: int
    original_input: str
    enhanced_prompt: str
    category: PromptCategory
    target_ai: TargetAI
    ai_model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    generation_time_ms: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryListResponse(BaseModel):
    items: List[HistoryResponse]
    total: int
    page: int
    page_size: int
