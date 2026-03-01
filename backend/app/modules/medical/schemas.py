from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from app.modules.medical.models import Gender, AppointmentStatus


# ---- Patient ----
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    blood_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    company_id: Optional[int] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    is_active: Optional[bool] = None


class PatientOut(BaseModel):
    id: int
    patient_code: str
    first_name: str
    last_name: str
    date_of_birth: Optional[date]
    gender: Optional[Gender]
    blood_type: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    allergies: Optional[str]
    chronic_conditions: Optional[str]
    insurance_provider: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Appointment ----
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    appointment_date: datetime
    duration_minutes: int = 30
    appointment_type: Optional[str] = None
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int]
    appointment_date: datetime
    duration_minutes: int
    appointment_type: Optional[str]
    status: AppointmentStatus
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Medical Record ----
class MedicalRecordCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    notes: Optional[str] = None


class MedicalRecordOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int]
    appointment_id: Optional[int]
    chief_complaint: Optional[str]
    diagnosis: Optional[str]
    treatment_plan: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Prescription ----
class PrescriptionCreate(BaseModel):
    patient_id: int
    medication_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    refills_remaining: int = 0


class PrescriptionOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int]
    medication_name: str
    dosage: Optional[str]
    frequency: Optional[str]
    duration: Optional[str]
    instructions: Optional[str]
    refills_remaining: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Pharmacy ----
class PharmacyItemCreate(BaseModel):
    drug_name: str
    generic_name: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    quantity_on_hand: float = 0.0
    reorder_level: float = 10.0
    unit_cost: float = 0.0
    unit_price: float = 0.0
    expiry_date: Optional[date] = None


class PharmacyItemOut(BaseModel):
    id: int
    drug_name: str
    generic_name: Optional[str]
    dosage_form: Optional[str]
    strength: Optional[str]
    quantity_on_hand: float
    reorder_level: float
    unit_cost: float
    unit_price: float
    expiry_date: Optional[date]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
