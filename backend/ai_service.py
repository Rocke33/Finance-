import os
import json
import logging
from typing import Optional
from datetime import date
from PIL import Image
from dotenv import load_dotenv
import schemas

load_dotenv()
logger = logging.getLogger("ai_service")

# Current supported Gemini models
SUPPORTED_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
]

_genai_client = None

def get_genai_client():
    """
    Lazy initialization of Google GenAI client to avoid crashes on startup
    when GEMINI_API_KEY is not yet configured.
    """
    global _genai_client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key.startswith("your_"):
        return None

    if _genai_client is None:
        try:
            from google import genai
            _genai_client = genai.Client(api_key=api_key.strip())
        except Exception as e:
            logger.error(f"Error initializing Google GenAI Client: {e}")
            return None
    return _genai_client

def process_receipt_image(image_path: str) -> schemas.ReceiptExtraction:
    """
    Processes receipt image to extract merchant, category, amount, and date.
    Validates output strictly. If GEMINI_API_KEY is missing, returns safe fallback.
    """
    client = get_genai_client()
    today_str = date.today().isoformat()

    if client is None:
        logger.warning("GEMINI_API_KEY not configured. Falling back to testable receipt parser.")
        # Try inspecting basic image to confirm it's valid
        try:
            with Image.open(image_path) as img:
                w, h = img.size
                format_name = img.format or "Image"
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image file: {e}")

        return schemas.ReceiptExtraction(
            merchant="Sultan's Dine (Receipt Fallback)",
            category="Food",
            amount=1450.00,
            date=today_str,
            confidence=0.50,
            is_fallback=True,
            notes=f"Valid {format_name} ({w}x{h}px) received. GEMINI_API_KEY is not set in backend/.env. Add your key to enable live Gemini Vision OCR."
        )

    # Process with Gemini Vision
    try:
        with Image.open(image_path) as img:
            img.verify()
        # Re-open after verify
        img = Image.open(image_path)
    except Exception as e:
        raise ValueError(f"Unreadable or unsupported image format: {e}")

    prompt = f"""
    Analyze this receipt image and extract structured transaction details.
    Return ONLY a valid JSON object with the following fields:
    - "merchant": Business or store name (string)
    - "category": Choose one of ["Food", "Groceries", "Transport", "Utilities", "Entertainment", "Shopping", "Others"]
    - "amount": Total amount paid as a positive number (float, e.g. 1450.00)
    - "date": Date of transaction in YYYY-MM-DD format (if visible, otherwise "{today_str}")
    - "confidence": Float between 0.0 and 1.0 representing extraction confidence

    CRITICAL: Do NOT wrap in markdown code blocks. Return RAW JSON only.
    """

    response = None
    last_error = None

    for model_name in SUPPORTED_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[img, prompt]
            )
            if response and response.text:
                break
        except Exception as e:
            last_error = e
            logger.warning(f"Failed with {model_name}: {e}")
            continue

    if not response or not response.text:
        raise RuntimeError(f"Gemini API request failed across models. Last error: {last_error}")

    raw_text = response.text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    if raw_text.startswith("```"):
        raw_text = raw_text[3:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    raw_text = raw_text.strip()

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse JSON response: {raw_text}")
        return schemas.ReceiptExtraction(
            merchant="Unrecognized Merchant",
            category="Others",
            amount=0.00,
            date=today_str,
            confidence=0.20,
            is_fallback=False,
            notes="Receipt was scanned but text was partially unreadable. Please edit details manually."
        )

    # Validate and clean data
    merchant = str(parsed.get("merchant", "Scanned Merchant")).strip() or "Scanned Merchant"
    category = str(parsed.get("category", "Others")).strip()
    valid_categories = ["Food", "Groceries", "Transport", "Utilities", "Entertainment", "Shopping", "Others"]
    if category not in valid_categories:
        category = "Others"

    try:
        amount = round(float(parsed.get("amount", 0.0)), 2)
        if amount < 0:
            amount = 0.0
    except (ValueError, TypeError):
        amount = 0.0

    tx_date = str(parsed.get("date", today_str)).strip()
    confidence = float(parsed.get("confidence", 0.85)) if parsed.get("confidence") is not None else 0.85

    return schemas.ReceiptExtraction(
        merchant=merchant,
        category=category,
        amount=amount,
        date=tx_date,
        confidence=min(max(confidence, 0.0), 1.0),
        is_fallback=False,
        notes=None
    )