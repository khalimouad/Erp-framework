from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.modules.sales.models import SaleOrder, SaleOrderLine
from app.modules.sales.schemas import SaleOrderCreate, SaleOrderUpdate


async def _next_reference(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(SaleOrder.id)))
    count = result.scalar() or 0
    return f"SO-{count + 1:05d}"


async def create_order(db: AsyncSession, data: SaleOrderCreate, user_id: int) -> SaleOrder:
    reference = await _next_reference(db)
    order = SaleOrder(
        reference=reference,
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        company_id=data.company_id,
        salesperson_id=data.salesperson_id or user_id,
        notes=data.notes,
    )
    db.add(order)
    await db.flush()

    total = 0.0
    for line_data in data.lines:
        subtotal = line_data.quantity * line_data.unit_price
        line = SaleOrderLine(
            order_id=order.id,
            product_id=line_data.product_id,
            description=line_data.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            subtotal=subtotal,
        )
        db.add(line)
        total += subtotal

    order.total_amount = total
    await db.flush()
    await db.refresh(order)
    return order


async def get_order(db: AsyncSession, order_id: int) -> SaleOrder:
    result = await db.execute(
        select(SaleOrder).where(SaleOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Sale order not found")
    return order


async def list_orders(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[SaleOrder]:
    result = await db.execute(select(SaleOrder).offset(skip).limit(limit))
    return result.scalars().all()


async def update_order(db: AsyncSession, order_id: int, data: SaleOrderUpdate) -> SaleOrder:
    order = await get_order(db, order_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    await db.flush()
    await db.refresh(order)
    return order


async def delete_order(db: AsyncSession, order_id: int) -> None:
    order = await get_order(db, order_id)
    await db.delete(order)
    await db.flush()
