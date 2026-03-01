from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.accounting import schemas, service

router = APIRouter()


@router.post("/invoices", response_model=schemas.InvoiceOut, status_code=201)
async def create_invoice(
    data: schemas.InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_invoice(db, data, current_user.id)


@router.get("/invoices", response_model=list[schemas.InvoiceOut])
async def list_invoices(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_invoices(db, skip, limit)


@router.get("/invoices/{invoice_id}", response_model=schemas.InvoiceOut)
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_invoice(db, invoice_id)


@router.patch("/invoices/{invoice_id}", response_model=schemas.InvoiceOut)
async def update_invoice(
    invoice_id: int,
    data: schemas.InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_invoice(db, invoice_id, data)


@router.post("/invoices/{invoice_id}/payments", response_model=schemas.PaymentOut, status_code=201)
async def add_payment(
    invoice_id: int,
    data: schemas.PaymentCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.add_payment(db, invoice_id, data)
