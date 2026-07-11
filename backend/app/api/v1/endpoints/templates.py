from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.prompt import PromptCategory, TargetAI
from app.models.template import Template
from app.models.user import User
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import TemplateCreate, TemplateListResponse, TemplateResponse, TemplateUpdate

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.get("", response_model=TemplateListResponse)
def list_templates(
    category: Optional[PromptCategory] = Query(None),
    target_ai: Optional[TargetAI] = Query(None),
    search: Optional[str] = Query(None, max_length=200),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = TemplateRepository(db)
    items, total = repo.get_templates(
        user_id=current_user.id,
        category=category,
        target_ai=target_ai,
        search=search,
        skip=skip,
        limit=limit,
    )
    return TemplateListResponse(items=[TemplateResponse.model_validate(t) for t in items], total=total)


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    data: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = TemplateRepository(db)
    template = Template(user_id=current_user.id, **data.model_dump())
    return TemplateResponse.model_validate(repo.create(template))


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    data: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    repo = TemplateRepository(db)
    template = repo.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(template, field, value)
    return TemplateResponse.model_validate(repo.update(template))


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    repo = TemplateRepository(db)
    template = repo.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.user_id != current_user.id or template.is_system:
        raise HTTPException(status_code=403, detail="Access denied")
    repo.delete(template)


@router.post("/{template_id}/use", response_model=TemplateResponse)
def use_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    repo = TemplateRepository(db)
    template = repo.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateResponse.model_validate(repo.increment_use_count(template))
