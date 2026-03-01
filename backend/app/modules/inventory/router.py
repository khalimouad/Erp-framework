from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.inventory import schemas, service

router = APIRouter()


@router.post("/products", response_model=schemas.ProductOut, status_code=201)
async def create_product(
    data: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.create_product(db, data)


@router.get("/products", response_model=list[schemas.ProductOut])
async def list_products(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_products(db, skip, limit)


@router.get("/products/{product_id}", response_model=schemas.ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_product(db, product_id)


@router.patch("/products/{product_id}", response_model=schemas.ProductOut)
async def update_product(
    product_id: int,
    data: schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_product(db, product_id, data)


@router.post("/stock-moves", response_model=schemas.StockMoveOut, status_code=201)
async def record_stock_move(
    data: schemas.StockMoveCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.record_stock_move(db, data, current_user.id)


@router.get("/stock-level", response_model=schemas.StockLevelOut)
async def get_stock_level(
    product_id: int,
    warehouse_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    qty = await service.get_stock_level(db, product_id, warehouse_id)
    return {"product_id": product_id, "warehouse_id": warehouse_id, "quantity_on_hand": qty}
