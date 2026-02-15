"""스크래핑 테스트: URL 목록 받아 각 페이지 fetch 후 텍스트 추출"""
from fastapi import APIRouter, Body, HTTPException

from app.services.scrape import scrape_urls

router = APIRouter()


@router.post("/scrape")
def scrape(urls: list[str] = Body(..., embed=False)):
    """
    POST body: ["url1", "url2", ...]
    반환: { "results": [ {"url", "source", "texts": [...]}, ... ] }
    """
    if not urls:
        raise HTTPException(status_code=400, detail="urls required (non-empty list)")
    urls = [u.strip() for u in urls if u and isinstance(u, str)]
    if not urls:
        raise HTTPException(status_code=400, detail="urls required (non-empty list)")
    try:
        results = scrape_urls(urls)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
