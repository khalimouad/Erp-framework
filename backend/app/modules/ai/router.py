from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.auth import get_current_user
from . import service

router = APIRouter()


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str


@router.post("/ask", response_model=AskResponse, summary="Ask the AI assistant")
async def ask(
    body: AskRequest,
    _: object = Depends(get_current_user),
) -> AskResponse:
    answer = await service.ask(body.question.strip())
    return AskResponse(answer=answer)
