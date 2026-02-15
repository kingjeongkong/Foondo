# Foondo Scraper (Python)

Restaurant detail 스크래핑 서비스. 검색 → URL별 수집 → OpenAI 분석 → DB 저장.

## 로컬 실행

```bash
cd scraper
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

- API: http://127.0.0.1:8000
- 헬스: http://127.0.0.1:8000/health
- 문서: http://127.0.0.1:8000/docs
