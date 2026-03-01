from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.modules.companies.models import Company
from app.modules.companies.schemas import CompanyCreate, CompanyUpdate


async def create_company(db: AsyncSession, data: CompanyCreate) -> Company:
    company = Company(**data.model_dump())
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


async def get_company(db: AsyncSession, company_id: int) -> Company:
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


async def list_companies(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Company]:
    result = await db.execute(select(Company).offset(skip).limit(limit))
    return result.scalars().all()


async def update_company(db: AsyncSession, company_id: int, data: CompanyUpdate) -> Company:
    company = await get_company(db, company_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    await db.flush()
    await db.refresh(company)
    return company
