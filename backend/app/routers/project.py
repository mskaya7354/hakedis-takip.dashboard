from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_token
from app.deps import get_repo
from app.models.schemas import ProjectDetailResponse
from app.repositories.excel_repo import ExcelRepository, ExcelUnavailableError
from app.services.calc import aggregate_project

router = APIRouter(prefix="/api", tags=["data"], dependencies=[Depends(verify_token)])


@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: int, repo: ExcelRepository = Depends(get_repo)) -> ProjectDetailResponse:
    try:
        projects = repo.get_projects()
        hakedisler = repo.get_hakedisler()
        zeyilnameler = repo.get_zeyilnameler()
    except ExcelUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))

    project = next((p for p in projects if p.id == project_id), None)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Proje bulunamadı: id={project_id}")

    return ProjectDetailResponse(
        project=project,
        agg=aggregate_project(project, hakedisler),
        zeyilnameler=[z for z in zeyilnameler if z.projectName == project.name],
    )
