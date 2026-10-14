"""Bounded public Tavily fallback for informational chat, never for land valuation."""
import os
import logging
import time
from urllib.parse import urlparse
from app.services.tavily_service import tavily_search, SourceServiceError

logger = logging.getLogger("landwise.chat_usage")


async def web_evidence(question: str) -> list[dict]:
    if not os.getenv("TAVILY_API_KEY"):
        print("Tavily chat fallback skipped: TAVILY_API_KEY not configured")
        return []
    started = time.perf_counter()
    try:
        response = await tavily_search(question[:350], max_results=4, search_depth="basic")
    except (SourceServiceError, ValueError, TimeoutError, OSError) as exc:
        print(f"Tavily chat fallback failed: {type(exc).__name__}: {exc}")
        return []
    raw_results = response.get("results", [])
    raw_chars = sum(len(str(r.get("content") or "")) + len(str(r.get("raw_content") or "")) for r in raw_results if isinstance(r, dict))
    records = []
    for i, item in enumerate(response.get("results", [])):
        url = item.get("url", "")
        if not isinstance(url, str) or urlparse(url).scheme not in ("http", "https"):
            continue
        excerpt = str(item.get("content") or "").strip()[:2200]
        if not excerpt:
            continue
        records.append({"id": f"web:{i}", "kind": "web", "title": str(item.get("title") or url)[:200], "urls": [url], "text": excerpt})
    retained_chars = sum(len(r["text"]) for r in records)
    logger.info("Tavily usage | results=%d retained=%d raw_content_chars=%d retained_excerpt_chars=%d estimated_excerpt_tokens=%d duration_ms=%.1f", len(raw_results), len(records), raw_chars, retained_chars, round(retained_chars / 4), (time.perf_counter() - started) * 1000)
    return records
