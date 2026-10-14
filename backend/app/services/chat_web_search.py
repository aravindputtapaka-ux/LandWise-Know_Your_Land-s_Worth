"""Bounded public Tavily fallback for informational chat, never for land valuation."""
import os
from urllib.parse import urlparse
from app.services.tavily_service import tavily_search, SourceServiceError


async def web_evidence(question: str) -> list[dict]:
    if not os.getenv("TAVILY_API_KEY"):
        print("Tavily chat fallback skipped: TAVILY_API_KEY not configured")
        return []
    try:
        response = await tavily_search(question[:350], max_results=4, search_depth="basic")
    except (SourceServiceError, ValueError, TimeoutError, OSError) as exc:
        print(f"Tavily chat fallback failed: {type(exc).__name__}: {exc}")
        return []
    records = []
    for i, item in enumerate(response.get("results", [])):
        url = item.get("url", "")
        if not isinstance(url, str) or urlparse(url).scheme not in ("http", "https"):
            continue
        excerpt = str(item.get("content") or "").strip()[:2200]
        if not excerpt:
            continue
        records.append({"id": f"web:{i}", "kind": "web", "title": str(item.get("title") or url)[:200], "urls": [url], "text": excerpt})
    return records
