import time

from fastapi import APIRouter, Depends

from app.deps import get_repo
from app.repositories.excel_repo import ExcelRepository

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health(repo: ExcelRepository = Depends(get_repo)) -> dict:
    h = repo.health
    return {
        "status": "ok",
        "source": h.source_path,
        "last_load_ago_sec": round(time.monotonic() - h.last_load_at, 1) if h.last_load_at else None,
        "last_error": h.last_error,
        "consecutive_failures": h.consecutive_failures,
        "total_loads": h.total_loads,
        "total_stale_serves": h.total_stale_serves,
    }
