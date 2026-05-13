from functools import lru_cache

from app.config import settings
from app.repositories.excel_repo import ExcelRepository


@lru_cache
def _repo() -> ExcelRepository:
    return ExcelRepository(
        excel_path=settings.excel_path,
        cache_ttl_sec=settings.cache_ttl_seconds,
        max_retries=settings.load_max_retries,
        retry_backoff=settings.load_retry_backoff_sec,
        stale_tolerance_sec=settings.stale_tolerance_sec,
    )


def get_repo() -> ExcelRepository:
    return _repo()
