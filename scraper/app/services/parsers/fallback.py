"""
미지원/알 수 없는 도메인: HTML에서 본문 텍스트만 추출하거나 빈 리스트 반환
"""
from bs4 import BeautifulSoup


def parse(html: str) -> list[str]:
    """
    사이트 전용 파서가 없을 때 사용.
    p, article 등에서 텍스트를 모아 반환 (노이즈 많을 수 있음).
    """
    if not html or not html.strip():
        return []
    soup = BeautifulSoup(html, "html.parser")
    # 스크립트/스타일 제거
    for tag in soup(["script", "style"]):
        tag.decompose()
    texts: list[str] = []
    for el in soup.find_all(["p", "article", "blockquote"]):
        t = el.get_text(separator=" ", strip=True)
        if t and len(t) > 20:
            texts.append(t)
    return texts[:50]
