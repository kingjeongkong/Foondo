"""
검색 서비스: 식당명 + 도시로 DuckDuckGo 검색 후 URL 목록 반환
"""
from ddgs import DDGS


def build_query(restaurant_name: str, city_name: str) -> str:
    """검색 쿼리 생성 (리뷰/평가 결과가 나오도록)"""
    return f"{restaurant_name} {city_name} reviews"


def get_search_urls(restaurant_name: str, city_name: str, max_results: int = 10) -> list[str]:
    """
    DuckDuckGo 검색 실행 후 결과 URL 목록 반환
    :param restaurant_name: 식당명
    :param city_name: 도시명
    :param max_results: 가져올 URL 개수
    :return: URL 문자열 리스트
    """
    query = build_query(restaurant_name, city_name)
    urls: list[str] = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                href = None
                if isinstance(r, dict):
                    href = r.get("href") or r.get("url")
                else:
                    href = getattr(r, "href", None) or getattr(r, "url", None)
                if href and isinstance(href, str):
                    urls.append(href)
    except Exception:
        raise
    return urls
