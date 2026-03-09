from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.sales import schemas, service

router = APIRouter()


@router.post("/orders", response_model=schemas.SaleOrderOut, status_code=201)
async def create_order(
    data: schemas.SaleOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_order(db, data, current_user.id)


@router.get("/orders", response_model=list[schemas.SaleOrderOut])
async def list_orders(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_orders(db, skip, limit)


@router.get("/orders/{order_id}", response_model=schemas.SaleOrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_order(db, order_id)


@router.patch("/orders/{order_id}", response_model=schemas.SaleOrderOut)
async def update_order(
    order_id: int,
    data: schemas.SaleOrderUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_order(db, order_id, data)


@router.delete("/orders/{order_id}", status_code=204)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    await service.delete_order(db, order_id)
