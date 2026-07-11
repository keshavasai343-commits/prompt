import csv
import io
import json
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.prompt import Prompt, PromptCategory, TargetAI
from app.models.history import PromptHistory
from app.models.user import User
from app.repositories.prompt_repository import PromptRepository
from app.repositories.history_repository import HistoryRepository
from app.schemas.prompt import (
    PromptCreate,
    PromptGenerateRequest,
    PromptGenerateResponse,
    PromptListResponse,
    PromptResponse,
    PromptUpdate,
)
from app.services.ai_service import ai_service


class PromptService:
    def __init__(self, db: Session):
        self.prompt_repo = PromptRepository(db)
        self.history_repo = HistoryRepository(db)

    async def generate(
        self, request: PromptGenerateRequest, user: User
    ) -> PromptGenerateResponse:
        result = await ai_service.enhance_prompt(
            input_text=request.input_text,
            category=request.category,
            target_ai=request.target_ai,
            model=request.ai_model,
        )

        if request.save_to_history:
            history = PromptHistory(
                user_id=user.id,
                original_input=request.input_text,
                enhanced_prompt=result["enhanced_prompt"],
                category=request.category,
                target_ai=request.target_ai,
                ai_model_used=result.get("model_used"),
                tokens_used=result.get("tokens_used"),
                generation_time_ms=result.get("generation_time_ms"),
            )
            self.history_repo.create(history)

        return PromptGenerateResponse(
            enhanced_prompt=result["enhanced_prompt"],
            category=request.category,
            target_ai=request.target_ai,
            ai_model_used=result.get("model_used", request.ai_model),
            tokens_used=result.get("tokens_used"),
            generation_time_ms=result.get("generation_time_ms"),
        )

    def save_prompt(self, data: PromptCreate, user: User) -> PromptResponse:
        prompt = Prompt(
            user_id=user.id,
            title=data.title,
            original_input=data.original_input,
            enhanced_prompt=data.enhanced_prompt,
            category=data.category,
            target_ai=data.target_ai,
            ai_model_used=data.ai_model_used,
            is_favorite=data.is_favorite,
            is_public=data.is_public,
            tags=data.tags,
        )
        prompt = self.prompt_repo.create(prompt)
        return PromptResponse.model_validate(prompt)

    def get_prompts(
        self,
        user: User,
        page: int = 1,
        page_size: int = 20,
        category: Optional[PromptCategory] = None,
        target_ai: Optional[TargetAI] = None,
        is_favorite: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> PromptListResponse:
        skip = (page - 1) * page_size
        items, total = self.prompt_repo.get_user_prompts(
            user_id=user.id,
            skip=skip,
            limit=page_size,
            category=category,
            target_ai=target_ai,
            is_favorite=is_favorite,
            search=search,
        )
        total_pages = (total + page_size - 1) // page_size
        return PromptListResponse(
            items=[PromptResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_prompt(self, prompt_id: int, user: User) -> PromptResponse:
        prompt = self.prompt_repo.get_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
        if prompt.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return PromptResponse.model_validate(prompt)

    def update_prompt(self, prompt_id: int, data: PromptUpdate, user: User) -> PromptResponse:
        prompt = self.prompt_repo.get_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
        if prompt.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(prompt, field, value)

        prompt = self.prompt_repo.update(prompt)
        return PromptResponse.model_validate(prompt)

    def delete_prompt(self, prompt_id: int, user: User) -> None:
        prompt = self.prompt_repo.get_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
        if prompt.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        self.prompt_repo.delete(prompt)

    def copy_prompt(self, prompt_id: int, user: User) -> PromptResponse:
        prompt = self.prompt_repo.get_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prompt not found")
        if prompt.user_id != user.id and not prompt.is_public:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        self.prompt_repo.increment_copy_count(prompt)
        return PromptResponse.model_validate(prompt)

    def export_prompts(self, prompt_ids: List[int], format: str, user: User) -> tuple[str, str]:
        prompts = [
            self.prompt_repo.get_by_id(pid)
            for pid in prompt_ids
            if self.prompt_repo.get_by_id(pid) and self.prompt_repo.get_by_id(pid).user_id == user.id
        ]

        if format == "json":
            data = json.dumps(
                [PromptResponse.model_validate(p).model_dump(mode="json") for p in prompts],
                indent=2,
            )
            return data, "application/json"

        if format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(
                output,
                fieldnames=["id", "title", "original_input", "enhanced_prompt", "category", "target_ai", "created_at"],
            )
            writer.writeheader()
            for p in prompts:
                writer.writerow({
                    "id": p.id,
                    "title": p.title,
                    "original_input": p.original_input,
                    "enhanced_prompt": p.enhanced_prompt,
                    "category": p.category.value,
                    "target_ai": p.target_ai.value,
                    "created_at": p.created_at.isoformat(),
                })
            return output.getvalue(), "text/csv"

        if format == "md":
            lines = []
            for p in prompts:
                lines.append(f"# {p.title}\n")
                lines.append(f"**Category:** {p.category.value}  \n")
                lines.append(f"**Target AI:** {p.target_ai.value}  \n\n")
                lines.append(f"**Original Input:**\n{p.original_input}\n\n")
                lines.append(f"**Enhanced Prompt:**\n{p.enhanced_prompt}\n\n---\n\n")
            return "".join(lines), "text/markdown"

        # txt
        lines = [f"{p.title}\n{p.enhanced_prompt}\n\n{'='*60}\n\n" for p in prompts]
        return "".join(lines), "text/plain"
