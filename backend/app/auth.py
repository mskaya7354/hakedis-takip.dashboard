from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
_PASSWORD_HASH = _pwd_ctx.hash(settings.auth_password)


def _create_token(sub: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes)
    return jwt.encode({"sub": sub, "exp": expire}, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str = Depends(_oauth2)) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        sub: str | None = payload.get("sub")
        if sub != settings.auth_username:
            raise HTTPException(status_code=401, detail="Geçersiz token")
        return sub
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")


@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.username != settings.auth_username or not _pwd_ctx.verify(form.password, _PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    return {"access_token": _create_token(form.username), "token_type": "bearer"}
