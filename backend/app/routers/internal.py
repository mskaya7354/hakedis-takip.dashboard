from fastapi import APIRouter, Header, HTTPException, UploadFile
from app.config import settings
from app.deps import get_repo

router = APIRouter(prefix="/api/internal", include_in_schema=False)


@router.post("/push-excel")
async def push_excel(file: UploadFile, x_push_token: str = Header(...)):
    if x_push_token != settings.push_token:
        raise HTTPException(403, "Geçersiz token")
    content = await file.read()
    repo = get_repo()
    repo.path.parent.mkdir(parents=True, exist_ok=True)
    repo.path.write_bytes(content)
    repo.invalidate()
    return {"ok": True, "bytes": len(content)}
