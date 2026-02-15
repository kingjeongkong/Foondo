"""
Foondo Restaurant Detail Scraper — FastAPI 진입점
라우터만 등록하고, 비즈니스 로직은 app.api / app.services 에 둠.
"""
from fastapi import FastAPI

from app.api import health, search

app = FastAPI(
    title="Foondo Scraper",
    description="Restaurant detail scraping service (search → scrape → analyze → DB)",
    version="0.1.0",
)

app.include_router(health.router, tags=["health"])
app.include_router(search.router, tags=["search"])
