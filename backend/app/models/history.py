from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.prompt import PromptCategory, TargetAI


class PromptHistory(Base):
    __tablename__ = "prompt_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_input = Column(Text, nullable=False)
    enhanced_prompt = Column(Text, nullable=False)
    category = Column(Enum(PromptCategory), default=PromptCategory.GENERAL)
    target_ai = Column(Enum(TargetAI), default=TargetAI.CHATGPT)
    ai_model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    generation_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="history")
