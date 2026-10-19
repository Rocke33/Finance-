from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
from datetime import date as DateType
from decimal import Decimal

# --- TRANSACTION SCHEMAS ---

class TransactionBase(BaseModel):
    merchant: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    date: str = Field(..., description="ISO formatted date YYYY-MM-DD")
    receipt_url: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        return round(float(v), 2)

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str

    class Config:
        from_attributes = True

# --- BUDGET SCHEMAS ---

class BudgetCategory(BaseModel):
    name: str
    allocated: float
    spent: float
    status: Literal["normal", "warning", "danger"]

class DashboardSummary(BaseModel):
    monthly_income: float
    total_budget: float
    total_spent: float
    remaining: float
    categories: List[BudgetCategory]

# --- AI INSIGHT SCHEMAS ---

class AIInsight(BaseModel):
    id: str
    type: Literal["alert", "warning", "suggestion"]
    message: str
    action: str

class AIInsightsResponse(BaseModel):
    insights: List[AIInsight]

# --- RECEIPT EXTRACTION SCHEMAS ---

class ReceiptExtraction(BaseModel):
    merchant: str
    category: str
    amount: float
    date: str
    receipt_url: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    is_fallback: bool = False
    notes: Optional[str] = None

# --- AUTH SCHEMAS ---

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=4)
    income: Optional[float] = 0.0

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    income: float

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- CHAT SCHEMAS ---

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)

class ChatMessageResponse(BaseModel):
    reply: str

# --- CATEGORY SCHEMAS ---

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: Literal["expense", "income", "savings"] = "expense"
    color: Optional[str] = "#E5484D"
    icon: Optional[str] = "tag"

class CategoryResponse(BaseModel):
    id: str
    name: str
    type: str
    color: str
    icon: str

    class Config:
        from_attributes = True