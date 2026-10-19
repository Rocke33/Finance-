import sys
import os
sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=== AIFinance API VERIFICATION TESTS ===")
    
    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("[PASS] 1. Health check passed:", res.json()["service"])

    # 2. Unauthorized access check
    unauth_dash = client.get("/api/dashboard")
    assert unauth_dash.status_code in [401, 403], f"Unauthenticated request should be 401/403, got {unauth_dash.status_code}"
    print("[PASS] 2. Strict authentication enforced: Unauthenticated access blocked (401)")

    # 3. Register New User A
    import uuid
    rand_email = f"user_a_{uuid.uuid4().hex[:8]}@behisabi.test"
    reg_payload = {
        "name": "Takbir A. Himu",
        "email": rand_email,
        "password": "Password123!",
        "income": 75000.00
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    user_a_data = reg_res.json()
    token_a = user_a_data["access_token"]
    user_a_id = user_a_data["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f"[PASS] 3. Registered User A: {user_a_data['user']['name']} ({rand_email})")

    # 4. Clean initial state for User A
    dash_a = client.get("/api/dashboard", headers=headers_a)
    assert dash_a.status_code == 200, f"Dashboard failed: {dash_a.text}"
    dash_json = dash_a.json()
    assert dash_json["monthly_income"] == 75000.00, f"Income mismatch: {dash_json['monthly_income']}"
    assert dash_json["total_spent"] == 0.00, f"Initial total_spent should be 0.00, got {dash_json['total_spent']}"
    print("[PASS] 4. Clean initial state verified: 0 total spent, genuine user income BDT 75,000")

    # 5. Empty transactions check for User A
    txs_a = client.get("/api/transactions", headers=headers_a)
    assert txs_a.status_code == 200
    assert len(txs_a.json()) == 0, f"New user should have 0 transactions, got {len(txs_a.json())}"
    print("[PASS] 5. Zero demo transactions: New user has an empty transaction list")

    # 6. AI Insights for new user
    ins_a = client.get("/api/insights", headers=headers_a)
    assert ins_a.status_code == 200
    insights_list = ins_a.json()["insights"]
    assert len(insights_list) > 0
    assert "Welcome" in insights_list[0]["message"] or "expenses" in insights_list[0]["message"]
    print("[PASS] 6. Helpful AI onboarding insights verified (no fabricated alert data)")

    # 7. Category Management: Create new category
    new_cat_res = client.post(
        "/api/categories",
        headers=headers_a,
        json={"name": "Petrol & Fuel", "type": "expense", "color": "#3B82F6", "icon": "Car"}
    )
    assert new_cat_res.status_code in [200, 201], f"Create category failed: {new_cat_res.text}"
    created_cat = new_cat_res.json()
    print(f"[PASS] 7. Category creation verified: Created '{created_cat['name']}' with color {created_cat['color']}")

    # 8. Category Management: List categories
    cats_res = client.get("/api/categories", headers=headers_a)
    assert cats_res.status_code == 200
    cats_names = [c["name"] for c in cats_res.json()]
    assert "Petrol & Fuel" in cats_names
    print(f"[PASS] 8. Category listing verified: {len(cats_names)} categories found")

    # 9. Create Transaction for User A
    tx_create_res = client.post(
        "/api/transactions",
        headers=headers_a,
        json={
            "merchant": "Padma Oil Station",
            "category": "Petrol & Fuel",
            "amount": 2500.00,
            "date": "2026-10-19"
        }
    )
    assert tx_create_res.status_code in [200, 201], f"Create tx failed: {tx_create_res.text}"
    created_tx = tx_create_res.json()
    print(f"[PASS] 9. Transaction created: BDT {created_tx['amount']} at {created_tx['merchant']}")

    # 10. Dashboard reflects genuine transaction
    dash_updated = client.get("/api/dashboard", headers=headers_a)
    assert dash_updated.status_code == 200
    assert dash_updated.json()["total_spent"] == 2500.00
    assert dash_updated.json()["remaining"] == 72500.00
    print("[PASS] 10. Dashboard summary dynamically updated: Total spent BDT 2,500, remaining BDT 72,500")

    # 11. User Data Isolation: Register User B and verify complete isolation
    rand_email_b = f"user_b_{uuid.uuid4().hex[:8]}@behisabi.test"
    reg_b = client.post("/api/auth/register", json={
        "name": "Nadia Mou",
        "email": rand_email_b,
        "password": "Password123!",
        "income": 90000.00
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B checks transactions
    txs_b = client.get("/api/transactions", headers=headers_b)
    assert len(txs_b.json()) == 0, "User B should NOT see User A's transactions!"
    
    # User B tries to delete User A's transaction
    del_unauthorized = client.delete(f"/api/transactions/{created_tx['id']}", headers=headers_b)
    assert del_unauthorized.status_code in [404, 403], f"User B should not be able to delete User A's tx: got {del_unauthorized.status_code}"
    print("[PASS] 11. Strict user data isolation verified: User B cannot view or delete User A's records")

    # 12. Delete Transaction as User A
    del_res = client.delete(f"/api/transactions/{created_tx['id']}", headers=headers_a)
    assert del_res.status_code == 200, f"Delete tx failed: {del_res.text}"
    remaining_txs = client.get("/api/transactions", headers=headers_a).json()
    assert len(remaining_txs) == 0
    print("[PASS] 12. Transaction deletion verified: successfully deleted and scoped to user")

    # 13. Delete Category as User A
    del_cat_res = client.delete(f"/api/categories/{created_cat['id']}", headers=headers_a)
    assert del_cat_res.status_code == 200
    print("[PASS] 13. Category deletion verified: successfully deleted")

    print("\nALL 13 API & DATA ISOLATION TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    run_tests()
