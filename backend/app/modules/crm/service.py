from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.modules.crm.models import Lead, CrmActivity
from app.modules.crm.schemas import LeadCreate, LeadUpdate, ActivityCreate


async def create_lead(db: AsyncSession, data: LeadCreate) -> Lead:
    lead = Lead(**data.model_dump())
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return lead


async def get_lead(db: AsyncSession, lead_id: int) -> Lead:
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


async def list_leads(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Lead]:
    result = await db.execute(select(Lead).offset(skip).limit(limit))
    return result.scalars().all()


async def update_lead(db: AsyncSession, lead_id: int, data: LeadUpdate) -> Lead:
    lead = await get_lead(db, lead_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    await db.flush()
    await db.refresh(lead)
    return lead


async def delete_lead(db: AsyncSession, lead_id: int) -> None:
    lead = await get_lead(db, lead_id)
    await db.delete(lead)


async def add_activity(db: AsyncSession, lead_id: int, user_id: int, data: ActivityCreate) -> CrmActivity:
    await get_lead(db, lead_id)
    activity = CrmActivity(lead_id=lead_id, user_id=user_id, **data.model_dump())
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return activity
