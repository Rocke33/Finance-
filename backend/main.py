from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from ai_service import process_receipt_image

app = FastAPI(title="Personal Finance AI Engine")

# মৌ-এর React (Vite) ফ্রন্টএন্ড এবং কানেকশনের জন্য CORS অ্যালাউ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ডেভেলপমেন্টের জন্য অল অ্যালাউড
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.get("/")
def home():
    return {"status": "Online", "service": "Finance AI Engine"}

@app.post("/api/upload-receipt")
async def upload_receipt(file: UploadFile = File(...)):
    """
    ছবি আপলোড গ্রহণ করে এবং AI দিয়ে ডাটা এক্সট্র্যাক্ট করে JSON রেসপন্স দেয়।
    """
    try:
        file_path = os.path.join(TEMP_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # AI দিয়ে ছবি অ্যানালাইসিস
        extracted_data = process_receipt_image(file_path)

        # টেম্পোরারি ফাইল রিমুভ করা
        if os.path.exists(file_path):
            os.remove(file_path)

        return {
            "success": True,
            "data": extracted_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))