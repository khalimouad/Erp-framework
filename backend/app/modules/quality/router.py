from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.quality import schemas, service

router = APIRouter()


@router.post("/", response_model=schemas.QCOut, status_code=201)
async def create_qc(
    data: schemas.QCCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_qc(db, data, current_user.id)


@router.get("/", response_model=list[schemas.QCOut])
async def list_qcs(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_qcs(db, skip, limit)


@router.get("/{qc_id}", response_model=schemas.QCOut)
async def get_qc(qc_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_qc(db, qc_id)


@router.patch("/{qc_id}", response_model=schemas.QCOut)
async def update_qc(
    qc_id: int,
    data: schemas.QCUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_qc(db, qc_id, data)
