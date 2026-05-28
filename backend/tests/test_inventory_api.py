"""Backend API tests for Inventory Command Center."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://stock-control-383.preview.emergentagent.com").rstrip("/")
SAMPLE_FILE = "/tmp/sample.xlsx"

# Shared state across tests
_state = {}


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    return s


# --- Health ---
def test_root(api_client):
    r = api_client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# --- Upload happy path ---
def test_upload_sample_xlsx(api_client):
    assert os.path.exists(SAMPLE_FILE), "Sample file missing"
    with open(SAMPLE_FILE, "rb") as f:
        files = {"file": ("Sample_Input.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        r = api_client.post(f"{BASE_URL}/api/upload", files=files, timeout=120)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "job_id" in data
    assert data["row_count"] > 500, f"expected ~607 rows, got {data['row_count']}"
    # KPIs
    k = data["kpis"]
    for key in ["high_risk_skus", "total_replenishment_qty", "warehouses_at_risk", "healthy_inventory_pct", "pending_orders"]:
        assert key in k
    assert k["high_risk_skus"] > 0, "Expected some HIGH risk SKUs in sample data"
    # Charts
    c = data["charts"]
    for key in ["city_inventory", "risk_distribution", "top_risky_skus", "qty_by_city", "lead_vs_inv"]:
        assert key in c and isinstance(c[key], list)
    # Recommendations
    assert isinstance(data["recommendations"], list) and len(data["recommendations"]) == data["row_count"]
    sample_rec = data["recommendations"][0]
    for key in ["warehouse_id", "item_id", "total_inventory", "quantity_to_send", "days_of_inventory_left", "stockout_risk", "alert", "city", "lead_time_days"]:
        assert key in sample_rec
    # Replenishment logic
    for rec in data["recommendations"]:
        if rec["max_inventory"] == 0:
            assert rec["quantity_to_send"] == 0
        if rec["total_inventory"] >= rec["min_inventory"]:
            assert rec["quantity_to_send"] == 0
    _state["job_id"] = data["job_id"]
    _state["sample_rec"] = sample_rec


def test_upload_rejects_non_xlsx(api_client):
    files = {"file": ("bad.txt", b"hello world", "text/plain")}
    r = api_client.post(f"{BASE_URL}/api/upload", files=files)
    assert r.status_code == 400


def test_upload_rejects_malformed_xlsx(api_client):
    files = {"file": ("bad.xlsx", b"not really an excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    r = api_client.post(f"{BASE_URL}/api/upload", files=files)
    assert r.status_code == 400


# --- Jobs ---
def test_get_job(api_client):
    job_id = _state.get("job_id")
    if not job_id:
        pytest.skip("No job_id from upload")
    r = api_client.get(f"{BASE_URL}/api/jobs/{job_id}")
    assert r.status_code == 200
    d = r.json()
    assert d["job_id"] == job_id
    assert "recommendations" in d


def test_get_job_404(api_client):
    r = api_client.get(f"{BASE_URL}/api/jobs/does-not-exist-xyz")
    assert r.status_code == 404


def test_list_jobs(api_client):
    r = api_client.get(f"{BASE_URL}/api/jobs")
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list)
    # Recommendations should be stripped
    if arr:
        assert "recommendations" not in arr[0]


# --- Reasoning ---
def test_reasoning(api_client):
    job_id = _state.get("job_id")
    rec = _state.get("sample_rec")
    if not job_id or not rec:
        pytest.skip("no job/record")
    payload = {"job_id": job_id, "record": rec}
    r = api_client.post(f"{BASE_URL}/api/reasoning", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    text = r.json().get("reasoning", "")
    assert isinstance(text, str) and len(text) > 20


# --- Download ---
def test_download_xlsx(api_client):
    job_id = _state.get("job_id")
    if not job_id:
        pytest.skip("no job")
    r = api_client.get(f"{BASE_URL}/api/download/{job_id}")
    assert r.status_code == 200
    assert "spreadsheet" in r.headers.get("content-type", "")
    # Verify it's a real xlsx with expected sheet
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(r.content))
    assert "Final_RO_Output" in wb.sheetnames


def test_download_404(api_client):
    r = api_client.get(f"{BASE_URL}/api/download/no-such-job")
    assert r.status_code == 404
