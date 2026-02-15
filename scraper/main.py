"""
Foondo Restaurant Detail Scraper — FastAPI 진입점
Phase 0: 헬스 체크만 노출
"""
from fastapi import FastAPI

app = FastAPI(
    title="Foondo Scraper",
    description="Restaurant detail scraping service (search → scrape → analyze → DB)",
    version="0.1.0",
)


@app.get("/health")
def health():
    """배포/로드밸런서 헬스 체크용"""
    return {"status": "ok"}
