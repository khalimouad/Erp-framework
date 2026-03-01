from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    job_title: Optional[str] = None
    work_email: Optional[EmailStr] = None
    work_phone: Optional[str] = None
    department_id: Optional[int] = None
    company_id: Optional[int] = None
    hire_date: Optional[date] = None
    salary: float = 0.0


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    job_title: Optional[str] = None
    work_email: Optional[EmailStr] = None
    department_id: Optional[int] = None
    salary: Optional[float] = None
    is_active: Optional[bool] = None


class EmployeeOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    job_title: Optional[str]
    work_email: Optional[str]
    work_phone: Optional[str]
    department_id: Optional[int]
    company_id: Optional[int]
    hire_date: Optional[date]
    salary: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LeaveRequestCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
