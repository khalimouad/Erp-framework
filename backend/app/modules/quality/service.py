from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.modules.quality.models import QualityCheck
from app.modules.quality.schemas import QCCreate, QCUpdate


async def _next_reference(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(QualityCheck.id)))
    count = result.scalar() or 0
    return f"QC-{count + 1:05d}"


async def create_qc(db: AsyncSession, data: QCCreate, inspector_id: int) -> QualityCheck:
    ref = await _next_reference(db)
    qc = QualityCheck(reference=ref, inspector_id=inspector_id, **data.model_dump())
    db.add(qc)
    await db.flush()
    await db.refresh(qc)
    return qc


async def get_qc(db: AsyncSession, qc_id: int) -> QualityCheck:
    result = await db.execute(select(QualityCheck).where(QualityCheck.id == qc_id))
    qc = result.scalar_one_or_none()
    if not qc:
        raise HTTPException(status_code=404, detail="QC check not found")
    return qc


async def list_qcs(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[QualityCheck]:
    result = await db.execute(select(QualityCheck).offset(skip).limit(limit))
    return result.scalars().all()


async def update_qc(db: AsyncSession, qc_id: int, data: QCUpdate) -> QualityCheck:
    qc = await get_qc(db, qc_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(qc, field, value)
    await db.flush()
    await db.refresh(qc)
    return qc
