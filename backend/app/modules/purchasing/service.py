from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.modules.purchasing.models import PurchaseOrder, PurchaseOrderLine
from app.modules.purchasing.schemas import POCreate, POUpdate


async def _next_reference(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(PurchaseOrder.id)))
    count = result.scalar() or 0
    return f"PO-{count + 1:05d}"


async def create_po(db: AsyncSession, data: POCreate, user_id: int) -> PurchaseOrder:
    reference = await _next_reference(db)
    po = PurchaseOrder(
        reference=reference,
        vendor_name=data.vendor_name,
        vendor_email=data.vendor_email,
        company_id=data.company_id,
        buyer_id=user_id,
        notes=data.notes,
        expected_delivery=data.expected_delivery,
    )
    db.add(po)
    await db.flush()

    total = 0.0
    for line_data in data.lines:
        subtotal = line_data.quantity * line_data.unit_price
        line = PurchaseOrderLine(
            order_id=po.id,
            product_id=line_data.product_id,
            description=line_data.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            subtotal=subtotal,
        )
        db.add(line)
        total += subtotal

    po.total_amount = total
    await db.flush()
    await db.refresh(po)
    return po


async def get_po(db: AsyncSession, po_id: int) -> PurchaseOrder:
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == po_id))
    po = result.scalar_one_or_none()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


async def list_pos(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[PurchaseOrder]:
    result = await db.execute(select(PurchaseOrder).offset(skip).limit(limit))
    return result.scalars().all()


async def update_po(db: AsyncSession, po_id: int, data: POUpdate) -> PurchaseOrder:
    po = await get_po(db, po_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(po, field, value)
    await db.flush()
    await db.refresh(po)
    return po


async def delete_po(db: AsyncSession, po_id: int) -> None:
    po = await get_po(db, po_id)
    await db.delete(po)
    await db.flush()
