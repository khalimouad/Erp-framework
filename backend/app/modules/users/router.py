from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth import get_current_user, require_superadmin
from app.modules.users import schemas, service

router = APIRouter()


@router.post("/auth/token", response_model=schemas.TokenResponse, tags=["Auth"])
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    return await service.authenticate_user(db, form.username, form.password)


@router.post("/", response_model=schemas.UserOut, status_code=201)
async def create_user(
    data: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.create_user(db, data)


@router.get("/me", response_model=schemas.UserOut)
async def me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/", response_model=list[schemas.UserOut])
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.list_users(db, skip, limit)


@router.get("/{user_id}", response_model=schemas.UserOut)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    return await service.get_user(db, user_id)


@router.patch("/{user_id}", response_model=schemas.UserOut)
async def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin),
):
    return await service.update_user(db, user_id, data)
