from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.deps import get_repo
from app.models.schemas import Portfolio
from app.repositories.excel_repo import ExcelRepository, ExcelUnavailableError
from app.services.calc import aggregate_portfolio

router = APIRouter(prefix="/api", tags=["data"], dependencies=[Depends(verify_token)])


@router.get("/portfolio", response_model=Portfolio)
def get_portfolio(repo: ExcelRepository = Depends(get_repo)) -> Portfolio:
    try:
        return aggregate_portfolio(
            repo.get_projects(),
            repo.get_hakedisler(),
            len(repo.get_zeyilnameler()),
            repo.get_maliyetler(),
            repo.get_sgk(),
        )
    except ExcelUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
