import os
import uuid
import hashlib
import hmac
from decimal import Decimal
from datetime import datetime, date
from typing import List, Optional
from dotenv import load_dotenv
from passlib.context import CryptContext
from sqlalchemy import (
    create_engine, Column, String, Numeric, Date, DateTime, ForeignKey, func, select, inspect, TypeDecorator
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
import schemas

load_dotenv()

# Database URL configuration: defaults to local SQLite for instant zero-config execution
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance.db")

# SQLite needs check_same_thread=False for FastAPI concurrency
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UUIDString(TypeDecorator):
    """
    PostgreSQL-এ থাকলে নেটিভ UUID ব্যবহার করে, SQLite-এ থাকলে String(36)
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID(as_uuid=False))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

class DateString(TypeDecorator):
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(Date())
        return dialect.type_descriptor(String(20))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return datetime.strptime(value.strip(), "%Y-%m-%d").date()
            except (TypeError, ValueError):
                return value
        return value

    def process_result_value(self, value, dialect):
        return str(value) if value is not None else None

def generate_uuid() -> str:
    """Supabase এবং SQLite উভয়ের সাথে সামঞ্জস্যপূর্ণ স্ট্যান্ডার্ড UUID তৈরি করে"""
    return str(uuid.uuid4())

# --- DATABASE MODELS ---

class UserDB(Base):
    __tablename__ = "users"

    id = Column(UUIDString(), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    income = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    hashed_password = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    budgets = relationship("BudgetDB", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("TransactionDB", back_populates="user", cascade="all, delete-orphan")

class BudgetDB(Base):
    __tablename__ = "budgets"

    id = Column(UUIDString(), primary_key=True, default=generate_uuid)
    user_id = Column(UUIDString(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    monthly_limit = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="budgets")

class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(UUIDString(), primary_key=True, default=generate_uuid)
    user_id = Column(UUIDString(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    merchant = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    date = Column(DateString(), nullable=False)
    receipt_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="transactions")

# --- INITIALIZATION & SEEDING ---
DEFAULT_DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

def init_db():
    Base.metadata.create_all(bind=engine)
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    missing_auth_columns = {
        "hashed_password": "VARCHAR(255)",
        "password_hash": "VARCHAR(255)",
    }
    missing_auth_columns = {
        name: column_type
        for name, column_type in missing_auth_columns.items()
        if name not in user_columns
    }
    if missing_auth_columns:
        with engine.begin() as connection:
            for name, column_type in missing_auth_columns.items():
                connection.exec_driver_sql(
                    f"ALTER TABLE users ADD COLUMN {name} {column_type}"
                )
    with SessionLocal() as db:
        seed_data_if_empty(db)

def seed_data_if_empty(db: Session):
    user = db.query(UserDB).filter(UserDB.id == DEFAULT_DEMO_USER_ID).first()
    if not user:
        user = UserDB(
            id=DEFAULT_DEMO_USER_ID,
            name="Demo User",
            email="demo@finance.app",
            income=Decimal("60000.00")
        )
        db.add(user)
        db.commit()

    # Check budgets
    budget_count = db.query(BudgetDB).filter(BudgetDB.user_id == DEFAULT_DEMO_USER_ID).count()
    if budget_count == 0:
        default_budgets = [
            ("Food", Decimal("10000.00")),
            ("Groceries", Decimal("15000.00")),
            ("Transport", Decimal("5000.00")),
            ("Entertainment", Decimal("5000.00")),
            ("Shopping", Decimal("10000.00")),
            ("Utilities", Decimal("8000.00")),
        ]
        for cat, limit in default_budgets:
            db.add(BudgetDB(
                id=str(uuid.uuid4()),
                user_id=DEFAULT_DEMO_USER_ID,
                category=cat,
                monthly_limit=limit
            ))
        db.commit()

    # Check transactions
    tx_count = db.query(TransactionDB).filter(TransactionDB.user_id == DEFAULT_DEMO_USER_ID).count()
    if tx_count == 0:
        initial_txs = [
            ("Sultan's Dine", "Food", Decimal("1450.00"), "2026-10-14", None),
            ("Agora Superstore", "Groceries", Decimal("3200.00"), "2026-10-12", None),
            ("Pathao Rides", "Transport", Decimal("350.00"), "2026-10-13", None),
            ("Star Cineplex", "Entertainment", Decimal("1200.00"), "2026-10-14", None),
            ("Aarong", "Shopping", Decimal("4500.00"), "2026-10-14", None),
            ("Desco Electric Bill", "Utilities", Decimal("3800.00"), "2026-10-10", None),
            ("Chillox Burgers", "Food", Decimal("850.00"), "2026-10-15", None),
        ]
        for merchant, category, amount, date_str, receipt_url in initial_txs:
            db.add(TransactionDB(
                id=str(uuid.uuid4()),
                user_id=DEFAULT_DEMO_USER_ID,
                merchant=merchant,
                category=category,
                amount=amount,
                date=date_str,
                receipt_url=receipt_url
            ))
        db.commit()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- REPOSITORY & BUSINESS LOGIC ---

_PASSWORD_HASH_SCHEME = "pbkdf2_sha256"
_PASSWORD_HASH_ITERATIONS = 310_000
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def _verify_legacy_password(password: str, stored_hash: Optional[str]) -> bool:
    if not stored_hash:
        return False

    try:
        scheme, iterations, salt, expected_digest = stored_hash.split("$", 3)
        if scheme != _PASSWORD_HASH_SCHEME:
            return False
        actual_digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt),
            int(iterations),
        ).hex()
    except (ValueError, TypeError):
        return False

    return hmac.compare_digest(actual_digest, expected_digest)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except (TypeError, ValueError):
        return False

def get_user_by_email_repo(db: Session, email: str) -> Optional[UserDB]:
    return db.query(UserDB).filter(UserDB.email == email.strip().lower()).first()

def get_user_by_id_repo(db: Session, user_id: str) -> Optional[UserDB]:
    return db.query(UserDB).filter(UserDB.id == user_id).first()

def create_user_repo(
    db: Session,
    name: str,
    email: str,
    password: str,
    income: float = 0.0,
) -> UserDB:
    new_user = UserDB(
        id=str(uuid.uuid4()),
        name=name.strip(),
        email=email.strip().lower(),
        income=Decimal(str(round(income, 2))),
        password_hash=hash_password(password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user_repo(db: Session, email: str, password: str) -> Optional[UserDB]:
    user = get_user_by_email_repo(db, email)
    if user is None:
        return None

    if user.password_hash:
        return user if verify_password(password, user.password_hash) else None

    if _verify_legacy_password(password, user.hashed_password):
        user.password_hash = hash_password(password)
        user.hashed_password = None
        db.commit()
        db.refresh(user)
        return user

    return None

def get_transactions_repo(
    db: Session,
    user_id: str = DEFAULT_DEMO_USER_ID,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[TransactionDB]:
    query = db.query(TransactionDB).filter(TransactionDB.user_id == user_id)
    if category and category.lower() != "all":
        query = query.filter(TransactionDB.category.ilike(category))
    return query.order_by(TransactionDB.date.desc(), TransactionDB.created_at.desc()).offset(offset).limit(limit).all()

def create_transaction_repo(
    db: Session,
    tx: schemas.TransactionCreate,
    user_id: str = DEFAULT_DEMO_USER_ID
) -> TransactionDB:
    db_tx = TransactionDB(
        id=str(uuid.uuid4()),
        user_id=user_id,
        merchant=tx.merchant.strip(),
        category=tx.category.strip(),
        amount=Decimal(str(round(tx.amount, 2))),
        date=tx.date,
        receipt_url=tx.receipt_url
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def update_income_repo(db: Session, user_id: str, income: float) -> UserDB:
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if user is None:
        raise ValueError(f"User '{user_id}' was not found")

    user.income = Decimal(str(round(income, 2)))
    db.commit()
    db.refresh(user)
    return user

def set_budget_repo(db: Session, user_id: str, category: str, limit: float) -> BudgetDB:
    budget = db.query(BudgetDB).filter(
        BudgetDB.user_id == user_id,
        func.lower(BudgetDB.category) == category.strip().lower(),
    ).first()

    if budget is None:
        budget = BudgetDB(
            id=str(uuid.uuid4()),
            user_id=user_id,
            category=category.strip(),
            monthly_limit=Decimal(str(round(limit, 2))),
        )
        db.add(budget)
    else:
        budget.monthly_limit = Decimal(str(round(limit, 2)))

    db.commit()
    db.refresh(budget)
    return budget

def calculate_dashboard_summary_repo(
    db: Session,
    user_id: str = DEFAULT_DEMO_USER_ID
) -> schemas.DashboardSummary:
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    monthly_income = float(user.income) if user else 0.0

    budgets = db.query(BudgetDB).filter(BudgetDB.user_id == user_id).all()
    transactions = db.query(TransactionDB).filter(TransactionDB.user_id == user_id).all()

    spending_by_category = {}
    total_spent = Decimal("0.00")
    for tx in transactions:
        amt = Decimal(str(tx.amount))
        total_spent += amt
        cat = tx.category
        spending_by_category[cat] = spending_by_category.get(cat, Decimal("0.00")) + amt

    total_budget = Decimal("0.00")
    category_summaries: List[schemas.BudgetCategory] = []

    processed_categories = set()
    for b in budgets:
        cat_name = b.category
        allocated = Decimal(str(b.monthly_limit))
        total_budget += allocated
        spent = spending_by_category.get(cat_name, Decimal("0.00"))
        processed_categories.add(cat_name)

        if allocated > 0:
            ratio = spent / allocated
            if ratio >= Decimal("1.0"):
                status = "danger"
            elif ratio >= Decimal("0.8"):
                status = "warning"
            else:
                status = "normal"
        else:
            status = "danger" if spent > 0 else "normal"

        category_summaries.append(schemas.BudgetCategory(
            name=cat_name,
            allocated=float(allocated),
            spent=float(spent),
            status=status
        ))

    for cat_name, spent in spending_by_category.items():
        if cat_name not in processed_categories:
            category_summaries.append(schemas.BudgetCategory(
                name=cat_name,
                allocated=0.0,
                spent=float(spent),
                status="danger"
            ))

    remaining = float(total_budget - total_spent)

    return schemas.DashboardSummary(
        monthly_income=monthly_income,
        total_budget=float(total_budget),
        total_spent=float(total_spent),
        remaining=remaining,
        categories=category_summaries
    )

def generate_insights_repo(
    db: Session,
    user_id: str = DEFAULT_DEMO_USER_ID
) -> List[schemas.AIInsight]:
    summary = calculate_dashboard_summary_repo(db, user_id)
    insights: List[schemas.AIInsight] = []
    ins_counter = 1

    if summary.total_budget > 0:
        overall_ratio = summary.total_spent / summary.total_budget
        if overall_ratio >= 0.9:
            insights.append(schemas.AIInsight(
                id=f"ins_{ins_counter}",
                type="alert",
                message=f"You have spent {round(overall_ratio * 100, 1)}% of your monthly budget.",
                action="Limit discretionary spending for the rest of the month to avoid exceeding your limit."
            ))
            ins_counter += 1
        elif overall_ratio >= 0.75:
            insights.append(schemas.AIInsight(
                id=f"ins_{ins_counter}",
                type="warning",
                message=f"Spending is pacing at {round(overall_ratio * 100, 1)}% of the total budget.",
                action="Review recent non-essential purchases to keep your savings on track."
            ))
            ins_counter += 1

    for cat in summary.categories:
        if cat.status == "danger":
            insights.append(schemas.AIInsight(
                id=f"ins_{ins_counter}",
                type="alert",
                message=f"{cat.name} budget exceeded: Spent BDT {cat.spent:,.2f} of allocated BDT {cat.allocated:,.2f}.",
                action=f"Freeze new expenses in {cat.name} or reallocate funds from lower-priority categories."
            ))
            ins_counter += 1
        elif cat.status == "warning":
            insights.append(schemas.AIInsight(
                id=f"ins_{ins_counter}",
                type="warning",
                message=f"{cat.name} budget is at {round((cat.spent / cat.allocated) * 100, 1)}% capacity.",
                action=f"Consider cooking at home or optimizing upcoming {cat.name} costs."
            ))
            ins_counter += 1

    if len(insights) == 0:
        insights.append(schemas.AIInsight(
            id=f"ins_{ins_counter}",
            type="suggestion",
            message="Your expenses are well within all category limits so far this month.",
            action=f"Consider allocating remaining balance (BDT {summary.remaining:,.2f}) into high-yield savings or emergency fund."
        ))

    return insights