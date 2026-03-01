from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.modules.inventory.models import Product, StockMove
from app.modules.inventory.schemas import ProductCreate, ProductUpdate, StockMoveCreate


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


async def get_product(db: AsyncSession, product_id: int) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def list_products(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Product]:
    result = await db.execute(select(Product).offset(skip).limit(limit))
    return result.scalars().all()


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    product = await get_product(db, product_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.flush()
    await db.refresh(product)
    return product


async def record_stock_move(db: AsyncSession, data: StockMoveCreate, user_id: int) -> StockMove:
    if data.move_type not in ("in", "out", "adjustment"):
        raise HTTPException(status_code=400, detail="move_type must be 'in', 'out', or 'adjustment'")
    move = StockMove(**data.model_dump(), created_by=user_id)
    db.add(move)
    await db.flush()
    await db.refresh(move)
    return move


async def get_stock_level(db: AsyncSession, product_id: int, warehouse_id: int) -> float:
    result = await db.execute(
        select(
            func.coalesce(
                func.sum(
                    func.case(
                        (StockMove.move_type == "in", StockMove.quantity),
                        (StockMove.move_type == "out", -StockMove.quantity),
                        else_=StockMove.quantity,
                    )
                ),
                0.0,
            )
        ).where(
            StockMove.product_id == product_id,
            StockMove.warehouse_id == warehouse_id,
        )
    )
    return result.scalar()
