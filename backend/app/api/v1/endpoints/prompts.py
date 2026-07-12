import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from loguru import logger
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.history import PromptHistory
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
from app.repositories.history_repository import HistoryRepository
from app.services.ai_service import ai_service
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/prompts", tags=["Prompts"])


@router.post("/generate", response_model=PromptGenerateResponse)
async def generate_prompt(
    request: PromptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate enhanced prompt with all variants and analysis (single response)."""
    return await PromptService(db).generate(request, current_user)


@router.post("/generate/stream")
async def generate_prompt_stream(
    request: PromptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream the expert prompt as a typewriter effect, then send the full structured result.

    Events:
      data: {"type": "token",    "text": "..."}          — expert prompt tokens
      data: {"type": "complete", "data": {...full data}}  — final structured result
      data: {"type": "error",    "message": "..."}        — error
      data: [DONE]                                         — stream end
    """
    async def sse_generator():
        import time as _t
        start = _t.time()
        try:
            result = await ai_service.enhance_prompt(
                input_text=request.input_text,
                category=request.category,
                target_ai=request.target_ai,
                model=request.ai_model,
            )

            if request.save_to_history:
                HistoryRepository(db).create(PromptHistory(
                    user_id=current_user.id,
                    original_input=request.input_text,
                    enhanced_prompt=result["enhanced_prompt"],
                    category=request.category,
                    target_ai=request.target_ai,
                    ai_model_used=result.get("model_used"),
                    tokens_used=result.get("tokens_used"),
                    generation_time_ms=result.get("generation_time_ms"),
                ))

            expert_text: str = result.get("expert_prompt") or result.get("enhanced_prompt", "")
            CHUNK = 8
            for i in range(0, len(expert_text), CHUNK):
                chunk = expert_text[i: i + CHUNK]
                yield f"data: {json.dumps({'type': 'token', 'text': chunk})}\n\n"
                await asyncio.sleep(0.015)

            result["category"] = request.category.value
            result["target_ai"] = request.target_ai.value
            result["ai_model_used"] = result.get("model_used", request.ai_model)
            result["generation_time_ms"] = int((_t.time() - start) * 1000)
            yield f"data: {json.dumps({'type': 'complete', 'data': result}, default=str)}\n\n"

        except Exception as exc:
            import traceback as _tb
            logger.error(f"SSE generator error: {''.join(_tb.format_exception(type(exc), exc, exc.__traceback__))}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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
    ext_map = {
        "application/json": "json",
        "text/csv": "csv",
        "text/markdown": "md",
        "text/plain": "txt",
    }
    ext = ext_map.get(media_type, "txt")
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=prompts.{ext}"},
    )
