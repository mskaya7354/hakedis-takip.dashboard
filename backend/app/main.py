from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.internal import router as internal_router
from app.routers.portfolio import router as portfolio_router
from app.routers.project import router as project_router

app = FastAPI(
    title="Hakediş Takip API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(health_router)
app.include_router(internal_router)
app.include_router(portfolio_router)
app.include_router(project_router)

# React build — baslat.bat ile çalıştırıldığında frontend/dist varsa serve et
_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if _dist.exists():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="static")
