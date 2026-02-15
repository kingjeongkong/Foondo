"""헬스 체크 엔드포인트 (배포/로드밸런서용)"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    """서비스 가동 여부 확인"""
    return {"status": "ok"}
