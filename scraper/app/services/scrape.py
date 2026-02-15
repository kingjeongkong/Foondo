"""
URL 리스트를 fetch한 뒤 도메인별 파서로 리뷰/본문 텍스트 추출.
결과: list[{ "url", "source", "texts" }]
"""
from urllib.parse import urlparse

import requests

from app.services.parsers import parse_url_result

# fetch 시 사용 (일부 사이트는 User-Agent 없으면 차단)
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; FoondoScraper/1.0; +https://github.com/foondo)"
    ),
    "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}
FETCH_TIMEOUT = 15


def _domain_from_url(url: str) -> str:
    """URL에서 도메인만 추출 (source 필드용)."""
    try:
        netloc = urlparse(url).netloc or ""
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.lower()
    except Exception:
        return ""


def fetch_html(url: str) -> str | None:
    """
    단일 URL GET 요청. 성공 시 HTML 문자열, 실패 시 None.
    """
    try:
        resp = requests.get(
            url,
            headers=DEFAULT_HEADERS,
            timeout=FETCH_TIMEOUT,
            allow_redirects=True,
        )
        resp.raise_for_status()
        return resp.text
    except requests.RequestException:
        return None


def scrape_urls(urls: list[str]) -> list[dict]:
    """
    URL 리스트를 순회하며 각 페이지를 fetch하고 파서로 텍스트 추출.
    반환: [ {"url": str, "source": str, "texts": list[str]}, ... ]
    fetch 실패 시에도 항목은 포함되며 texts는 [].
    """
    result: list[dict] = []
    for url in urls:
        if not url or not url.strip():
            continue
        source = _domain_from_url(url)
        html = fetch_html(url)
        if html is None:
            result.append({"url": url, "source": source, "texts": []})
            continue
        texts = parse_url_result(url, html)
        result.append({"url": url, "source": source, "texts": texts})
    return result
