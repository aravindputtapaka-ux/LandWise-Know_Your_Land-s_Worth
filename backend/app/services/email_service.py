"""LandWise OTP email delivery via Brevo HTTPS API (Render Free compatible)."""

from __future__ import annotations

import logging
import os

import httpx

import os
import hashlib
import logging

logger = logging.getLogger(__name__)

brevo_key = os.getenv("BREVO_API_KEY", "").strip()

logger.warning(
    "BREVO_KEY_CHECK: configured=%s fingerprint=%s",
    bool(brevo_key),
    hashlib.sha256(brevo_key.encode()).hexdigest() if brevo_key else "missing",
)

BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"


def email_configured() -> bool:
    return bool(
        os.getenv("BREVO_API_KEY", "").strip()
        and os.getenv("BREVO_SENDER_EMAIL", "").strip()
    )


def smtp_configured() -> bool:
    """Compatibility alias for existing imports; now checks HTTPS email config."""
    return email_configured()


def _send(to_email: str, subject: str, body: str) -> None:
    if not email_configured():
        raise RuntimeError("Brevo email API is not configured")

    payload = {
        "sender": {
            "name": (
                os.getenv("BREVO_SENDER_NAME", "LandWise AI").strip()
                or "LandWise AI"
            ),
            "email": os.environ["BREVO_SENDER_EMAIL"].strip(),
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "textContent": body,
    }

    try:
        with httpx.Client(
            timeout=httpx.Timeout(20.0, connect=5.0)
        ) as client:
            response = client.post(
                BREVO_ENDPOINT,
                headers={
                    "api-key": os.environ["BREVO_API_KEY"].strip(),
                    "accept": "application/json",
                },
                json=payload,
            )

        if response.status_code >= 400:
            logger.error(
                "BREVO_ERROR: status=%s body=%s",
                response.status_code,
                response.text[:1000],
            )

            response.raise_for_status()

    except httpx.HTTPStatusError as exc:
        logger.error(
            "Brevo OTP delivery rejected: HTTP %s",
            exc.response.status_code,
        )

        raise RuntimeError(
            "Email provider rejected OTP delivery"
        ) from exc

    except httpx.RequestError as exc:
        logger.error(
            "Brevo OTP delivery connection failure: %s",
            type(exc).__name__,
        )

        raise RuntimeError(
            "Email provider could not be reached"
        ) from exc


def send_otp_email(
    to_email: str,
    otp: str,
    purpose: str,
) -> None:
    action = (
        "verify your LandWise AI account"
        if purpose == "signup"
        else "reset your LandWise AI password"
    )

    subject = (
        "LandWise AI verification code"
        if purpose == "signup"
        else "LandWise AI password reset code"
    )

    body = (
        f"Hello,\n\n"
        f"Your LandWise AI OTP to {action} is:\n\n"
        f"{otp}\n\n"
        "This code expires in 10 minutes and can be used only once.\n\n"
        "If you did not request this code, you can safely ignore "
        "this email.\n\n"
        "LandWise AI\n"
    )

    _send(to_email, subject, body)


def send_otp_email_async(
    to_email: str,
    otp: str,
    purpose: str,
) -> None:
    """Legacy compatibility; main.py calls this via asyncio.to_thread."""
    send_otp_email(to_email, otp, purpose)