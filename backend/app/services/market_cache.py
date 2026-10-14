
"""Shared MongoDB cache of validated locality market estimates.

Used by both the LandWise website and chatbot.

The cache stores validated locality market evidence, not user history.
Different requested areas can reuse the same locality market rate.

Cache IDs must be generated using cache_key(req). Never use a metric
name such as "max_price_per_sqft" as a MongoDB document ID.
"""

import copy
import hashlib
import json
import logging
import math
import os
import re
import time
from datetime import datetime, timedelta, timezone

from app.unit_utils import convert_price_per_unit, to_sqft


logger = logging.getLogger(__name__)

TTL_HOURS = max(
    1,
    int(os.getenv("MARKET_CACHE_TTL_HOURS", "24")),
)

_VALID_KEY = re.compile(r"^[a-f0-9]{64}$")


def _normalize_text(value):
    """Normalize whitespace and case for comparison."""
    return " ".join(str(value or "").casefold().split())


def _valid_key(key):
    """Only allow SHA-256 hexadecimal cache identifiers."""
    return (
        isinstance(key, str)
        and _VALID_KEY.fullmatch(key) is not None
    )


def _valid_rate(value):
    """Return a valid positive finite market rate or None."""
    try:
        rate = float(value)
    except (TypeError, ValueError, OverflowError):
        return None

    if not math.isfinite(rate) or rate <= 0:
        return None

    return rate


def cache_key(req):
    """Generate the existing LandWise location-specific cache key.

    IMPORTANT:
    Preserve the original JSON serialization and field order.
    Changing them would invalidate existing website cache keys.
    """

    if req.source_urls or req.currency.upper() != "INR":
        # Custom evidence must be evaluated independently.
        return None

    parts = [
        " ".join(req.location.casefold().split()),
        req.property_type,
        str(req.bhk or "").casefold(),
        str(req.property_status or "").casefold(),
    ]

    payload = json.dumps(
        parts,
        ensure_ascii=False,
    )

    return hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()


def _matches_request(response, req):
    """Verify that cached evidence belongs to the requested property."""

    if not isinstance(response, dict):
        return False

    if _normalize_text(response.get("location")) != _normalize_text(
        req.location
    ):
        return False

    if _normalize_text(
        response.get("property_type")
    ) != _normalize_text(req.property_type):
        return False

    if _normalize_text(response.get("bhk")) != _normalize_text(
        req.bhk
    ):
        return False

    if _normalize_text(
        response.get("property_status")
    ) != _normalize_text(req.property_status):
        return False

    return True


def get(collection, key, req=None):
    """Read a validated, unexpired market estimate from MongoDB.

    Returns:
        Deep-copied cached response on HIT.
        None on MISS, invalid data, or database failure.

    Pass req when possible to verify the location and property details.
    """

    if collection is None or key is None:
        logger.info("[CACHE] Lookup skipped: unavailable collection/key")
        return None

    if not _valid_key(key):
        logger.warning(
            "[CACHE] Invalid lookup key rejected: %r",
            key,
        )
        return None

    started = time.perf_counter()

    try:
        now = datetime.now(timezone.utc)

        document = collection.find_one(
            {
                "_id": key,
                "expires_at": {"$gt": now},
            }
        )

        elapsed_ms = (
            time.perf_counter() - started
        ) * 1000

        if document is None:
            logger.info(
                "[CACHE] MISS | key=%s | %.1f ms",
                key,
                elapsed_ms,
            )
            return None

        response = document.get("response")

        if not isinstance(response, dict):
            logger.warning(
                "[CACHE] INVALID RESPONSE | key=%s",
                key,
            )
            return None

        rate = _valid_rate(
            response.get("average_price_per_sqft")
        )

        if rate is None:
            logger.warning(
                "[CACHE] INVALID RATE | key=%s",
                key,
            )
            return None

        if req is not None and not _matches_request(response, req):
            logger.warning(
                "[CACHE] PROPERTY MISMATCH | key=%s | "
                "requested=%s | stored=%s",
                key,
                req.location,
                response.get("location"),
            )
            return None

        logger.info(
            "[CACHE] HIT | key=%s | location=%s | "
            "rate=%.2f | %.1f ms",
            key,
            response.get("location"),
            rate,
            elapsed_ms,
        )

        return copy.deepcopy(response)

    except Exception:
        logger.exception(
            "[CACHE] READ FAILED | key=%s",
            key,
        )
        return None


def put(collection, key, response):
    """Save a validated market estimate using its SHA-256 cache key.

    Returns:
        True if MongoDB acknowledges the write.
        False if the key, response, rate, or write is invalid.
    """

    if collection is None or key is None:
        logger.warning(
            "[CACHE] Write skipped: unavailable collection/key"
        )
        return False

    if not _valid_key(key):
        logger.error(
            "[CACHE] WRITE REJECTED | invalid key=%r",
            key,
        )
        return False

    if not isinstance(response, dict):
        logger.error(
            "[CACHE] WRITE REJECTED | response must be a dictionary"
        )
        return False

    clean = copy.deepcopy(response)
    clean.pop("search_id", None)

    rate = _valid_rate(
        clean.get("average_price_per_sqft")
    )

    if rate is None:
        logger.error(
            "[CACHE] WRITE REJECTED | invalid market rate | "
            "key=%s",
            key,
        )
        return False

    if not clean.get("location") or not clean.get("property_type"):
        logger.error(
            "[CACHE] WRITE REJECTED | missing location/property type"
        )
        return False

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=TTL_HOURS)

    started = time.perf_counter()

    try:
        result = collection.update_one(
            {"_id": key},
            {
                "$set": {
                    "response": clean,
                    "updated_at": now,
                    "expires_at": expires_at,
                    "price_per_sqft": rate,
                }
            },
            upsert=True,
        )

        elapsed_ms = (
            time.perf_counter() - started
        ) * 1000

        if not result.acknowledged:
            logger.error(
                "[CACHE] WRITE NOT ACKNOWLEDGED | key=%s",
                key,
            )
            return False

        logger.info(
            "[CACHE] WRITE SUCCESS | key=%s | "
            "location=%s | rate=%.2f | "
            "upserted=%s | %.1f ms",
            key,
            clean.get("location"),
            rate,
            result.upserted_id is not None,
            elapsed_ms,
        )

        return True

    except Exception:
        logger.exception(
            "[CACHE] WRITE FAILED | key=%s",
            key,
        )
        return False


def for_area(cached, req):
    """Recalculate totals from cached locality evidence.

    The market rate is reused, while the requested area and unit
    determine the new total price.

    No Tavily search or Gemini request is performed here.
    """

    if not isinstance(cached, dict):
        raise ValueError("Cached response must be a dictionary")

    rate = _valid_rate(
        cached.get("average_price_per_sqft")
    )

    if rate is None:
        raise ValueError("Invalid cached market rate")

    if not _matches_request(cached, req):
        raise ValueError(
            "Cached market evidence does not match the requested property"
        )

    result = copy.deepcopy(cached)

    unit = req.area_unit or "sq ft"

    sqft = (
        to_sqft(req.area, unit)
        if req.area is not None
        else None
    )

    if sqft is not None:
        sqft = float(sqft)

        if not math.isfinite(sqft) or sqft <= 0:
            raise ValueError("Requested area must be positive")

    total_price = (
        rate * sqft
        if sqft is not None
        else None
    )

    result.update(
        location=req.location,
        property_type=req.property_type,
        bhk=req.bhk,
        property_status=req.property_status,
        unit=unit,
        price_per_unit=convert_price_per_unit(
            rate,
            "sq ft",
            unit,
        ),
        estimated_total_price=total_price,
        average_price=total_price,
    )

    # min_price and max_price represent comparable listing prices,
    # not totals for the user's requested area.

    summary = result.get("source_summary") or ""

    prefix = "Cached locality market evidence (not a live quote); "

    if not summary.startswith(prefix):
        result["source_summary"] = prefix + summary

    return result
