from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.crm import schemas, service

router = APIRouter()


@router.post("/leads", response_model=schemas.LeadOut, status_code=201)
async def create_lead(
    data: schemas.LeadCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.create_lead(db, data)


@router.get("/leads", response_model=list[schemas.LeadOut])
async def list_leads(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_leads(db, skip, limit)


@router.get("/leads/{lead_id}", response_model=schemas.LeadOut)
async def get_lead(lead_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_lead(db, lead_id)


@router.patch("/leads/{lead_id}", response_model=schemas.LeadOut)
async def update_lead(
    lead_id: int,
    data: schemas.LeadUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_lead(db, lead_id, data)


@router.delete("/leads/{lead_id}", status_code=204)
async def delete_lead(lead_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    await service.delete_lead(db, lead_id)


@router.post("/leads/{lead_id}/activities", response_model=schemas.ActivityOut, status_code=201)
async def add_activity(
    lead_id: int,
    data: schemas.ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.add_activity(db, lead_id, current_user.id, data)
