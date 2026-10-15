import os
import secrets
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

api_key = os.getenv("BREVO_API_KEY", "").strip()
sender_email = os.getenv("BREVO_SENDER_EMAIL", "").strip()
sender_name = os.getenv("BREVO_SENDER_NAME", "LandWise AI").strip()


def main():
    if not api_key:
        print("Missing BREVO_API_KEY in backend/.env")
        return

    headers = {
        "api-key": api_key,
        "accept": "application/json",
        "content-type": "application/json",
    }

    # Validate the key before sending anything.
    response = requests.get(
        "https://api.brevo.com/v3/account",
        headers=headers,
        timeout=30,
    )

    print("Key check HTTP status:", response.status_code)

    if response.status_code != 200:
        print("Brevo rejected the request:", response.text)
        return

    print("API key authenticated successfully.")

    if not sender_email:
        print("Missing BREVO_SENDER_EMAIL in backend/.env")
        return

    recipient = input("Send test OTP to your email address: ").strip()
    if not recipient:
        print("No recipient entered.")
        return

    otp = str(secrets.randbelow(900000) + 100000)

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers=headers,
        json={
            "sender": {
                "name": sender_name,
                "email": sender_email,
            },
            "to": [{"email": recipient}],
            "subject": "LandWise — Test OTP",
            "textContent": (
                f"Your LandWise test OTP is: {otp}\n\n"
                "This is a delivery test only. "
                "It cannot verify your LandWise account."
            ),
        },
        timeout=30,
    )

    print("Email request HTTP status:", response.status_code)

    if response.status_code == 201:
        print("Brevo accepted the email. Check your inbox and spam folder.")
        print("Message ID:", response.json().get("messageId"))
    else:
        print("Email request failed:", response.text)


if __name__ == "__main__":
    try:
        main()
    except requests.RequestException as exc:
        print("Network/API request failed:", exc)