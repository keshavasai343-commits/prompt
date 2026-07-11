from typing import List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.prompt import Prompt, PromptCategory, TargetAI
from app.repositories.base_repository import BaseRepository


class PromptRepository(BaseRepository[Prompt]):
    def __init__(self, db: Session):
        super().__init__(Prompt, db)

    def get_user_prompts(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        category: Optional[PromptCategory] = None,
        target_ai: Optional[TargetAI] = None,
        is_favorite: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Prompt], int]:
        query = self.db.query(Prompt).filter(Prompt.user_id == user_id)

        if category:
            query = query.filter(Prompt.category == category)
        if target_ai:
            query = query.filter(Prompt.target_ai == target_ai)
        if is_favorite is not None:
            query = query.filter(Prompt.is_favorite == is_favorite)
        if search:
            query = query.filter(
                or_(
                    Prompt.title.ilike(f"%{search}%"),
                    Prompt.original_input.ilike(f"%{search}%"),
                    Prompt.enhanced_prompt.ilike(f"%{search}%"),
                    Prompt.tags.ilike(f"%{search}%"),
                )
            )

        total = query.count()
        items = query.order_by(Prompt.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def get_public_prompts(self, skip: int = 0, limit: int = 20) -> Tuple[List[Prompt], int]:
        query = self.db.query(Prompt).filter(Prompt.is_public == True)  # noqa: E712
        total = query.count()
        items = query.order_by(Prompt.copy_count.desc()).offset(skip).limit(limit).all()
        return items, total

    def increment_copy_count(self, prompt: Prompt) -> Prompt:
        prompt.copy_count += 1
        return self.update(prompt)
