"""
FinAI Mobile & Web - Secure One-Time Password (OTP) & Email Delivery Service
Handles cryptographically secure OTP generation, hashed in-memory storage,
rate-limiting, brute-force protection, timing-attack-safe verification,
and resilient email dispatching (Direct SMTP + Supabase Auth fallback).
"""

import os
import smtplib
import secrets
import hashlib
import hmac
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any

# --- SMTP CONFIGURATION ---
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", f"FinAI Support <{SMTP_USER}>" if SMTP_USER else "FinAI Support <noreply@finai.app>")
SMTP_TLS = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
SMTP_SSL = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes")

# OTP Constraints
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_COOLDOWN_SECONDS = 60

# Internal HMAC Pepper for token hashing
_OTP_PEPPER = os.getenv("JWT_SECRET_KEY", "finai-otp-pepper-secret-2026")


class _OTPRecord:
    def __init__(self, token_hash: str, expires_at: datetime):
        self.token_hash = token_hash
        self.expires_at = expires_at
        self.attempts = 0
        self.last_requested_at = datetime.utcnow()


class OTPManager:
    """
    Thread-safe, secure in-memory OTP storage with hashing,
    expiration enforcement, rate-limiting, and brute force mitigation.
    """
    def __init__(self):
        self._store: Dict[str, _OTPRecord] = {}
        self._lock = threading.Lock()

    def _hash_token(self, email: str, token: str) -> str:
        payload = f"{email.lower().strip()}:{token.strip()}:{_OTP_PEPPER}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    def generate_otp(self, email: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Generates a 6-digit secure code.
        Returns: (code, error_message). If error_message is not None, generation was rejected.
        """
        clean_email = email.lower().strip()
        now = datetime.utcnow()

        with self._lock:
            # Check cooldown rate limit
            existing = self._store.get(clean_email)
            if existing:
                elapsed = (now - existing.last_requested_at).total_seconds()
                if elapsed < OTP_COOLDOWN_SECONDS:
                    wait_remaining = int(OTP_COOLDOWN_SECONDS - elapsed)
                    return None, f"Please wait {wait_remaining} seconds before requesting a new code."

            # Generate cryptographically secure 6-digit code
            code = f"{secrets.randbelow(900000) + 100000}"
            token_hash = self._hash_token(clean_email, code)
            expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

            self._store[clean_email] = _OTPRecord(token_hash=token_hash, expires_at=expires_at)
            return code, None

    def verify_otp(self, email: str, token: str) -> Tuple[bool, str]:
        """
        Verifies the given 6-digit OTP code against the hashed record.
        Returns: (is_valid, message)
        """
        clean_email = email.lower().strip()
        clean_token = token.strip()
        now = datetime.utcnow()

        with self._lock:
            record = self._store.get(clean_email)
            if not record:
                return False, "Invalid or expired verification code."

            # Check expiration
            if now > record.expires_at:
                del self._store[clean_email]
                return False, "Verification code has expired. Please request a new one."

            # Check brute-force attempts
            record.attempts += 1
            if record.attempts > OTP_MAX_ATTEMPTS:
                del self._store[clean_email]
                return False, "Too many failed attempts. This code has been invalidated. Please request a new code."

            # Constant-time comparison
            expected_hash = record.token_hash
            actual_hash = self._hash_token(clean_email, clean_token)

            if hmac.compare_digest(expected_hash, actual_hash):
                # Valid: Consume immediately (single-use)
                del self._store[clean_email]
                return True, "Verification successful."

            attempts_left = max(0, OTP_MAX_ATTEMPTS - record.attempts)
            return False, f"Incorrect verification code. ({attempts_left} attempts remaining)"

    def cleanup_expired(self):
        """Removes expired records to prevent unbounded memory growth."""
        now = datetime.utcnow()
        with self._lock:
            expired_keys = [k for k, v in self._store.items() if now > v.expires_at]
            for k in expired_keys:
                del self._store[k]


otp_manager = OTPManager()


def is_smtp_configured() -> bool:
    """Returns True if minimum required SMTP settings are present."""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def send_otp_email(to_email: str, code: str) -> Tuple[bool, Optional[str]]:
    """
    Sends a beautifully styled HTML email containing the 6-digit OTP code via SMTP.
    Returns: (success: bool, error_msg: Optional[str])
    """
    if not is_smtp_configured():
        return False, "SMTP is not configured on the backend."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{code} is your FinAI verification code"
        msg["From"] = SMTP_FROM
        msg["To"] = to_email

        text_content = (
            f"Hello,\n\n"
            f"Your FinAI verification code is: {code}\n\n"
            f"This code will expire in {OTP_EXPIRY_MINUTES} minutes.\n"
            f"If you did not request this code, please ignore this email or review your account security.\n\n"
            f"— FinAI Team"
        )

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FinAI Verification Code</title>
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }}
            .container {{ max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
            .header {{ background: linear-gradient(135deg, #0F382C, #185A46); padding: 32px 24px; text-align: center; color: #FFFFFF; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
            .header p {{ margin: 8px 0 0; font-size: 13px; opacity: 0.85; }}
            .body {{ padding: 32px 24px; text-align: center; }}
            .code-box {{ display: inline-block; background-color: #ECFDF5; border: 2px dashed #10B981; border-radius: 12px; padding: 16px 28px; margin: 24px 0; }}
            .code-text {{ font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0F382C; font-family: 'Courier New', Courier, monospace; margin: 0; }}
            .note {{ font-size: 13px; color: #64748B; line-height: 1.6; margin: 16px 0; }}
            .footer {{ border-top: 1px solid #F1F5F9; padding: 20px 24px; text-align: center; font-size: 11px; color: #94A3B8; background-color: #F8FAFC; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FinAI Password Reset</h1>
              <p>Smart Personal Finance Assistant</p>
            </div>
            <div class="body">
              <p style="font-size: 15px; margin: 0 0 12px; color: #334155;">Hello,</p>
              <p style="font-size: 14px; margin: 0; color: #475569;">You requested a password reset for your FinAI mobile account. Enter the 6-digit code below to set your new password:</p>
              <div class="code-box">
                <span class="code-text">{code}</span>
              </div>
              <p class="note">This verification code is valid for <strong>{OTP_EXPIRY_MINUTES} minutes</strong> and can only be used once.<br>If you did not request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              &copy; {datetime.utcnow().year} FinAI. All rights reserved.<br>
              Never share this verification code with anyone.
            </div>
          </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if SMTP_SSL or SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
            if SMTP_TLS:
                server.starttls()

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True, None
    except Exception as e:
        return False, str(e)
