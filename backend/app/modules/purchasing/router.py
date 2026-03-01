from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.purchasing import schemas, service

router = APIRouter()


@router.post("/orders", response_model=schemas.POOut, status_code=201)
async def create_po(
    data: schemas.POCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_po(db, data, current_user.id)


@router.get("/orders", response_model=list[schemas.POOut])
async def list_pos(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_pos(db, skip, limit)


@router.get("/orders/{po_id}", response_model=schemas.POOut)
async def get_po(po_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_po(db, po_id)


@router.patch("/orders/{po_id}", response_model=schemas.POOut)
async def update_po(
    po_id: int,
    data: schemas.POUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_po(db, po_id, data)
