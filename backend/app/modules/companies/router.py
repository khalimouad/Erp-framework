from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user, require_superadmin
from app.modules.companies import schemas, service

router = APIRouter()


@router.post("/", response_model=schemas.CompanyOut, status_code=201)
async def create_company(
    data: schemas.CompanyCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.create_company(db, data)


@router.get("/", response_model=list[schemas.CompanyOut])
async def list_companies(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_companies(db, skip, limit)


@router.get("/{company_id}", response_model=schemas.CompanyOut)
async def get_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.get_company(db, company_id)


@router.patch("/{company_id}", response_model=schemas.CompanyOut)
async def update_company(
    company_id: int,
    data: schemas.CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.update_company(db, company_id, data)
