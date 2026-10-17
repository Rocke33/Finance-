import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import schemas
import database
from ai_service import process_receipt_image

load_dotenv()

# JWT Config
SECRET_KEY = "hackathon-secret-jwt-key"
ALGORITHM = "HS256"

# Initialize database on startup
database.init_db()

app = FastAPI(
    title="AI-Powered Personal Finance Assistant API",
    version="1.0.0",
    description="Backend API for personal finance tracking, budget calculations, and AI receipt processing."
)

# CORS configuration
required_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
allowed_origins_env = os.getenv("CORS_ORIGINS", "")
configured_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
origins = list(dict.fromkeys(required_origins + configured_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_uploads")
os.makedirs(TEMP_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB limit
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif"
}

# --- SCHEMAS / MODELS ---

class IncomeUpdate(BaseModel):
    income: float

class BudgetSet(BaseModel):
    category: str
    monthly_limit: float

# --- HELPER FUNCTIONS ---

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- ROUTES ---

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "Online",
        "service": "AI-Powered Personal Finance Engine",
        "version": "1.0.0"
    }

# --- AUTH ROUTES ---

@app.post("/api/auth/register", response_model=schemas.TokenResponse, tags=["Auth"])
def register_user(user_in: schemas.UserRegister, db: Session = Depends(database.get_db)):
    existing = database.get_user_by_email_repo(db, email=user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    new_user = database.create_user_repo(
        db,
        name=user_in.name,
        email=user_in.email,
        password=user_in.password,
        income=user_in.income or 0.0
    )
    
    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "income": float(new_user.income or 0)
        }
    }

@app.post("/api/auth/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login_user(user_in: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = database.authenticate_user_repo(db, email=user_in.email, password=user_in.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "income": float(user.income or 0)
        }
    }

# --- DASHBOARD & BUDGET ROUTES ---

@app.get(
    "/api/dashboard",
    response_model=schemas.DashboardSummary,
    summary="Get Dashboard Summary",
    tags=["Dashboard"]
)
def get_dashboard_summary(
    user_id: str = database.DEFAULT_DEMO_USER_ID,
    db: Session = Depends(database.get_db)
):
    try:
        return database.calculate_dashboard_summary_repo(db, user_id=user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate dashboard summary: {str(e)}"
        )

@app.put("/api/user/income", tags=["Dashboard"])
def update_user_income(
    data: IncomeUpdate,
    user_id: str = database.DEFAULT_DEMO_USER_ID,
    db: Session = Depends(database.get_db)
):
    try:
        updated = database.update_income_repo(db, user_id=user_id, income=data.income)
        return {"status": "success", "monthly_income": data.income}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/budgets", tags=["Budgets"])
def set_or_update_budget(
    data: BudgetSet,
    user_id: str = database.DEFAULT_DEMO_USER_ID,
    db: Session = Depends(database.get_db)
):
    try:
        budget = database.set_budget_repo(
            db, user_id=user_id, category=data.category, limit=data.monthly_limit
        )
        return {"status": "success", "category": data.category, "allocated": data.monthly_limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/api/transactions",
    response_model=List[schemas.TransactionResponse],
    summary="List Transactions",
    tags=["Transactions"]
)
def get_transactions(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=100, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Records offset"),
    user_id: str = database.DEFAULT_DEMO_USER_ID,
    db: Session = Depends(database.get_db)
):
    try:
        txs = database.get_transactions_repo(
            db=db,
            user_id=user_id,
            category=category,
            limit=limit,
            offset=offset
        )
        return [
            schemas.TransactionResponse(
                id=tx.id,
                merchant=tx.merchant,
                category=tx.category,
                amount=float(tx.amount),
                date=tx.date,
                receipt_url=tx.receipt_url
            )
            for tx in txs
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve transactions: {str(e)}"
        )

@app.post(
    "/api/transactions",
    response_model=schemas.TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Transaction",
    tags=["Transactions"]
)
def create_transaction(
    tx_in: schemas.TransactionCreate,
    user_id: str = database.DEFAULT_DEMO_USER_ID,
    db: Session = Depends(database.get_db)
):
    try:
        new_tx = database.create_transaction_repo(db=db, tx=tx_in, user_id=user_id)
        return schemas.TransactionResponse(
            id=new_tx.id,
            merchant=new_tx.merchant,
            category=new_tx.category,
            amount=float(new_tx.amount),
            date=new_tx.date,
            receipt_url=new_tx.receipt_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create transaction: {str(e)}"
        )

@app.get(
    "/api/insights",
    response_model=schemas.AIInsightsResponse,
    summary="Get Financial Insights",
    tags=["Insights"]
)
def get_insights(
    user_id: str = database.DEFAULT_DEMO_USER_ID,
    db: Session = Depends(database.get_db)
):
    try:
        insights = database.generate_insights_repo(db, user_id=user_id)
        return schemas.AIInsightsResponse(insights=insights)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate financial insights: {str(e)}"
        )

@app.post(
    "/api/upload-receipt",
    response_model=schemas.ReceiptExtraction,
    summary="Upload & Extract Receipt",
    tags=["Receipts"]
)
async def upload_receipt(file: UploadFile = File(...)):
    content_type = file.content_type or ""
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Please upload a valid image (JPEG, PNG, WEBP)."
        )

    safe_suffix = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    unique_filename = f"receipt_{uuid.uuid4().hex}{safe_suffix}"
    file_path = os.path.join(TEMP_DIR, unique_filename)

    file_size = 0
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 64):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds the 5MB limit. Please upload a smaller receipt image."
                    )
                buffer.write(chunk)

        extracted_data = process_receipt_image(file_path)
        return extracted_data

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Image validation error: {str(ve)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Receipt processing failed: {str(e)}"
        )
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass