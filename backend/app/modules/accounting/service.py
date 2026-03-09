from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.modules.accounting.models import Invoice, InvoiceLine, Payment, InvoiceStatus
from app.modules.accounting.schemas import InvoiceCreate, InvoiceUpdate, PaymentCreate


async def _next_reference(db: AsyncSession, prefix: str) -> str:
    result = await db.execute(select(func.count(Invoice.id)))
    count = result.scalar() or 0
    return f"{prefix}-{count + 1:05d}"


async def create_invoice(db: AsyncSession, data: InvoiceCreate, user_id: int) -> Invoice:
    prefix = "INV" if data.invoice_type == "customer" else "BILL"
    reference = await _next_reference(db, prefix)

    invoice = Invoice(
        reference=reference,
        invoice_type=data.invoice_type,
        partner_name=data.partner_name,
        partner_email=data.partner_email,
        company_id=data.company_id,
        issue_date=data.issue_date,
        due_date=data.due_date,
        notes=data.notes,
        created_by=user_id,
    )
    db.add(invoice)
    await db.flush()

    subtotal = 0.0
    tax_total = 0.0
    for line_data in data.lines:
        line_subtotal = line_data.quantity * line_data.unit_price
        tax = line_subtotal * (line_data.tax_rate / 100)
        line = InvoiceLine(
            invoice_id=invoice.id,
            description=line_data.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            tax_rate=line_data.tax_rate,
            subtotal=line_subtotal,
        )
        db.add(line)
        subtotal += line_subtotal
        tax_total += tax

    invoice.subtotal = subtotal
    invoice.tax_amount = tax_total
    invoice.total_amount = subtotal + tax_total
    await db.flush()
    await db.refresh(invoice)
    return invoice


async def get_invoice(db: AsyncSession, invoice_id: int) -> Invoice:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


async def list_invoices(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Invoice]:
    result = await db.execute(select(Invoice).offset(skip).limit(limit))
    return result.scalars().all()


async def update_invoice(db: AsyncSession, invoice_id: int, data: InvoiceUpdate) -> Invoice:
    inv = await get_invoice(db, invoice_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(inv, field, value)
    await db.flush()
    await db.refresh(inv)
    return inv


async def delete_invoice(db: AsyncSession, invoice_id: int) -> None:
    inv = await get_invoice(db, invoice_id)
    await db.delete(inv)
    await db.flush()


async def add_payment(db: AsyncSession, invoice_id: int, data: PaymentCreate) -> Payment:
    inv = await get_invoice(db, invoice_id)
    payment = Payment(invoice_id=invoice_id, **data.model_dump())
    db.add(payment)

    inv.amount_paid = (inv.amount_paid or 0.0) + data.amount
    if inv.amount_paid >= inv.total_amount:
        inv.status = InvoiceStatus.paid

    await db.flush()
    await db.refresh(payment)
    return payment
