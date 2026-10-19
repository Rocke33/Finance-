import os
from PIL import Image, ImageDraw, ImageFont

FONT_PATH_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_PATH_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_PATH_SEMI = "C:/Windows/Fonts/seguisb.ttf"

def get_font(size, bold=False):
    try:
        path = FONT_PATH_BOLD if bold else FONT_PATH_REG
        if not os.path.exists(path):
            path = "C:/Windows/Fonts/arial.ttf"
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_rounded_card(draw, box, fill_color, border_color, radius=16, border_width=2):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill_color, outline=border_color, width=border_width)

def draw_arrow(draw, start, end, color="#64748B", width=3, arrow_size=10):
    x0, y0 = start
    x1, y1 = end
    draw.line([x0, y0, x1, y1], fill=color, width=width)
    
    # Calculate arrowhead
    import math
    angle = math.atan2(y1 - y0, x1 - x0)
    angle1 = angle + math.pi * 0.85
    angle2 = angle - math.pi * 0.85
    
    p1 = (x1 + arrow_size * math.cos(angle1), y1 + arrow_size * math.sin(angle1))
    p2 = (x1 + arrow_size * math.cos(angle2), y1 + arrow_size * math.sin(angle2))
    
    draw.polygon([ (x1, y1), p1, p2 ], fill=color)

def generate_system_architecture_diagram(output_path):
    width, height = 1600, 1000
    img = Image.new("RGBA", (width, height), "#F8FAFC")
    draw = ImageDraw.Draw(img)

    # Title & Subtitle
    title_font = get_font(36, bold=True)
    sub_font = get_font(20, bold=False)
    section_font = get_font(22, bold=True)
    item_bold = get_font(18, bold=True)
    item_font = get_font(16, bold=False)
    badge_font = get_font(14, bold=True)

    draw.text((60, 40), "AIFinance: End-to-End System Architecture", fill="#0F172A", font=title_font)
    draw.text((60, 85), "Full-stack personal finance assistant with multimodal AI vision and dual-wallet tracking", fill="#64748B", font=sub_font)

    # 1. CLIENT / FRONTEND CONTAINER
    # x: 60 to 520, y: 150 to 880
    draw_rounded_card(draw, (60, 150, 520, 920), "#FFFFFF", "#CBD5E1", radius=20, border_width=2)
    # Header bar
    draw.rounded_rectangle([60, 150, 520, 220], radius=20, fill="#0F382C")
    draw.rectangle([60, 190, 520, 220], fill="#0F382C")
    draw.text((85, 172), "Client Layer (Frontend SPA)", fill="#FFFFFF", font=section_font)

    fe_items = [
        ("Framework & Build", "React 19.3 + TypeScript + Vite 8.3"),
        ("Styling & UI", "Tailwind CSS v4 + Custom Modern Tokens"),
        ("Icons & Media", "Lucide React 1.57 + Custom SVG Graphics"),
        ("State & Storage", "React State, Custom Hooks, localStorage"),
        ("Key Views & Pages", ""),
        ("  - HeroBalanceCard", "Dynamic net balance & income pacing"),
        ("  - WalletsCarousel", "Cash vs Online balance & transfers"),
        ("  - AIFinanceAISection", "Quick actions for Chat, Scan, Budgets"),
        ("  - DailySpendTrendChart", "Custom SVG spline curve (7/30 days)"),
        ("  - FinancialHealthCard", "Savings rate & budget control circular gauge"),
        ("  - MonthlyForecast", "Daily burn rate projection vs. monthly limit"),
        ("  - MonthlyPieChart", "Donut geometry spending distribution"),
        ("  - TransactionsPage", "Multi-filter search, category & date scoping"),
        ("  - ChatWidget", "Floating draggable assistant with context"),
        ("  - ReceiptUploadModal", "Camera/upload preview & live OCR review"),
        ("Offline Fallback Mode", "In-memory demo mock data resilience"),
    ]

    y_cur = 240
    for label, val in fe_items:
        if val == "":
            draw.text((85, y_cur), label, fill="#0F172A", font=item_bold)
            y_cur += 28
        else:
            draw.text((85, y_cur), label + ":", fill="#0F382C", font=item_bold)
            draw.text((85, y_cur + 20), val, fill="#475569", font=item_font)
            y_cur += 42

    # 2. BACKEND API CONTAINER
    # x: 600 to 1060, y: 150 to 920
    draw_rounded_card(draw, (600, 150, 1060, 920), "#FFFFFF", "#CBD5E1", radius=20, border_width=2)
    draw.rounded_rectangle([600, 150, 1060, 220], radius=20, fill="#1E293B")
    draw.rectangle([600, 190, 1060, 220], fill="#1E293B")
    draw.text((625, 172), "Application Layer (FastAPI Backend)", fill="#FFFFFF", font=section_font)

    be_items = [
        ("Runtime & Engine", "Python 3.11.8 + Uvicorn ASGI Server"),
        ("Web Framework", "FastAPI 0.143 + Starlette 1.8"),
        ("Data Validation", "Pydantic v2.14 Models & Custom Validators"),
        ("Auth & Security", "PyJWT Bearer Tokens + Passlib Bcrypt"),
        ("File Handling", "Python-Multipart (5MB limit, MIME checks)"),
        ("Active API Routes", ""),
        ("  - POST /api/auth/register", "User account creation & password hashing"),
        ("  - POST /api/auth/login", "JWT bearer token issuance"),
        ("  - GET /api/dashboard", "Income, spend, budget pacing aggregation"),
        ("  - GET/POST /api/transactions", "Atomic wallet deduction & history"),
        ("  - DELETE /api/transactions", "Transaction deletion & wallet refund"),
        ("  - GET/PUT /api/wallets", "Cash & Online balance management"),
        ("  - POST /api/wallets/transfer", "Atomic inter-wallet fund transfers"),
        ("  - GET/POST /api/categories", "Custom category registry"),
        ("  - GET /api/insights", "Rule-based financial alerts & suggestions"),
        ("  - POST /api/upload-receipt", "Multipart Gemini OCR vision extraction"),
        ("  - POST /api/chat", "Context-injected FinAI advisor chatbot"),
    ]

    y_cur = 240
    for label, val in be_items:
        if val == "":
            draw.text((625, y_cur), label, fill="#0F172A", font=item_bold)
            y_cur += 28
        else:
            draw.text((625, y_cur), label + ":", fill="#1E293B", font=item_bold)
            draw.text((625, y_cur + 20), val, fill="#475569", font=item_font)
            y_cur += 40

    # 3. DATABASE & CLOUD LAYER (Top Right)
    # x: 1140 to 1540, y: 150 to 510
    draw_rounded_card(draw, (1140, 150, 1540, 510), "#FFFFFF", "#CBD5E1", radius=20, border_width=2)
    draw.rounded_rectangle([1140, 150, 1540, 220], radius=20, fill="#0284C7")
    draw.rectangle([1140, 190, 1540, 220], fill="#0284C7")
    draw.text((1165, 172), "Database & Storage Layer", fill="#FFFFFF", font=section_font)

    db_items = [
        ("Primary Cloud DB", "Supabase PostgreSQL (Session Pooler)"),
        ("Local Fallback DB", "SQLite 3 (zero-config finance.db)"),
        ("ORM & Driver", "SQLAlchemy 2.1 + psycopg3 / sqlite3"),
        ("Monetary Precision", "Numeric(12, 2) currency safe columns"),
        ("Access Security", "PostgreSQL Row-Level Security (RLS)"),
        ("Core Schemas", "users, budgets, transactions, wallets,"),
        ("", "categories, wallet_migration.sql"),
        ("Resilient Fallback", "Safe in-memory fallback if tables pending"),
    ]
    y_cur = 240
    for label, val in db_items:
        if label:
            draw.text((1165, y_cur), label + ":", fill="#0369A1", font=item_bold)
            draw.text((1165, y_cur + 18), val, fill="#475569", font=item_font)
            y_cur += 36
        else:
            draw.text((1165, y_cur), val, fill="#475569", font=item_font)
            y_cur += 24

    # 4. AI INTEGRATION LAYER (Bottom Right)
    # x: 1140 to 1540, y: 540 to 920
    draw_rounded_card(draw, (1140, 540, 1540, 920), "#FFFFFF", "#CBD5E1", radius=20, border_width=2)
    draw.rounded_rectangle([1140, 540, 1540, 610], radius=20, fill="#7C3AED")
    draw.rectangle([1140, 580, 1540, 610], fill="#7C3AED")
    draw.text((1165, 562), "AI Services (Google GenAI)", fill="#FFFFFF", font=section_font)

    ai_items = [
        ("SDK & Protocol", "Official google-genai 2.31.0 Client"),
        ("Primary Vision Model", "gemini-3.8-flash (Receipt OCR)"),
        ("Conversational Model", "gemini-3.8-flash / 3.5-flash-lite"),
        ("Vision Pipeline", "Pillow verification + Structured JSON"),
        ("Context Injection", "Live balances, income, & category limits"),
        ("Currency Tuning", "Bangladeshi Taka (BDT / ৳) prompt design"),
        ("Reliability Mode", "Lazy initialization + Testable OCR fallback"),
    ]
    y_cur = 630
    for label, val in ai_items:
        draw.text((1165, y_cur), label + ":", fill="#6D28D9", font=item_bold)
        draw.text((1165, y_cur + 18), val, fill="#475569", font=item_font)
        y_cur += 38

    # INTER-LAYER ARROWS
    # Frontend -> Backend
    draw_arrow(draw, (520, 360), (600, 360), color="#0F382C", width=4, arrow_size=12)
    draw.text((530, 335), "REST / JSON", fill="#0F382C", font=badge_font)
    draw.text((530, 370), "JWT Bearer", fill="#64748B", font=badge_font)

    # Backend -> Frontend
    draw_arrow(draw, (600, 480), (520, 480), color="#1E293B", width=4, arrow_size=12)
    draw.text((530, 455), "HTTP 200/201", fill="#1E293B", font=badge_font)
    draw.text((530, 490), "Validated JSON", fill="#64748B", font=badge_font)

    # Backend -> Database
    draw_arrow(draw, (1060, 330), (1140, 330), color="#0284C7", width=4, arrow_size=12)
    draw.text((1068, 305), "SQLAlchemy", fill="#0284C7", font=badge_font)
    draw.text((1068, 340), "Pooler:5432", fill="#64748B", font=badge_font)

    # Backend -> AI Service
    draw_arrow(draw, (1060, 730), (1140, 730), color="#7C3AED", width=4, arrow_size=12)
    draw.text((1068, 705), "GenAI Client", fill="#7C3AED", font=badge_font)
    draw.text((1068, 740), "Prompt+Image", fill="#64748B", font=badge_font)

    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Generated: {output_path}")

def generate_wallet_workflow_diagram(output_path):
    width, height = 1500, 800
    img = Image.new("RGBA", (width, height), "#F8FAFC")
    draw = ImageDraw.Draw(img)

    title_font = get_font(32, bold=True)
    sub_font = get_font(18, bold=False)
    box_font_b = get_font(18, bold=True)
    box_font_r = get_font(14, bold=False)
    badge_font = get_font(14, bold=True)

    draw.text((60, 35), "Fixed Two-Wallet Accounting Architecture", fill="#0F172A", font=title_font)
    draw.text((60, 75), "Atomic balance deduction, solvency verification, and automatic refund workflows", fill="#64748B", font=sub_font)

    # Step 1: User Action Card (Add Expense)
    draw_rounded_card(draw, (60, 150, 340, 360), "#FFFFFF", "#CBD5E1", radius=16)
    draw.rounded_rectangle([60, 150, 340, 200], radius=16, fill="#0F382C")
    draw.rectangle([60, 180, 340, 200], fill="#0F382C")
    draw.text((80, 165), "1. Record Expense", fill="#FFFFFF", font=box_font_b)
    draw.text((80, 220), "User submits expense form:", fill="#0F172A", font=box_font_b)
    draw.text((80, 245), "- Merchant: Sultan's Dine", fill="#475569", font=box_font_r)
    draw.text((80, 265), "- Amount: ৳ 1,450.00", fill="#475569", font=box_font_r)
    draw.text((80, 285), "- Category: Food", fill="#475569", font=box_font_r)
    draw.text((80, 305), "- Payment Source: 'cash' | 'online'", fill="#059669", font=box_font_b)
    draw.text((80, 325), "- Date: 2026-10-19", fill="#475569", font=box_font_r)

    # Step 2: Solvency Validation (Diamond / Box)
    draw_rounded_card(draw, (430, 150, 720, 360), "#EFF6FF", "#3B82F6", radius=16)
    draw.rounded_rectangle([430, 150, 720, 200], radius=16, fill="#1E40AF")
    draw.rectangle([430, 180, 720, 200], fill="#1E40AF")
    draw.text((450, 165), "2. Solvency Verification", fill="#FFFFFF", font=box_font_b)
    draw.text((450, 220), "Balance Check Invariant:", fill="#1E40AF", font=box_font_b)
    draw.text((450, 250), "Does Target Wallet Have", fill="#0F172A", font=box_font_b)
    draw.text((450, 275), "Balance >= Amount?", fill="#0F172A", font=box_font_b)
    draw.text((450, 305), "IF NO: 400 Bad Request error", fill="#DC2626", font=box_font_r)
    draw.text((450, 325), "IF YES: Proceed with atomic commit", fill="#059669", font=box_font_r)

    # Arrow 1 -> 2
    draw_arrow(draw, (340, 255), (430, 255), color="#0F382C", width=3)

    # Step 3A: Error Rejection (Bottom of Step 2)
    draw_rounded_card(draw, (430, 440, 720, 620), "#FEF2F2", "#EF4444", radius=16)
    draw.rounded_rectangle([430, 440, 720, 490], radius=16, fill="#DC2626")
    draw.rectangle([430, 470, 720, 490], fill="#DC2626")
    draw.text((450, 455), "Transaction Blocked", fill="#FFFFFF", font=box_font_b)
    draw.text((450, 510), "HTTP 400 Bad Request:", fill="#DC2626", font=box_font_b)
    draw.text((450, 535), "\"Insufficient funds in Cash wallet.", fill="#475569", font=box_font_r)
    draw.text((450, 555), "Available: ৳500, required: ৳1,450.\"", fill="#475569", font=box_font_r)
    draw.text((450, 580), "State remains 100% unchanged.", fill="#0F172A", font=box_font_r)

    # Arrow 2 -> 3A (Down)
    draw_arrow(draw, (575, 360), (575, 440), color="#DC2626", width=3)
    draw.text((585, 395), "Insufficient", fill="#DC2626", font=badge_font)

    # Step 3B: Atomic Deduction & Record (Right of Step 2)
    draw_rounded_card(draw, (810, 150, 1110, 360), "#F0FDF4", "#22C55E", radius=16)
    draw.rounded_rectangle([810, 150, 1110, 200], radius=16, fill="#15803D")
    draw.rectangle([810, 180, 1110, 200], fill="#15803D")
    draw.text((830, 165), "3. Atomic Deduction", fill="#FFFFFF", font=box_font_b)
    draw.text((830, 220), "Deduct & Save Transaction:", fill="#15803D", font=box_font_b)
    draw.text((830, 250), "1. Deduct amount from target wallet", fill="#475569", font=box_font_r)
    draw.text((830, 275), "2. Insert Transaction record with FK", fill="#475569", font=box_font_r)
    draw.text((830, 300), "3. Commit DB transaction (ACID)", fill="#059669", font=box_font_b)
    draw.text((830, 325), "Rollback if any step fails", fill="#DC2626", font=box_font_r)

    # Arrow 2 -> 3B (Right)
    draw_arrow(draw, (720, 255), (810, 255), color="#15803D", width=3)
    draw.text((735, 230), "Sufficient", fill="#15803D", font=badge_font)

    # Step 4: UI Sync & Updates (Right of Step 3B)
    draw_rounded_card(draw, (1200, 150, 1460, 360), "#FFFFFF", "#CBD5E1", radius=16)
    draw.rounded_rectangle([1200, 150, 1460, 200], radius=16, fill="#0F382C")
    draw.rectangle([1200, 180, 1460, 200], fill="#0F382C")
    draw.text((1220, 165), "4. UI Live Update", fill="#FFFFFF", font=box_font_b)
    draw.text((1220, 220), "Aggregated Re-render:", fill="#0F172A", font=box_font_b)
    draw.text((1220, 245), "- HeroBalanceCard updated", fill="#475569", font=box_font_r)
    draw.text((1220, 265), "- WalletsCarousel updated", fill="#475569", font=box_font_r)
    draw.text((1220, 285), "- Budget Pacing updated", fill="#475569", font=box_font_r)
    draw.text((1220, 305), "- Spend Trend & Pie synced", fill="#475569", font=box_font_r)
    draw.text((1220, 325), "- AI insights recalculated", fill="#7C3AED", font=box_font_b)

    # Arrow 3B -> 4
    draw_arrow(draw, (1110, 255), (1200, 255), color="#0F382C", width=3)

    # Step 5: Refund on Deletion (Bottom of Step 3B)
    draw_rounded_card(draw, (810, 440, 1110, 650), "#FAF5FF", "#A855F7", radius=16)
    draw.rounded_rectangle([810, 440, 1110, 490], radius=16, fill="#7E22CE")
    draw.rectangle([810, 470, 1110, 490], fill="#7E22CE")
    draw.text((830, 455), "Deletion & Refund Flow", fill="#FFFFFF", font=box_font_b)
    draw.text((830, 510), "When User Deletes Expense:", fill="#7E22CE", font=box_font_b)
    draw.text((830, 535), "1. Retrieve tx payment_source", fill="#475569", font=box_font_r)
    draw.text((830, 555), "2. Delete TransactionDB row", fill="#475569", font=box_font_r)
    draw.text((830, 575), "3. Refund amount back to wallet", fill="#059669", font=box_font_b)
    draw.text((830, 595), "4. Full balance integrity preserved", fill="#0F172A", font=box_font_b)
    draw.text((830, 615), "Zero phantom losses / discrepancies", fill="#64748B", font=box_font_r)

    # Arrow 3B -> 5 (Down)
    draw_arrow(draw, (960, 360), (960, 440), color="#7E22CE", width=3)
    draw.text((970, 395), "On Delete", fill="#7E22CE", font=badge_font)

    # Step 6: Inter-wallet transfer box
    draw_rounded_card(draw, (60, 440, 340, 650), "#F0FDFA", "#14B8A6", radius=16)
    draw.rounded_rectangle([60, 440, 340, 490], radius=16, fill="#0F766E")
    draw.rectangle([60, 470, 340, 490], fill="#0F766E")
    draw.text((80, 455), "Inter-Wallet Transfers", fill="#FFFFFF", font=box_font_b)
    draw.text((80, 510), "POST /api/wallets/transfer", fill="#0F766E", font=box_font_b)
    draw.text((80, 535), "- Source: 'cash' | 'online'", fill="#475569", font=box_font_r)
    draw.text((80, 555), "- Destination: opposite wallet", fill="#475569", font=box_font_r)
    draw.text((80, 575), "- Invariant: Total Balance const.", fill="#0F172A", font=box_font_b)
    draw.text((80, 595), "Example: ATM withdrawal or", fill="#64748B", font=box_font_r)
    draw.text((80, 615), "cash deposit into bKash/bank", fill="#64748B", font=box_font_r)

    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Generated: {output_path}")

def generate_ai_pipeline_diagram(output_path):
    width, height = 1500, 850
    img = Image.new("RGBA", (width, height), "#F8FAFC")
    draw = ImageDraw.Draw(img)

    title_font = get_font(32, bold=True)
    sub_font = get_font(18, bold=False)
    box_font_b = get_font(18, bold=True)
    box_font_r = get_font(14, bold=False)
    badge_font = get_font(14, bold=True)

    draw.text((60, 35), "AIFinance Multimodal AI Processing Pipelines", fill="#0F172A", font=title_font)
    draw.text((60, 75), "Gemini Vision 3.8 Flash OCR receipt extractor and context-aware conversational advisor", fill="#64748B", font=sub_font)

    # SECTION A: RECEIPT VISION PIPELINE (Top)
    draw.text((60, 125), "A. Multimodal Receipt OCR Pipeline (/api/upload-receipt)", fill="#0F172A", font=box_font_b)

    # Box A1: Client Upload
    draw_rounded_card(draw, (60, 160, 320, 370), "#FFFFFF", "#CBD5E1", radius=16)
    draw.rounded_rectangle([60, 160, 320, 205], radius=16, fill="#0F382C")
    draw.rectangle([60, 185, 320, 205], fill="#0F382C")
    draw.text((80, 175), "1. Image Upload", fill="#FFFFFF", font=box_font_b)
    draw.text((80, 225), "Client actions:", fill="#0F172A", font=box_font_b)
    draw.text((80, 250), "- Select JPEG/PNG/WebP", fill="#475569", font=box_font_r)
    draw.text((80, 275), "- Drag-and-drop or camera", fill="#475569", font=box_font_r)
    draw.text((80, 300), "- Client preview generated", fill="#475569", font=box_font_r)
    draw.text((80, 325), "- Multipart POST to /api", fill="#059669", font=box_font_b)

    # Box A2: Backend Validation & Prep
    draw_rounded_card(draw, (400, 160, 680, 370), "#EFF6FF", "#3B82F6", radius=16)
    draw.rounded_rectangle([400, 160, 680, 205], radius=16, fill="#1D4ED8")
    draw.rectangle([400, 185, 680, 205], fill="#1D4ED8")
    draw.text((420, 175), "2. Validation & Temp Store", fill="#FFFFFF", font=box_font_b)
    draw.text((420, 225), "Security checks:", fill="#1D4ED8", font=box_font_b)
    draw.text((420, 250), "- MIME verification (JPEG/PNG/WebP)", fill="#475569", font=box_font_r)
    draw.text((420, 275), "- File size <= 5MB limit", fill="#475569", font=box_font_r)
    draw.text((420, 300), "- Unique UUID temp file path", fill="#475569", font=box_font_r)
    draw.text((420, 325), "- PIL.Image.verify() image check", fill="#0F172A", font=box_font_b)

    draw_arrow(draw, (320, 265), (400, 265), color="#0F382C", width=3)

    # Box A3: Gemini Vision OCR
    draw_rounded_card(draw, (760, 160, 1070, 370), "#FAF5FF", "#A855F7", radius=16)
    draw.rounded_rectangle([760, 160, 1070, 205], radius=16, fill="#7E22CE")
    draw.rectangle([760, 185, 1070, 205], fill="#7E22CE")
    draw.text((780, 175), "3. Gemini 3.8 Flash Vision", fill="#FFFFFF", font=box_font_b)
    draw.text((780, 225), "Model Inference:", fill="#7E22CE", font=box_font_b)
    draw.text((780, 250), "- Prompt: Structured JSON schema", fill="#475569", font=box_font_r)
    draw.text((780, 275), "- Extracts: Merchant, Amount, Date", fill="#475569", font=box_font_r)
    draw.text((780, 300), "- Suggests: Matching category", fill="#475569", font=box_font_r)
    draw.text((780, 325), "- Fallback: Sultan's Dine demo if no key", fill="#64748B", font=box_font_r)

    draw_arrow(draw, (680, 265), (760, 265), color="#1D4ED8", width=3)

    # Box A4: Human-in-the-Loop Review & Save
    draw_rounded_card(draw, (1150, 160, 1440, 370), "#F0FDF4", "#22C55E", radius=16)
    draw.rounded_rectangle([1150, 160, 1440, 205], radius=16, fill="#15803D")
    draw.rectangle([1150, 185, 1440, 205], fill="#15803D")
    draw.text((1170, 175), "4. Human Review & Save", fill="#FFFFFF", font=box_font_b)
    draw.text((1170, 225), "User Confirmation:", fill="#15803D", font=box_font_b)
    draw.text((1170, 250), "- Review extracted fields in modal", fill="#475569", font=box_font_r)
    draw.text((1170, 275), "- Choose Cash or Online wallet", fill="#059669", font=box_font_b)
    draw.text((1170, 300), "- Edit mistakes before committing", fill="#475569", font=box_font_r)
    draw.text((1170, 325), "- Atomic commit to TransactionDB", fill="#0F172A", font=box_font_b)

    draw_arrow(draw, (1070, 265), (1150, 265), color="#7E22CE", width=3)

    # SECTION B: CONVERSATIONAL ADVISOR PIPELINE (Bottom)
    draw.text((60, 420), "B. Context-Aware Financial Advisor Pipeline (/api/chat)", fill="#0F172A", font=box_font_b)

    # Box B1: User Question
    draw_rounded_card(draw, (60, 455, 320, 770), "#FFFFFF", "#CBD5E1", radius=16)
    draw.rounded_rectangle([60, 455, 320, 500], radius=16, fill="#0F382C")
    draw.rectangle([60, 480, 320, 500], fill="#0F382C")
    draw.text((80, 470), "1. Chat Input", fill="#FFFFFF", font=box_font_b)
    draw.text((80, 520), "Draggable Floating Widget:", fill="#0F172A", font=box_font_b)
    draw.text((80, 545), "- User types finance query or", fill="#475569", font=box_font_r)
    draw.text((80, 565), "  picks quick suggestion pill", fill="#475569", font=box_font_r)
    draw.text((80, 590), "Suggested Prompts:", fill="#0F382C", font=box_font_b)
    draw.text((80, 615), "- How to reduce expenses?", fill="#64748B", font=box_font_r)
    draw.text((80, 635), "- Am I within budget?", fill="#64748B", font=box_font_r)
    draw.text((80, 655), "- What is top spending category?", fill="#64748B", font=box_font_r)
    draw.text((80, 675), "- 3 savings tips for Bangladesh?", fill="#64748B", font=box_font_r)

    # Box B2: Context Aggregation
    draw_rounded_card(draw, (400, 455, 720, 770), "#FFFBEB", "#F59E0B", radius=16)
    draw.rounded_rectangle([400, 455, 720, 500], radius=16, fill="#D97706")
    draw.rectangle([400, 480, 720, 500], fill="#D97706")
    draw.text((420, 470), "2. Live Context Injection", fill="#FFFFFF", font=box_font_b)
    draw.text((420, 520), "Aggregated Live Metrics:", fill="#D97706", font=box_font_b)
    draw.text((420, 545), "- Total, Cash & Online Balances", fill="#0F172A", font=box_font_b)
    draw.text((420, 570), "- Monthly Income (৳)", fill="#475569", font=box_font_r)
    draw.text((420, 595), "- Total Budget & Spent (৳)", fill="#475569", font=box_font_r)
    draw.text((420, 620), "- Remaining Capacity (৳)", fill="#475569", font=box_font_r)
    draw.text((420, 645), "- Category breakdown & spent amounts", fill="#475569", font=box_font_r)
    draw.text((420, 675), "Prevents AI hallucination with", fill="#059669", font=box_font_b)
    draw.text((420, 700), "ground truth user figures.", fill="#059669", font=box_font_b)

    draw_arrow(draw, (320, 600), (400, 600), color="#0F382C", width=3)

    # Box B3: Gemini LLM Reasoner
    draw_rounded_card(draw, (800, 455, 1100, 770), "#FAF5FF", "#A855F7", radius=16)
    draw.rounded_rectangle([800, 455, 1100, 500], radius=16, fill="#7E22CE")
    draw.rectangle([800, 480, 1100, 500], fill="#7E22CE")
    draw.text((820, 470), "3. Gemini 3.8 / 3.5 Reasoning", fill="#FFFFFF", font=box_font_b)
    draw.text((820, 520), "System Instructions:", fill="#7E22CE", font=box_font_b)
    draw.text((820, 545), "- Role: AIFinance Personal Finance AI", fill="#475569", font=box_font_r)
    draw.text((820, 570), "- Currency: BDT / ৳ tailored context", fill="#475569", font=box_font_r)
    draw.text((820, 595), "- Default language: English", fill="#475569", font=box_font_r)
    draw.text((820, 620), "  (Bengali if explicitly requested)", fill="#475569", font=box_font_r)
    draw.text((820, 645), "- Formats with markdown & bullets", fill="#475569", font=box_font_r)
    draw.text((820, 675), "Model Tiers:", fill="#0F172A", font=box_font_b)
    draw.text((820, 700), "Primary: gemini-3.5-flash-lite", fill="#64748B", font=box_font_r)
    draw.text((820, 725), "Fallback: gemini-3.8-flash", fill="#64748B", font=box_font_r)

    draw_arrow(draw, (720, 600), (800, 600), color="#D97706", width=3)

    # Box B4: Rendered Advice
    draw_rounded_card(draw, (1180, 455, 1440, 770), "#F0FDF4", "#22C55E", radius=16)
    draw.rounded_rectangle([1180, 455, 1440, 500], radius=16, fill="#15803D")
    draw.rectangle([1180, 480, 1440, 500], fill="#15803D")
    draw.text((1200, 470), "4. Actionable Advice", fill="#FFFFFF", font=box_font_b)
    draw.text((1200, 520), "Delivered to User:", fill="#15803D", font=box_font_b)
    draw.text((1200, 545), "- Tailored savings tips", fill="#475569", font=box_font_r)
    draw.text((1200, 570), "- Category reallocation guidance", fill="#475569", font=box_font_r)
    draw.text((1200, 595), "- Daily spending adjustments", fill="#475569", font=box_font_r)
    draw.text((1200, 620), "- Chat bubble display with time", fill="#475569", font=box_font_r)
    draw.text((1200, 650), "Disclaimers:", fill="#DC2626", font=box_font_b)
    draw.text((1200, 675), "Informational guide; not", fill="#64748B", font=box_font_r)
    draw.text((1200, 695), "guaranteed financial advice.", fill="#64748B", font=box_font_r)

    draw_arrow(draw, (1100, 600), (1180, 600), color="#7E22CE", width=3)

    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.dirname(__file__)
    generate_system_architecture_diagram(os.path.join(out_dir, "architecture_diagram.png"))
    generate_wallet_workflow_diagram(os.path.join(out_dir, "wallet_workflow_diagram.png"))
    generate_ai_pipeline_diagram(os.path.join(out_dir, "ai_pipeline_diagram.png"))
