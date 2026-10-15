import os
import json
from PIL import Image
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def process_receipt_image(image_path: str) -> dict:
    """
    রসিদের ছবি পড়ে Merchant, Category, Amount, Date এক্সট্র্যাক্ট করে JSON দেয়।
    """
    img = Image.open(image_path)

    prompt = """
    Analyze this receipt or bill image and extract the following details in raw JSON format:
    - merchant: Name of the shop, restaurant, or business.
    - category: Choose the single best fit from ["Food", "Groceries", "Transport", "Utilities", "Entertainment", "Shopping", "Others"].
    - amount: Total amount paid as a clean float number (e.g. 1450.00).
    - date: Date of purchase in YYYY-MM-DD format (if visible, otherwise today's date).

    CRITICAL: Return ONLY a valid JSON object without any markdown syntax, code blocks, or extra text.
    Example output format:
    {"merchant": "Sultan's Dine", "category": "Food", "amount": 1450.0, "date": "2026-10-15"}
    """

    # গুগলের বর্তমান একটিভ নতুন মডেলসমূহ
    models_to_try = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.8-flash'
    ]

    response = None
    last_error = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[img, prompt]
            )
            if response and response.text:
                break
        except Exception as e:
            last_error = e
            continue

    if not response or not response.text:
        raise Exception(f"Failed to process with Gemini models. Last error: {str(last_error)}")

    raw_text = response.text.strip()

    if raw_text.startswith("```json"):
        raw_text = raw_text[7:-3].strip()
    elif raw_text.startswith("```"):
        raw_text = raw_text[3:-3].strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        return {
            "merchant": "Unknown Merchant",
            "category": "Others",
            "amount": 0.0,
            "date": "2026-10-15",
            "raw_text": raw_text
        }