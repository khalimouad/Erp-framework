from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.manufacturing import schemas, service

router = APIRouter()

# ---- Bill of Materials ----

@router.post("/bom", response_model=schemas.BOMOut, status_code=201)
async def create_bom(
    data: schemas.BOMCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.create_bom(db, data)


@router.get("/bom", response_model=list[schemas.BOMOut])
async def list_boms(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_boms(db, skip, limit)


@router.get("/bom/{bom_id}", response_model=schemas.BOMOut)
async def get_bom(bom_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_bom(db, bom_id)


@router.patch("/bom/{bom_id}", response_model=schemas.BOMOut)
async def update_bom(
    bom_id: int,
    data: schemas.BOMUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_bom(db, bom_id, data)


# ---- Work Orders ----

@router.post("/work-orders", response_model=schemas.WorkOrderOut, status_code=201)
async def create_work_order(
    data: schemas.WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_work_order(db, data, current_user.id)


@router.get("/work-orders", response_model=list[schemas.WorkOrderOut])
async def list_work_orders(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_work_orders(db, skip, limit)


@router.get("/work-orders/{wo_id}", response_model=schemas.WorkOrderOut)
async def get_work_order(wo_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_work_order(db, wo_id)


@router.patch("/work-orders/{wo_id}", response_model=schemas.WorkOrderOut)
async def update_work_order(
    wo_id: int,
    data: schemas.WorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_work_order(db, wo_id, data)
