from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.prompt import PromptCategory, TargetAI
from app.models.user import User
from app.schemas.prompt import (
    PromptCreate,
    PromptExportRequest,
    PromptGenerateRequest,
    PromptGenerateResponse,
    PromptListResponse,
    PromptResponse,
    PromptUpdate,
)
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/prompts", tags=["Prompts"])


@router.post("/generate", response_model=PromptGenerateResponse)
async def generate_prompt(
    request: PromptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await PromptService(db).generate(request, current_user)


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def save_prompt(
    data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptService(db).save_prompt(data, current_user)


@router.get("", response_model=PromptListResponse)
def list_prompts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[PromptCategory] = Query(None),
    target_ai: Optional[TargetAI] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptService(db).get_prompts(
        user=current_user,
        page=page,
        page_size=page_size,
        category=category,
        target_ai=target_ai,
        is_favorite=is_favorite,
        search=search,
    )


@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptService(db).get_prompt(prompt_id, current_user)


@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    prompt_id: int,
    data: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptService(db).update_prompt(prompt_id, data, current_user)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    PromptService(db).delete_prompt(prompt_id, current_user)


@router.post("/{prompt_id}/copy", response_model=PromptResponse)
def copy_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return PromptService(db).copy_prompt(prompt_id, current_user)


@router.post("/export", response_class=Response)
def export_prompts(
    request: PromptExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content, media_type = PromptService(db).export_prompts(
        request.prompt_ids, request.format, current_user
    )
    ext_map = {"application/json": "json", "text/csv": "csv", "text/markdown": "md", "text/plain": "txt"}
    ext = ext_map.get(media_type, "txt")
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=prompts.{ext}"},
    )
