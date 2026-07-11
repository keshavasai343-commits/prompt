from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base


class PromptCategory(str, enum.Enum):
    CODING = "coding"
    UI_UX = "ui_ux"
    WRITING = "writing"
    MARKETING = "marketing"
    BUSINESS = "business"
    IMAGE_GENERATION = "image_generation"
    DATA_SCIENCE = "data_science"
    DEVOPS = "devops"
    GENERAL = "general"


class TargetAI(str, enum.Enum):
    CHATGPT = "chatgpt"
    CLAUDE = "claude"
    GEMINI = "gemini"
    CURSOR = "cursor"
    COPILOT = "copilot"
    MIDJOURNEY = "midjourney"
    STABLE_DIFFUSION = "stable_diffusion"
    GROK = "grok"
    GENERAL = "general"


class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    original_input = Column(Text, nullable=False)
    enhanced_prompt = Column(Text, nullable=False)
    category = Column(
        Enum(PromptCategory), default=PromptCategory.GENERAL, nullable=False
    )
    target_ai = Column(Enum(TargetAI), default=TargetAI.CHATGPT, nullable=False)
    ai_model_used = Column(String(100), nullable=True)
    is_favorite = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    tags = Column(String(500), nullable=True)
    copy_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="prompts")
