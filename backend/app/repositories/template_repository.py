from typing import List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.template import Template
from app.models.prompt import PromptCategory, TargetAI
from app.repositories.base_repository import BaseRepository


class TemplateRepository(BaseRepository[Template]):
    def __init__(self, db: Session):
        super().__init__(Template, db)

    def get_templates(
        self,
        user_id: Optional[int] = None,
        category: Optional[PromptCategory] = None,
        target_ai: Optional[TargetAI] = None,
        search: Optional[str] = None,
        include_system: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Template], int]:
        query = self.db.query(Template).filter(
            or_(
                Template.is_system == True,  # noqa: E712
                Template.is_public == True,  # noqa: E712
                Template.user_id == user_id if user_id else False,
            )
        )

        if not include_system:
            query = query.filter(Template.is_system == False)  # noqa: E712
        if category:
            query = query.filter(Template.category == category)
        if target_ai:
            query = query.filter(Template.target_ai == target_ai)
        if search:
            query = query.filter(
                or_(
                    Template.name.ilike(f"%{search}%"),
                    Template.description.ilike(f"%{search}%"),
                )
            )

        total = query.count()
        items = query.order_by(Template.use_count.desc()).offset(skip).limit(limit).all()
        return items, total

    def increment_use_count(self, template: Template) -> Template:
        template.use_count += 1
        return self.update(template)
