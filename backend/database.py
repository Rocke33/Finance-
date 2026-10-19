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

# Database URL configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance.db")

# SQLite needs check_same_thread=False for FastAPI concurrency.
# PostgreSQL/Supabase should receive no SQLite-specific connection arguments.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
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
    wallets = relationship("WalletDB", back_populates="user", cascade="all, delete-orphan")

class BudgetDB(Base):
    __tablename__ = "budgets"

    id = Column(UUIDString(), primary_key=True, default=generate_uuid)
    user_id = Column(UUIDString(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    monthly_limit = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="budgets")

def _check_payment_source_col() -> bool:
    try:
        insp = inspect(engine)
        if engine.dialect.name == "postgresql":
            cols = {c["name"] for c in insp.get_columns("transactions", schema="public")}
        else:
            cols = {c["name"] for c in insp.get_columns("transactions")}
        return "payment_source" in cols
    except Exception:
        return False

_HAS_PAYMENT_SOURCE_COL = _check_payment_source_col()
_in_memory_tx_payment_sources = {}

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

    if _HAS_PAYMENT_SOURCE_COL:
        payment_source = Column(String(50), nullable=True, default="cash")
    else:
        @property
        def payment_source(self):
            return _in_memory_tx_payment_sources.get(str(self.id), "cash")

        @payment_source.setter
        def payment_source(self, val):
            _in_memory_tx_payment_sources[str(self.id)] = val

    user = relationship("UserDB", back_populates="transactions")

class WalletDB(Base):
    __tablename__ = "wallets"

    id = Column(UUIDString(), primary_key=True, default=generate_uuid)
    user_id = Column(UUIDString(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    wallet_type = Column(String(50), nullable=False)  # 'cash' or 'online'
    balance = Column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="wallets")

class CategoryDB(Base):
    __tablename__ = "categories"

    id = Column(UUIDString(), primary_key=True, default=generate_uuid)
    user_id = Column(UUIDString(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False, default="expense")
    color = Column(String(50), nullable=True, default="#E5484D")
    icon = Column(String(50), nullable=True, default="tag")
    created_at = Column(DateTime, default=datetime.utcnow)

# --- INITIALIZATION & SEEDING ---
DEFAULT_DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

def init_db():
    if DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    try:
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
    except Exception:
        pass

    # Ensure SQLite transactions table has payment_source column
    try:
        if DATABASE_URL.startswith("sqlite"):
            tx_columns = {column["name"] for column in inspect(engine).get_columns("transactions")}
            if "payment_source" not in tx_columns:
                with engine.begin() as connection:
                    connection.exec_driver_sql(
                        "ALTER TABLE transactions ADD COLUMN payment_source VARCHAR(50) DEFAULT 'cash'"
                    )
    except Exception:
        pass
    # No demo seed on startup: preserve genuine user isolation


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

# --- WALLET REPOSITORY & TWO-CATEGORY MODEL ---

_has_wallets_tbl = None
_in_memory_user_wallets = {}

def has_wallets_table() -> bool:
    global _has_wallets_tbl
    if _has_wallets_tbl is not None:
        return _has_wallets_tbl
    try:
        insp = inspect(engine)
        if engine.dialect.name == "postgresql":
            _has_wallets_tbl = insp.has_table("wallets", schema="public")
        else:
            _has_wallets_tbl = insp.has_table("wallets")
    except Exception:
        _has_wallets_tbl = False
    return bool(_has_wallets_tbl)

def get_user_wallets_repo(db: Session, user_id: str) -> dict:
    cash_bal = None
    online_bal = None

    if has_wallets_table():
        try:
            records = db.query(WalletDB).filter(WalletDB.user_id == user_id).all()
            for r in records:
                wtype = r.wallet_type.lower()
                if wtype == "cash":
                    cash_bal = Decimal(str(r.balance))
                elif wtype == "online":
                    online_bal = Decimal(str(r.balance))
            
            # If not yet seeded in database for this user, compute safe initial balance
            if cash_bal is None or online_bal is None:
                user = db.query(UserDB).filter(UserDB.id == user_id).first()
                user_income = Decimal(str(user.income)) if user and user.income else Decimal("0.00")
                user_spent_sum = db.query(func.coalesce(func.sum(TransactionDB.amount), 0)).filter(
                    TransactionDB.user_id == user_id
                ).scalar()
                spent_dec = Decimal(str(user_spent_sum or 0))
                unspent = max(Decimal("0.00"), user_income - spent_dec)

                if cash_bal is None:
                    cash_bal = (unspent / Decimal("2.00")).quantize(Decimal("0.01"))
                    db.add(WalletDB(user_id=user_id, wallet_type="cash", balance=cash_bal))
                if online_bal is None:
                    online_bal = max(Decimal("0.00"), unspent - cash_bal).quantize(Decimal("0.01"))
                    db.add(WalletDB(user_id=user_id, wallet_type="online", balance=online_bal))
                db.commit()
        except Exception:
            db.rollback()

    if cash_bal is None or online_bal is None:
        if user_id not in _in_memory_user_wallets:
            user = db.query(UserDB).filter(UserDB.id == user_id).first()
            user_income = Decimal(str(user.income)) if user and user.income else Decimal("0.00")
            user_spent_sum = db.query(func.coalesce(func.sum(TransactionDB.amount), 0)).filter(
                TransactionDB.user_id == user_id
            ).scalar()
            spent_dec = Decimal(str(user_spent_sum or 0))
            unspent = max(Decimal("0.00"), user_income - spent_dec)
            c_init = (unspent / Decimal("2.00")).quantize(Decimal("0.01"))
            o_init = max(Decimal("0.00"), unspent - c_init).quantize(Decimal("0.01"))
            _in_memory_user_wallets[user_id] = {
                "cash": c_init,
                "online": o_init
            }
        cash_bal = _in_memory_user_wallets[user_id]["cash"]
        online_bal = _in_memory_user_wallets[user_id]["online"]

    return {
        "cash": float(cash_bal),
        "online": float(online_bal),
        "total": float((cash_bal + online_bal).quantize(Decimal("0.01")))
    }

def set_wallet_balance_repo(db: Session, user_id: str, wallet_type: str, balance: float) -> dict:
    wtype = wallet_type.strip().lower()
    if wtype not in ("cash", "online"):
        raise ValueError(f"Invalid wallet type '{wallet_type}'. Supported wallet categories are 'cash' and 'online'.")
    if balance < 0:
        raise ValueError("Wallet balance cannot be negative. Legitimate zero balance is allowed.")

    target_bal = Decimal(str(round(balance, 2)))

    # Ensure wallet record exists
    get_user_wallets_repo(db, user_id)

    if has_wallets_table():
        try:
            record = db.query(WalletDB).filter(
                WalletDB.user_id == user_id,
                WalletDB.wallet_type == wtype
            ).first()
            if record:
                record.balance = target_bal
                record.updated_at = datetime.utcnow()
            else:
                db.add(WalletDB(user_id=user_id, wallet_type=wtype, balance=target_bal))
            db.commit()
        except Exception:
            db.rollback()
            raise

    if user_id in _in_memory_user_wallets:
        _in_memory_user_wallets[user_id][wtype] = target_bal

    return get_user_wallets_repo(db, user_id)

def transfer_wallet_balance_repo(db: Session, user_id: str, source: str, destination: str, amount: float) -> dict:
    src = source.strip().lower()
    dst = destination.strip().lower()
    if src not in ("cash", "online") or dst not in ("cash", "online"):
        raise ValueError("Wallet transfer source and destination must be either 'cash' or 'online'.")
    if src == dst:
        raise ValueError("Source and destination wallets must be different.")
    if amount <= 0:
        raise ValueError("Transfer amount must be strictly positive.")

    current = get_user_wallets_repo(db, user_id)
    transfer_dec = Decimal(str(round(amount, 2)))
    current_src_dec = Decimal(str(round(current[src], 2)))
    current_dst_dec = Decimal(str(round(current[dst], 2)))

    if current_src_dec < transfer_dec:
        raise ValueError(f"Insufficient funds in {src.title()} wallet. Available: ৳{float(current_src_dec):,.2f}, transfer amount: ৳{float(transfer_dec):,.2f}.")

    new_src_dec = current_src_dec - transfer_dec
    new_dst_dec = current_dst_dec + transfer_dec

    if has_wallets_table():
        try:
            src_rec = db.query(WalletDB).filter(WalletDB.user_id == user_id, WalletDB.wallet_type == src).first()
            dst_rec = db.query(WalletDB).filter(WalletDB.user_id == user_id, WalletDB.wallet_type == dst).first()
            if src_rec:
                src_rec.balance = new_src_dec
                src_rec.updated_at = datetime.utcnow()
            else:
                db.add(WalletDB(user_id=user_id, wallet_type=src, balance=new_src_dec))
            if dst_rec:
                dst_rec.balance = new_dst_dec
                dst_rec.updated_at = datetime.utcnow()
            else:
                db.add(WalletDB(user_id=user_id, wallet_type=dst, balance=new_dst_dec))
            db.commit()
        except Exception:
            db.rollback()
            raise

    if user_id in _in_memory_user_wallets:
        _in_memory_user_wallets[user_id][src] = new_src_dec
        _in_memory_user_wallets[user_id][dst] = new_dst_dec

    return get_user_wallets_repo(db, user_id)

def deduct_expense_from_wallet_repo(db: Session, user_id: str, wallet_type: str, amount: float) -> None:
    wtype = wallet_type.strip().lower()
    if wtype not in ("cash", "online"):
        wtype = "cash"
    deduct_dec = Decimal(str(round(amount, 2)))

    current = get_user_wallets_repo(db, user_id)
    current_bal_dec = Decimal(str(round(current[wtype], 2)))

    if current_bal_dec < deduct_dec:
        raise ValueError(
            f"Insufficient funds in {wtype.title()} wallet. Available balance: ৳{float(current_bal_dec):,.2f}, required: ৳{float(deduct_dec):,.2f}. Please choose another payment source or update your {wtype.title()} balance."
        )

    new_bal_dec = current_bal_dec - deduct_dec

    if has_wallets_table():
        try:
            rec = db.query(WalletDB).filter(WalletDB.user_id == user_id, WalletDB.wallet_type == wtype).first()
            if rec:
                rec.balance = new_bal_dec
                rec.updated_at = datetime.utcnow()
            else:
                db.add(WalletDB(user_id=user_id, wallet_type=wtype, balance=new_bal_dec))
            db.commit()
        except Exception:
            db.rollback()
            raise

    if user_id in _in_memory_user_wallets:
        _in_memory_user_wallets[user_id][wtype] = new_bal_dec

def refund_expense_to_wallet_repo(db: Session, user_id: str, wallet_type: str, amount: float) -> None:
    wtype = wallet_type.strip().lower()
    if wtype not in ("cash", "online"):
        wtype = "cash"
    refund_dec = Decimal(str(round(amount, 2)))

    current = get_user_wallets_repo(db, user_id)
    new_bal_dec = Decimal(str(round(current[wtype], 2))) + refund_dec

    if has_wallets_table():
        try:
            rec = db.query(WalletDB).filter(WalletDB.user_id == user_id, WalletDB.wallet_type == wtype).first()
            if rec:
                rec.balance = new_bal_dec
                rec.updated_at = datetime.utcnow()
            else:
                db.add(WalletDB(user_id=user_id, wallet_type=wtype, balance=new_bal_dec))
            db.commit()
        except Exception:
            db.rollback()

    if user_id in _in_memory_user_wallets:
        _in_memory_user_wallets[user_id][wtype] = new_bal_dec

def create_transaction_repo(
    db: Session,
    tx: schemas.TransactionCreate,
    user_id: str = DEFAULT_DEMO_USER_ID
) -> TransactionDB:
    source = (getattr(tx, "payment_source", None) or "cash").strip().lower()
    if source not in ("cash", "online"):
        source = "cash"

    amount_dec = Decimal(str(round(tx.amount, 2)))

    # 1. Atomically deduct expense from the selected wallet
    deduct_expense_from_wallet_repo(db, user_id=user_id, wallet_type=source, amount=float(amount_dec))

    # 2. Record transaction with payment_source
    tx_kwargs = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "merchant": tx.merchant.strip(),
        "category": tx.category.strip(),
        "amount": amount_dec,
        "date": tx.date,
        "receipt_url": tx.receipt_url,
    }
    if _HAS_PAYMENT_SOURCE_COL:
        tx_kwargs["payment_source"] = source

    db_tx = TransactionDB(**tx_kwargs)
    if not _HAS_PAYMENT_SOURCE_COL:
        db_tx.payment_source = source

    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def delete_transaction_repo(
    db: Session,
    user_id: str,
    transaction_id: str
) -> bool:
    tx = db.query(TransactionDB).filter(
        TransactionDB.id == transaction_id,
        TransactionDB.user_id == user_id
    ).first()
    if not tx:
        return False
    source = getattr(tx, "payment_source", "cash") or "cash"
    amt = float(tx.amount)
    db.delete(tx)
    db.commit()
    # Refund back to the source wallet
    refund_expense_to_wallet_repo(db, user_id=user_id, wallet_type=source, amount=amt)
    return True

# --- CATEGORY REPOSITORY & FALLBACK SYSTEM ---

DEFAULT_CATEGORIES = [
    # Expense Categories
    {"id": "cat_exp_1", "name": "Food", "type": "expense", "color": "#F97316", "icon": "Utensils"},
    {"id": "cat_exp_2", "name": "Transport", "type": "expense", "color": "#3B82F6", "icon": "Car"},
    {"id": "cat_exp_3", "name": "Bills & Utilities", "type": "expense", "color": "#8B5CF6", "icon": "Receipt"},
    {"id": "cat_exp_4", "name": "Shopping", "type": "expense", "color": "#EC4899", "icon": "ShoppingBag"},
    {"id": "cat_exp_5", "name": "Health", "type": "expense", "color": "#EF4444", "icon": "HeartPulse"},
    {"id": "cat_exp_6", "name": "Entertainment", "type": "expense", "color": "#10B981", "icon": "Film"},
    {"id": "cat_exp_7", "name": "Groceries", "type": "expense", "color": "#14B8A6", "icon": "ShoppingCart"},
    # Income Categories
    {"id": "cat_inc_1", "name": "Salary", "type": "income", "color": "#10B981", "icon": "Briefcase"},
    {"id": "cat_inc_2", "name": "Business", "type": "income", "color": "#3B82F6", "icon": "TrendingUp"},
    {"id": "cat_inc_3", "name": "Freelance", "type": "income", "color": "#8B5CF6", "icon": "Laptop"},
    {"id": "cat_inc_4", "name": "Investment", "type": "income", "color": "#F59E0B", "icon": "PieChart"},
    {"id": "cat_inc_5", "name": "Allowance", "type": "income", "color": "#06B6D4", "icon": "Wallet"},
    {"id": "cat_inc_6", "name": "Gift", "type": "income", "color": "#EC4899", "icon": "Gift"},
    {"id": "cat_inc_7", "name": "Other Income", "type": "income", "color": "#64748B", "icon": "PlusCircle"},
    # Savings Categories
    {"id": "cat_sav_1", "name": "Emergency Fund", "type": "savings", "color": "#10B981", "icon": "ShieldCheck"},
    {"id": "cat_sav_2", "name": "Investment", "type": "savings", "color": "#6366F1", "icon": "PiggyBank"},
    {"id": "cat_sav_3", "name": "General Savings", "type": "savings", "color": "#0EA5E9", "icon": "Vault"},
]

_has_cat_table = None
_in_memory_user_categories = {}

def has_categories_table() -> bool:
    global _has_cat_table
    if _has_cat_table is not None:
        return _has_cat_table
    try:
        insp = inspect(engine)
        if engine.dialect.name == "postgresql":
            _has_cat_table = insp.has_table("categories", schema="public")
        else:
            _has_cat_table = insp.has_table("categories")
    except Exception:
        _has_cat_table = False
    return bool(_has_cat_table)

def get_categories_repo(db: Session, user_id: str) -> List[schemas.CategoryResponse]:
    categories: List[schemas.CategoryResponse] = []
    
    if has_categories_table():
        try:
            records = db.query(CategoryDB).filter(CategoryDB.user_id == user_id).all()
            for r in records:
                categories.append(schemas.CategoryResponse(
                    id=str(r.id),
                    name=r.name,
                    type=r.type,
                    color=r.color or "#E5484D",
                    icon=r.icon or "tag"
                ))
        except Exception:
            pass

    user_custom = _in_memory_user_categories.get(user_id, [])
    seen_names = {c.name.lower() for c in categories}
    for custom in user_custom:
        if custom["name"].lower() not in seen_names:
            categories.append(schemas.CategoryResponse(
                id=custom["id"],
                name=custom["name"],
                type=custom["type"],
                color=custom.get("color", "#E5484D"),
                icon=custom.get("icon", "tag")
            ))
            seen_names.add(custom["name"].lower())

    for d in DEFAULT_CATEGORIES:
        if d["name"].lower() not in seen_names:
            categories.append(schemas.CategoryResponse(
                id=d["id"],
                name=d["name"],
                type=d["type"],
                color=d["color"],
                icon=d["icon"]
            ))
            seen_names.add(d["name"].lower())

    return categories

def create_category_repo(
    db: Session,
    user_id: str,
    name: str,
    cat_type: str = "expense",
    color: str = "#E5484D",
    icon: str = "tag"
) -> schemas.CategoryResponse:
    clean_name = name.strip()
    cat_id = str(uuid.uuid4())
    
    if has_categories_table():
        try:
            new_cat = CategoryDB(
                id=cat_id,
                user_id=user_id,
                name=clean_name,
                type=cat_type,
                color=color,
                icon=icon
            )
            db.add(new_cat)
            db.commit()
            db.refresh(new_cat)
            return schemas.CategoryResponse(
                id=str(new_cat.id),
                name=new_cat.name,
                type=new_cat.type,
                color=new_cat.color or "#E5484D",
                icon=new_cat.icon or "tag"
            )
        except Exception:
            db.rollback()

    if user_id not in _in_memory_user_categories:
        _in_memory_user_categories[user_id] = []
    item = {
        "id": cat_id,
        "name": clean_name,
        "type": cat_type,
        "color": color,
        "icon": icon
    }
    _in_memory_user_categories[user_id].append(item)
    return schemas.CategoryResponse(
        id=cat_id,
        name=clean_name,
        type=cat_type,
        color=color,
        icon=icon
    )

def delete_category_repo(db: Session, user_id: str, category_id_or_name: str) -> bool:
    clean_id = category_id_or_name.strip().lower()
    
    if has_categories_table():
        try:
            record = db.query(CategoryDB).filter(
                CategoryDB.user_id == user_id,
                (CategoryDB.id == category_id_or_name) | (func.lower(CategoryDB.name) == clean_id)
            ).first()
            if record:
                db.delete(record)
                db.commit()
                return True
        except Exception:
            db.rollback()

    if user_id in _in_memory_user_categories:
        orig_len = len(_in_memory_user_categories[user_id])
        _in_memory_user_categories[user_id] = [
            c for c in _in_memory_user_categories[user_id]
            if c["id"] != category_id_or_name and c["name"].lower() != clean_id
        ]
        if len(_in_memory_user_categories[user_id]) < orig_len:
            return True

    return True

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

    # If total_budget is set, remaining is relative to total_budget.
    # Otherwise, remaining reflects remaining from monthly income.
    if total_budget > 0:
        remaining = float(total_budget - total_spent)
    else:
        remaining = float(Decimal(str(round(monthly_income, 2))) - total_spent)

    wallets_data = get_user_wallets_repo(db, user_id)

    return schemas.DashboardSummary(
        monthly_income=monthly_income,
        total_budget=float(total_budget),
        total_spent=float(total_spent),
        remaining=remaining,
        total_balance=wallets_data["total"],
        cash_balance=wallets_data["cash"],
        online_balance=wallets_data["online"],
        categories=category_summaries
    )

def generate_insights_repo(
    db: Session,
    user_id: str = DEFAULT_DEMO_USER_ID
) -> List[schemas.AIInsight]:
    summary = calculate_dashboard_summary_repo(db, user_id)
    insights: List[schemas.AIInsight] = []
    ins_counter = 1

    # Clean state check for new users
    if summary.total_budget == 0 and summary.total_spent == 0:
        insights.append(schemas.AIInsight(
            id=f"ins_{ins_counter}",
            type="suggestion",
            message="Welcome to AIFinance! You have no recorded expenses or budgets yet.",
            action="Start by adding your first expense or setting category budget limits to unlock automated AI insights."
        ))
        ins_counter += 1
        if summary.monthly_income == 0:
            insights.append(schemas.AIInsight(
                id=f"ins_{ins_counter}",
                type="suggestion",
                message="Monthly income has not been set yet.",
                action="Configure your expected earnings to accurately measure your savings rate and financial health."
            ))
        return insights

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
                message=f"{cat.name} budget exceeded: Spent ৳{cat.spent:,.2f} of allocated ৳{cat.allocated:,.2f}.",
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
            action=f"Consider allocating remaining balance (৳{summary.remaining:,.2f}) into high-yield savings or emergency fund."
        ))

    return insights