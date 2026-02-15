"""
사이트별 HTML 파서.
공통 인터페이스: parse(html) -> list[str] (리뷰/본문 텍스트)
"""
from typing import Callable
from urllib.parse import urlparse

from app.services.parsers.fallback import parse as fallback_parse

_PARSERS: dict[str, Callable[[str], list[str]]] = {
    "default": fallback_parse,
}


def _domain_from_url(url: str) -> str:
    """URL에서 도메인만 추출 (예: www.tripadvisor.com -> tripadvisor.com)"""
    try:
        netloc = urlparse(url).netloc or ""
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.lower()
    except Exception:
        return ""


def get_parser(domain: str) -> Callable[[str], list[str]]:
    """도메인에 해당하는 파서 반환. 없으면 fallback."""
    key = domain.lower() if domain else "default"
    return _PARSERS.get(key) or _PARSERS["default"]


def parse_url_result(url: str, html: str) -> list[str]:
    """
    URL과 HTML을 받아 해당 도메인 파서로 파싱 후 텍스트 리스트 반환.
    """
    domain = _domain_from_url(url)
    parser = get_parser(domain)
    return parser(html)
