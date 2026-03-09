from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.medical import schemas, service

router = APIRouter()

# ---- Patients ----

@router.post("/patients", response_model=schemas.PatientOut, status_code=201)
async def create_patient(
    data: schemas.PatientCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.create_patient(db, data)


@router.get("/patients", response_model=list[schemas.PatientOut])
async def list_patients(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_patients(db, skip, limit)


@router.get("/patients/{patient_id}", response_model=schemas.PatientOut)
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_patient(db, patient_id)


@router.patch("/patients/{patient_id}", response_model=schemas.PatientOut)
async def update_patient(
    patient_id: int,
    data: schemas.PatientUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_patient(db, patient_id, data)


@router.get("/patients/{patient_id}/records", response_model=list[schemas.MedicalRecordOut])
async def get_patient_records(patient_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.list_records_for_patient(db, patient_id)


@router.get("/patients/{patient_id}/prescriptions", response_model=list[schemas.PrescriptionOut])
async def get_patient_prescriptions(patient_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.list_prescriptions_for_patient(db, patient_id)


# ---- Appointments ----

@router.post("/appointments", response_model=schemas.AppointmentOut, status_code=201)
async def create_appointment(
    data: schemas.AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_appointment(db, data, current_user.id)


@router.get("/appointments", response_model=list[schemas.AppointmentOut])
async def list_appointments(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_appointments(db, skip, limit)


@router.patch("/appointments/{appt_id}", response_model=schemas.AppointmentOut)
async def update_appointment(
    appt_id: int,
    data: schemas.AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_appointment(db, appt_id, data)


# ---- Medical Records ----

@router.post("/records", response_model=schemas.MedicalRecordOut, status_code=201)
async def create_record(
    data: schemas.MedicalRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_record(db, data, current_user.id)


# ---- Prescriptions ----

@router.post("/prescriptions", response_model=schemas.PrescriptionOut, status_code=201)
async def create_prescription(
    data: schemas.PrescriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.create_prescription(db, data, current_user.id)


# ---- Pharmacy ----

@router.post("/pharmacy", response_model=schemas.PharmacyItemOut, status_code=201)
async def create_pharmacy_item(
    data: schemas.PharmacyItemCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.create_pharmacy_item(db, data)


@router.get("/pharmacy", response_model=list[schemas.PharmacyItemOut])
async def list_pharmacy(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_pharmacy_items(db, skip, limit)


@router.patch("/pharmacy/{item_id}", response_model=schemas.PharmacyItemOut)
async def update_pharmacy_item(
    item_id: int,
    data: schemas.PharmacyItemUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_pharmacy_item(db, item_id, data)


@router.get("/pharmacy/low-stock", response_model=list[schemas.PharmacyItemOut])
async def low_stock(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.low_stock_pharmacy(db)
