import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import schemas
import database
from ai_service import process_receipt_image, answer_finance_query

load_dotenv()

# JWT Config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "hackathon-secret-jwt-key")
ALGORITHM = "HS256"

# Initialize database on startup
database.init_db()

app = FastAPI(
    title="BeHisabi Personal Finance Assistant API",
    version="1.0.0",
    description="Backend API for personal finance tracking, budget calculations, receipt extraction, and AI advice."
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

# --- AUTH HELPERS & SECURITY DEPENDENCY ---

security = HTTPBearer(auto_error=True)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db)
) -> database.UserDB:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: subject missing.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = database.get_user_by_id_repo(db, user_id=str(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# --- HEALTH ---

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "Online",
        "service": "BeHisabi Personal Finance Assistant Engine",
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
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        return database.calculate_dashboard_summary_repo(db, user_id=str(current_user.id))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate dashboard summary: {str(e)}"
        )

@app.put("/api/user/income", tags=["Dashboard"])
def update_user_income(
    data: IncomeUpdate,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        database.update_income_repo(db, user_id=str(current_user.id), income=data.income)
        return {"status": "success", "monthly_income": data.income}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/budgets", tags=["Budgets"])
def set_or_update_budget(
    data: BudgetSet,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        database.set_budget_repo(
            db, user_id=str(current_user.id), category=data.category, limit=data.monthly_limit
        )
        return {"status": "success", "category": data.category, "allocated": data.monthly_limit}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CATEGORY MANAGEMENT ROUTES ---

@app.get(
    "/api/categories",
    response_model=List[schemas.CategoryResponse],
    summary="List User Categories",
    tags=["Categories"]
)
def get_categories(
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        return database.get_categories_repo(db, user_id=str(current_user.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@app.post(
    "/api/categories",
    response_model=schemas.CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create User Category",
    tags=["Categories"]
)
def create_category(
    cat_in: schemas.CategoryCreate,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        return database.create_category_repo(
            db=db,
            user_id=str(current_user.id),
            name=cat_in.name,
            cat_type=cat_in.type,
            color=cat_in.color or "#E5484D",
            icon=cat_in.icon or "tag"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@app.delete(
    "/api/categories/{category_id}",
    summary="Delete User Category",
    tags=["Categories"]
)
def delete_category(
    category_id: str,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        database.delete_category_repo(db=db, user_id=str(current_user.id), category_id_or_name=category_id)
        return {"status": "success", "deleted_category": category_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")

# --- WALLET ROUTES ---

@app.get(
    "/api/wallets",
    response_model=schemas.WalletResponse,
    summary="Get User Wallet Balances",
    tags=["Wallets"]
)
def get_user_wallets(
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        data = database.get_user_wallets_repo(db, str(current_user.id))
        return schemas.WalletResponse(
            cash_balance=data["cash"],
            online_balance=data["online"],
            total_balance=data["total"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch wallet balances: {str(e)}"
        )

@app.put(
    "/api/wallets/{wallet_type}",
    response_model=schemas.WalletResponse,
    summary="Set Cash or Online Wallet Balance",
    tags=["Wallets"]
)
def set_wallet_balance(
    wallet_type: str,
    req: schemas.WalletSetRequest,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        data = database.set_wallet_balance_repo(
            db, user_id=str(current_user.id), wallet_type=wallet_type, balance=req.balance
        )
        return schemas.WalletResponse(
            cash_balance=data["cash"],
            online_balance=data["online"],
            total_balance=data["total"]
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set wallet balance: {str(e)}"
        )

@app.post(
    "/api/wallets/transfer",
    response_model=schemas.WalletResponse,
    summary="Transfer Funds between Cash and Online",
    tags=["Wallets"]
)
def transfer_wallet_funds(
    req: schemas.WalletTransferRequest,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        data = database.transfer_wallet_balance_repo(
            db,
            user_id=str(current_user.id),
            source=req.source,
            destination=req.destination,
            amount=req.amount
        )
        return schemas.WalletResponse(
            cash_balance=data["cash"],
            online_balance=data["online"],
            total_balance=data["total"]
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transfer wallet funds: {str(e)}"
        )

# --- TRANSACTION ROUTES ---

@app.get(
    "/api/transactions",
    response_model=List[schemas.TransactionResponse],
    summary="List Transactions",
    tags=["Transactions"]
)
def get_transactions(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=200, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Records offset"),
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        txs = database.get_transactions_repo(
            db=db,
            user_id=str(current_user.id),
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
                payment_source=getattr(tx, "payment_source", "cash") or "cash",
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
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        new_tx = database.create_transaction_repo(db=db, tx=tx_in, user_id=str(current_user.id))
        return schemas.TransactionResponse(
            id=new_tx.id,
            merchant=new_tx.merchant,
            category=new_tx.category,
            amount=float(new_tx.amount),
            date=new_tx.date,
            payment_source=getattr(new_tx, "payment_source", "cash") or "cash",
            receipt_url=new_tx.receipt_url
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create transaction: {str(e)}"
        )

@app.delete(
    "/api/transactions/{transaction_id}",
    summary="Delete Transaction",
    tags=["Transactions"]
)
def delete_transaction(
    transaction_id: str,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        deleted = database.delete_transaction_repo(
            db=db,
            user_id=str(current_user.id),
            transaction_id=transaction_id
        )
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found or not owned by current user."
            )
        return {"status": "success", "deleted_id": transaction_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete transaction: {str(e)}"
        )

# --- AI INSIGHTS ROUTE ---

@app.get(
    "/api/insights",
    response_model=schemas.AIInsightsResponse,
    summary="Get Financial Insights",
    tags=["Insights"]
)
def get_insights(
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        insights = database.generate_insights_repo(db, user_id=str(current_user.id))
        return schemas.AIInsightsResponse(insights=insights)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate financial insights: {str(e)}"
        )

# --- RECEIPT EXTRACTION ROUTE ---

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

# --- AI CHAT ROUTE ---

@app.post("/api/chat", response_model=schemas.ChatMessageResponse, tags=["AI"])
def chat_with_finai(
    req: schemas.ChatMessageRequest,
    current_user: database.UserDB = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        summary_data = database.calculate_dashboard_summary_repo(db, user_id=str(current_user.id))
        wallets_data = database.get_user_wallets_repo(db, user_id=str(current_user.id))
        user_context = {
            "total_balance": wallets_data["total"],
            "cash_balance": wallets_data["cash"],
            "online_balance": wallets_data["online"],
            "monthly_income": summary_data.monthly_income,
            "total_budget": summary_data.total_budget,
            "total_spent": summary_data.total_spent,
            "remaining": summary_data.remaining,
            "categories": [
                {"name": c.name, "allocated": c.allocated, "spent": c.spent}
                for c in summary_data.categories
            ]
        }
        reply_text = answer_finance_query(question=req.message, user_context=user_context)
        return schemas.ChatMessageResponse(reply=reply_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI chat error: {str(e)}"
        )