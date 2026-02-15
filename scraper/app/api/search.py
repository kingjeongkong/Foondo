"""검색 테스트 엔드포인트 (Phase 1): 식당명+도시 → URL 목록"""
from fastapi import APIRouter, HTTPException

from app.services.search import get_search_urls

router = APIRouter()


@router.get("/search")
def search(restaurant_name: str, city_name: str, max_results: int = 10):
    """
    DuckDuckGo 검색 후 결과 URL 목록 반환 (테스트용)
    """
    if not restaurant_name.strip() or not city_name.strip():
        raise HTTPException(status_code=400, detail="restaurant_name and city_name required")
    try:
        urls = get_search_urls(
            restaurant_name.strip(),
            city_name.strip(),
            max_results=min(max_results, 20),
        )
        return {"query": f"{restaurant_name} {city_name} reviews", "urls": urls}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
