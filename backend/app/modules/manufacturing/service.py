from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.modules.manufacturing.models import BillOfMaterials, BOMLine, WorkOrder
from app.modules.manufacturing.schemas import BOMCreate, BOMUpdate, WorkOrderCreate, WorkOrderUpdate


async def _next_wo_reference(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(WorkOrder.id)))
    count = result.scalar() or 0
    return f"WO-{count + 1:05d}"


# --- BOM ---
async def create_bom(db: AsyncSession, data: BOMCreate) -> BillOfMaterials:
    bom = BillOfMaterials(
        product_id=data.product_id,
        reference=data.reference,
        quantity=data.quantity,
        notes=data.notes,
    )
    db.add(bom)
    await db.flush()

    for line_data in data.components:
        line = BOMLine(bom_id=bom.id, **line_data.model_dump())
        db.add(line)

    await db.flush()
    await db.refresh(bom)
    return bom


async def get_bom(db: AsyncSession, bom_id: int) -> BillOfMaterials:
    result = await db.execute(select(BillOfMaterials).where(BillOfMaterials.id == bom_id))
    bom = result.scalar_one_or_none()
    if not bom:
        raise HTTPException(status_code=404, detail="BOM not found")
    return bom


async def list_boms(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[BillOfMaterials]:
    result = await db.execute(select(BillOfMaterials).offset(skip).limit(limit))
    return result.scalars().all()


async def update_bom(db: AsyncSession, bom_id: int, data: BOMUpdate) -> BillOfMaterials:
    bom = await get_bom(db, bom_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(bom, field, value)
    await db.flush()
    await db.refresh(bom)
    return bom


# --- Work Orders ---
async def create_work_order(db: AsyncSession, data: WorkOrderCreate, user_id: int) -> WorkOrder:
    ref = await _next_wo_reference(db)
    wo = WorkOrder(
        reference=ref,
        responsible_id=data.responsible_id or user_id,
        **{k: v for k, v in data.model_dump().items() if k != "responsible_id"},
    )
    db.add(wo)
    await db.flush()
    await db.refresh(wo)
    return wo


async def get_work_order(db: AsyncSession, wo_id: int) -> WorkOrder:
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == wo_id))
    wo = result.scalar_one_or_none()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return wo


async def list_work_orders(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[WorkOrder]:
    result = await db.execute(select(WorkOrder).offset(skip).limit(limit))
    return result.scalars().all()


async def update_work_order(db: AsyncSession, wo_id: int, data: WorkOrderUpdate) -> WorkOrder:
    wo = await get_work_order(db, wo_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(wo, field, value)
    await db.flush()
    await db.refresh(wo)
    return wo
