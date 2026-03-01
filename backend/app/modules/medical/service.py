from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.modules.medical.models import Patient, Appointment, MedicalRecord, Prescription, PharmacyItem
from app.modules.medical.schemas import (
    PatientCreate, PatientUpdate,
    AppointmentCreate, AppointmentUpdate,
    MedicalRecordCreate, PrescriptionCreate,
    PharmacyItemCreate,
)


async def _next_patient_code(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(Patient.id)))
    count = result.scalar() or 0
    return f"PAT-{count + 1:05d}"


# --- Patients ---
async def create_patient(db: AsyncSession, data: PatientCreate) -> Patient:
    code = await _next_patient_code(db)
    patient = Patient(patient_code=code, **data.model_dump())
    db.add(patient)
    await db.flush()
    await db.refresh(patient)
    return patient


async def get_patient(db: AsyncSession, patient_id: int) -> Patient:
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p


async def list_patients(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Patient]:
    result = await db.execute(select(Patient).offset(skip).limit(limit))
    return result.scalars().all()


async def update_patient(db: AsyncSession, patient_id: int, data: PatientUpdate) -> Patient:
    p = await get_patient(db, patient_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    await db.flush()
    await db.refresh(p)
    return p


# --- Appointments ---
async def create_appointment(db: AsyncSession, data: AppointmentCreate, doctor_id: int) -> Appointment:
    appt = Appointment(**data.model_dump(), doctor_id=data.doctor_id or doctor_id)
    db.add(appt)
    await db.flush()
    await db.refresh(appt)
    return appt


async def list_appointments(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Appointment]:
    result = await db.execute(select(Appointment).offset(skip).limit(limit))
    return result.scalars().all()


async def update_appointment(db: AsyncSession, appt_id: int, data: AppointmentUpdate) -> Appointment:
    result = await db.execute(select(Appointment).where(Appointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(appt, field, value)
    await db.flush()
    await db.refresh(appt)
    return appt


# --- Medical Records ---
async def create_record(db: AsyncSession, data: MedicalRecordCreate, doctor_id: int) -> MedicalRecord:
    record = MedicalRecord(**data.model_dump(), doctor_id=doctor_id)
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


async def list_records_for_patient(db: AsyncSession, patient_id: int) -> list[MedicalRecord]:
    result = await db.execute(select(MedicalRecord).where(MedicalRecord.patient_id == patient_id))
    return result.scalars().all()


# --- Prescriptions ---
async def create_prescription(db: AsyncSession, data: PrescriptionCreate, doctor_id: int) -> Prescription:
    rx = Prescription(**data.model_dump(), doctor_id=doctor_id)
    db.add(rx)
    await db.flush()
    await db.refresh(rx)
    return rx


async def list_prescriptions_for_patient(db: AsyncSession, patient_id: int) -> list[Prescription]:
    result = await db.execute(select(Prescription).where(Prescription.patient_id == patient_id))
    return result.scalars().all()


# --- Pharmacy ---
async def create_pharmacy_item(db: AsyncSession, data: PharmacyItemCreate) -> PharmacyItem:
    item = PharmacyItem(**data.model_dump())
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def list_pharmacy_items(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[PharmacyItem]:
    result = await db.execute(select(PharmacyItem).offset(skip).limit(limit))
    return result.scalars().all()


async def low_stock_pharmacy(db: AsyncSession) -> list[PharmacyItem]:
    """Return drugs below reorder level."""
    result = await db.execute(
        select(PharmacyItem).where(PharmacyItem.quantity_on_hand <= PharmacyItem.reorder_level)
    )
    return result.scalars().all()
