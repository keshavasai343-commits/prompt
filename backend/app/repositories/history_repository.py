from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.history import PromptHistory
from app.repositories.base_repository import BaseRepository


class HistoryRepository(BaseRepository[PromptHistory]):
    def __init__(self, db: Session):
        super().__init__(PromptHistory, db)

    def get_user_history(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> Tuple[List[PromptHistory], int]:
        query = self.db.query(PromptHistory).filter(PromptHistory.user_id == user_id)
        total = query.count()
        items = query.order_by(PromptHistory.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def clear_user_history(self, user_id: int) -> int:
        count = self.db.query(PromptHistory).filter(PromptHistory.user_id == user_id).delete()
        self.db.commit()
        return count
