from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user
from app.modules.hr import schemas, service

router = APIRouter()


@router.post("/employees", response_model=schemas.EmployeeOut, status_code=201)
async def create_employee(
    data: schemas.EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.create_employee(db, data)


@router.get("/employees", response_model=list[schemas.EmployeeOut])
async def list_employees(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.list_employees(db, skip, limit)


@router.get("/employees/{employee_id}", response_model=schemas.EmployeeOut)
async def get_employee(employee_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_employee(db, employee_id)


@router.patch("/employees/{employee_id}", response_model=schemas.EmployeeOut)
async def update_employee(
    employee_id: int,
    data: schemas.EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.update_employee(db, employee_id, data)


@router.post("/employees/{employee_id}/leave-requests", response_model=schemas.LeaveRequestOut, status_code=201)
async def create_leave_request(
    employee_id: int,
    data: schemas.LeaveRequestCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await service.create_leave_request(db, employee_id, data)


@router.post("/leave-requests/{leave_id}/approve", response_model=schemas.LeaveRequestOut)
async def approve_leave(
    leave_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await service.approve_leave(db, leave_id, current_user.id)
