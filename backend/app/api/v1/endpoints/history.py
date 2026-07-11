from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.repositories.history_repository import HistoryRepository
from app.schemas.history import HistoryListResponse, HistoryResponse

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryListResponse)
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = HistoryRepository(db)
    skip = (page - 1) * page_size
    items, total = repo.get_user_history(current_user.id, skip=skip, limit=page_size)
    return HistoryListResponse(
        items=[HistoryResponse.model_validate(h) for h in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    HistoryRepository(db).clear_user_history(current_user.id)
