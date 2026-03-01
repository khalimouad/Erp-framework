from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.modules.hr.models import Employee, LeaveRequest
from app.modules.hr.schemas import EmployeeCreate, EmployeeUpdate, LeaveRequestCreate


async def create_employee(db: AsyncSession, data: EmployeeCreate) -> Employee:
    employee = Employee(**data.model_dump())
    db.add(employee)
    await db.flush()
    await db.refresh(employee)
    return employee


async def get_employee(db: AsyncSession, employee_id: int) -> Employee:
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


async def list_employees(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Employee]:
    result = await db.execute(select(Employee).offset(skip).limit(limit))
    return result.scalars().all()


async def update_employee(db: AsyncSession, employee_id: int, data: EmployeeUpdate) -> Employee:
    emp = await get_employee(db, employee_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)
    await db.flush()
    await db.refresh(emp)
    return emp


async def create_leave_request(db: AsyncSession, employee_id: int, data: LeaveRequestCreate) -> LeaveRequest:
    await get_employee(db, employee_id)
    leave = LeaveRequest(employee_id=employee_id, **data.model_dump())
    db.add(leave)
    await db.flush()
    await db.refresh(leave)
    return leave


async def approve_leave(db: AsyncSession, leave_id: int, approver_id: int) -> LeaveRequest:
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    leave.status = "approved"
    leave.approved_by = approver_id
    await db.flush()
    await db.refresh(leave)
    return leave
