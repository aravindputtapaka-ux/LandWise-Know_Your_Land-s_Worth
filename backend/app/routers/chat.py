import asyncio
import time
import os
import re
import logging
from functools import lru_cache
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from app.auth import CurrentUser, get_current_user
from app.services.chat_store import ChatStore, public
from app.services.retrieval_service import (
    retrieve,
    wants_estimation_list,
    list_saved_estimations,
)
from app.services.gemini_service import generate, config
from app.services.chat_web_search import web_evidence

router = APIRouter()
usage_logger = logging.getLogger("landwise.chat_usage")


class ConversationCreate(BaseModel):
    title: str = Field('Property conversation', min_length=1, max_length=100)
    selected_search_id: str | None = Field(None, max_length=100)


class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    request_id: UUID

    @field_validator('message')
    @classmethod
    def clean(cls, value):
        if not value.strip():
            raise ValueError('Message cannot be blank')
        return value.strip()


@lru_cache(maxsize=1)
def connection():
    uri = os.getenv('MONGODB_URI') or os.getenv('MONGODB_URL')
    if not uri:
        raise HTTPException(503, 'Chat requires MONGODB_URI in backend/.env.')
    client = MongoClient(uri, serverSelectionTimeoutMS=4000, connectTimeoutMS=4000, socketTimeoutMS=10000)
    try:
        client.admin.command('ping')
        db = client[os.getenv('MONGODB_DB', 'landwise_ai')]
        return db, ChatStore(db)
    except Exception:
        client.close()
        raise


def chat_access(current: CurrentUser = Depends(get_current_user)):
    try:
        db, store = connection()
        if not db.users.find_one({'_id': current.user_id}, {'_id': 1}):
            raise HTTPException(401, 'Your account is not in MongoDB. Sign in to a MongoDB-backed account or migrate local users first.')
        return current.user_id, db, store, current
    except PyMongoError:
        raise HTTPException(503, 'MongoDB is unavailable. Start MongoDB and retry; chat is not saved to a fallback file.')



# Route only explicit land/plot valuation requests to the existing evidence-first estimator.
# Do not let an LLM invent a market rate or silently use saved historical values.
_AREA = re.compile(r"\b(\d[\d,]*(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|square\s*feet|square\s*foot|sq\.?\s*yds?|sqyd|square\s*yards?|acres?|gunta(?:s)?|cents?)\b", re.I)
_LOCATION = re.compile(r"\b(?:in|at|near|around)\s+(.+?)(?:[?.!]|$)", re.I)
_VALUATION = re.compile(
    r"\b(?:price|cost|rate|worth|valuation|estimate|value)\b"
    r"|\b(?:land|plot)[\s_-]*(?:price|cost|rate|value|worth)\b",
    re.I
)
_LAND = re.compile(r"\b(?:land|plot|plots|acre|acres|sqft|sq\.?\s*ft|sqyd|square\s*yards?|gunta|guntas|cent|cents|per\s+(?:sq|square))\b", re.I)
_NON_LAND = re.compile(r"\b(?:apartment|flat|villa|house|commercial\s+(?:building|shop)|\d+\s*bhk)\b", re.I)
_UNITS = {'sqft':'sq ft','sq ft':'sq ft','sq. ft':'sq ft','square feet':'sq ft','square foot':'sq ft',
          'sqyd':'sq yd','sq yd':'sq yd','sq. yd':'sq yd','sq yds':'sq yd','square yard':'sq yd','square yards':'sq yd',
          'acre':'acre','acres':'acre','gunta':'gunta','guntas':'gunta','cent':'cent','cents':'cent'}

def land_valuation_query(message: str):
    if not _VALUATION.search(message) or not _LAND.search(message) or _NON_LAND.search(message):
        return None
    match = _LOCATION.search(message)
    if not match:
        return {'missing_location': True}
    location = re.sub(r"\s+(?:for|of)\s+\d.*$", '', match.group(1).strip(' ,'), flags=re.I)
    if not location:
        return {'missing_location': True}
    area_match = _AREA.search(message)
    area = float(area_match.group(1).replace(',', '')) if area_match else 1.0
    unit = _UNITS.get(re.sub(r'\s+', ' ', area_match.group(2).lower()), 'sq ft') if area_match else 'sq ft'
    # A per-sqft question always asks for the unit rate, not an arbitrary parcel.
    per_sqft = bool(re.search(r'\bper\s*(?:sq\.?\s*ft|sqft|square\s*foot|square\s*feet)\b', message, re.I))
    if per_sqft: area, unit = 1.0, 'sq ft'
    return {'location': location, 'area': area, 'area_unit': unit, 'per_sqft': per_sqft}


def inr(value):
    digits = f'{round(float(value)):,}'
    parts = digits.split(',')
    raw = ''.join(parts)
    if len(raw) <= 3: return '₹' + raw
    head, tail = raw[:-3], raw[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:]); head = head[:-2]
    if head: groups.insert(0, head)
    return '₹' + ','.join(groups + [tail])


async def answer_land_valuation(parsed, current_user):
    if parsed.get('missing_location'):
        return 'Which location should I check? For example: land price per sq ft in Medchal, Hyderabad.', []
    from app.main import property_price
    from app.models import PropertyPriceRequest
    req = PropertyPriceRequest(property_type='land', location=parsed['location'],
                               area=parsed['area'], area_unit=parsed['area_unit'])
    # Shared estimator checks market_cache.get first, rescales cached rates for
    # requested area and populates market_cache.put after verified misses.
    # Both interfaces must share this cache; do not cache chatbot prose.
    result = await property_price(req, current_user=current_user)
    data = result.model_dump() if hasattr(result, 'model_dump') else dict(result)
    rate = data.get('average_price_per_sqft')
    if rate is None and data.get('unit') == 'sq ft': rate = data.get('price_per_unit')
    total = data.get('estimated_total_price')
    location = data.get('location') or parsed['location']
    lines = [f'Land / plot estimate for **{location}**:']
    if rate is not None: lines.append(f'**Estimated price per sq ft:** {inr(rate)}')
    if not parsed['per_sqft'] and total is not None:
        lines.append(f"**Estimated price for {parsed['area']:g} {parsed['area_unit']}:** {inr(total)}")
    if rate is None and total is None:
        lines.append(f"**Estimated rate:** {inr(data['price_per_unit'])} per {data['unit']}")
    if data.get('confidence'): lines.append(f"Confidence: {data['confidence']}")
    if data.get('source_count') is not None: lines.append(f"Market sources: {data['source_count']}")
    if str(data.get('source_summary') or '').startswith('Cached locality market evidence'):
        lines.append('Source: shared LandWise market cache (recent validated evidence).')
    lines.append('This is an evidence-based estimate, not a guaranteed sale price.')
    urls = data.get('sources') or []
    return '\n'.join(lines), [{'id': 'land-market', 'kind': 'market', 'title': 'Land market evidence', 'urls': urls}]

def quick_information_answer(message: str):
    """Answer fixed area conversions without external calls."""
    q = message.lower()
    if any(t in q for t in ('how many', 'convert', 'equal to')) and any(t in q for t in ('acre', 'gunta', 'sqft', 'sq ft', 'square yard', 'cent')):
        return ('**1 acre = 43,560 sq ft = 4,840 sq yd = 40 guntas = 100 cents.** '
                '**1 sq yd = 9 sq ft** and **1 gunta = 1,089 sq ft**. These are area conversions, not land market rates.')
    return None


@router.get('/status')
def status(access=Depends(chat_access)):
    uid, db, store, current = access
    return {'database': 'connected', 'gemini_configured': bool(os.getenv('GEMINI_API_KEY') and os.getenv('GEMINI_MODEL')),
            'knowledge_chunks': db.knowledge_chunks.count_documents({}), 'retrieval': 'local TF-IDF + exact saved-search lookup'}


@router.post('/conversations')
def create(req: ConversationCreate, access=Depends(chat_access)):
    uid, db, store, current = access
    if req.selected_search_id:
        if not db.users.find_one({'_id': uid, 'search_history.id': req.selected_search_id}, {'_id': 1}):
            raise HTTPException(404, 'Saved search not found.')
    return store.create(uid, req.title.strip(), req.selected_search_id)


@router.get('/conversations')
def conversations(skip: int = Query(0, ge=0), limit: int = Query(30, ge=1, le=100), access=Depends(chat_access)):
    uid, db, store, current = access
    return store.list(uid, skip, limit)


@router.get('/conversations/{cid}/messages')
def messages(cid: str, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), access=Depends(chat_access)):
    uid, db, store, current = access
    return store.page(uid, cid, skip, limit)


@router.delete('/conversations/{cid}')
def delete(cid: str, access=Depends(chat_access)):
    uid, db, store, current = access
    store.delete(uid, cid)
    return {'deleted': True}


@router.post('/conversations/{cid}/messages')
async def send(cid: str, req: MessageCreate, access=Depends(chat_access)):
    uid, db, store, current = access
    request_started = time.perf_counter()
    request_id = str(req.request_id)
    conversation = await asyncio.to_thread(store.owned, uid, cid)
    existing_user = await asyncio.to_thread(store.existing, uid, cid, request_id, 'user')
    if existing_user and existing_user['content'] != req.message:
        raise HTTPException(409, 'A request ID cannot be reused for a different message.')
    existing_answer = await asyncio.to_thread(store.existing, uid, cid, request_id, 'assistant')
    if existing_answer:
        return public(existing_answer)
    quick_answer = quick_information_answer(req.message)
    listing_requested = wants_estimation_list(req.message) if quick_answer is None else False
    land_request = land_valuation_query(req.message) if not listing_requested else None
    
    if quick_answer is None and not listing_requested and land_request is None:
        config()  # Do not save a message when initial configuration is missing.

    lock_id = await asyncio.to_thread(store.lock, uid, cid)
    try:
        # Recheck under lock: a concurrent retry may have just completed.
        existing_answer = await asyncio.to_thread(store.existing, uid, cid, request_id, 'assistant')
        if existing_answer:
            return public(existing_answer)
        history = await asyncio.to_thread(store.page, uid, cid, 0, 12)
        history = [m for m in history if m.get('request_id') != request_id]
        await asyncio.to_thread(store.save, uid, cid, request_id, 'user', req.message)
        if quick_answer is not None:
            answer, sources = quick_answer, []
        elif listing_requested:
            answer = await asyncio.to_thread(
                list_saved_estimations,
                db,
                uid,
            )
            sources = []
        elif land_request is not None:
            try:
                answer, sources = await answer_land_valuation(land_request, current)
            except HTTPException as exc:
                answer = f'Unable to produce a verified land estimate for this request: {exc.detail}'
                sources = []
            except (ValueError, RuntimeError) as exc:
                answer = f'No verified land price is available for this request: {exc}'
                sources = []
        else:
            evidence, note = await asyncio.to_thread(
                retrieve,
                db,
                uid,
                req.message,
                history,
                conversation.get("selected_search_id"),
            )

            # Public web fallback only when local RAG has no matching evidence.
            # Do not replace a missing selected private saved search with web data.
            if not evidence and not conversation.get("selected_search_id"):
                web_start = time.perf_counter()
                evidence = await web_evidence(req.message)
                print(f"Tavily fallback time: {time.perf_counter() - web_start:.3f} seconds")
                if evidence:
                    note = "Current public web search evidence. Cite its source URLs; verify dates and jurisdiction."

            usage_logger.info("Chat retrieval | evidence_records=%d evidence_text_chars=%d evidence_kinds=%s", len(evidence), sum(len(str(item.get("text") or "")) for item in evidence), ",".join(sorted({str(item.get("kind") or "unknown") for item in evidence})))
            gemini_started = time.perf_counter()
            answer = await generate(
                req.message,
                history,
                evidence,
                note,
            )

            usage_logger.info("Chat generation | duration_ms=%.1f", (time.perf_counter() - gemini_started) * 1000)
            sources = [
                {k: record[k] for k in ("id", "kind", "title", "urls")}
                for record in evidence
            ]
        return await asyncio.to_thread(store.save, uid, cid, request_id, 'assistant', answer, sources)
    finally:
        usage_logger.info("Chat request | duration_ms=%.1f", (time.perf_counter() - request_started) * 1000)
        await asyncio.to_thread(store.unlock, uid, cid, lock_id)
