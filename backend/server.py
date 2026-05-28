"""
Inventory Command Center - FastAPI Backend
Parses Blinkit inventory Excel files and returns replenishment recommendations,
KPIs, chart datasets, and AI reasoning per SKU.
"""
from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import uuid
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
LEAD_TIME_MAPPING = {
    "Bangalore": 7,
    "Bengaluru": 7,
    "Mumbai": 5,
    "Hyderabad": 6,
    "Lucknow": 4,
    "Delhi": 2,
    "Gurgaon": 2,
    "Noida": 2,
    "Chennai": 8,
    "Pune": 5,
    "Kolkata": 6,
    "Jaipur": 5,
    "Ahmedabad": 5,
    "Kundli": 3,
}
DEFAULT_LEAD_TIME = 5
BUFFER_DAYS = 3
TARGET_DAYS = 14

CITY_KEYWORDS = list(LEAD_TIME_MAPPING.keys())


def extract_city(name: str) -> str:
    if not isinstance(name, str):
        return "Other"
    for c in CITY_KEYWORDS:
        if c.lower() in name.lower():
            return "Bangalore" if c == "Bengaluru" else c
    return "Other"


# -----------------------------------------------------------------------------
# Mongo
# -----------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(title="Inventory Command Center API")
api_router = APIRouter(prefix="/api")


# -----------------------------------------------------------------------------
# Excel processing
# -----------------------------------------------------------------------------
def _find_sheet(xls: pd.ExcelFile, candidates: List[str]) -> Optional[str]:
    for s in xls.sheet_names:
        for c in candidates:
            if c.lower() in s.lower():
                return s
    return None


def _norm_cols(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = (
        df.columns.astype(str).str.strip().str.replace("\n", " ").str.replace("  ", " ")
    )
    return df


def _parse_stock_ro_format(file_bytes: bytes) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """User's primary format: 'Stock On Hand' (header=2) + 'RO Sheet' (header=1)."""
    stock = _norm_cols(pd.read_excel(io.BytesIO(file_bytes), sheet_name="Stock On Hand", header=2))
    ro = _norm_cols(pd.read_excel(io.BytesIO(file_bytes), sheet_name="RO Sheet", header=1))

    # Inventory + sales from Stock On Hand
    inv = stock[
        ["Warehouse Facility ID", "Item ID", "Total sellable", "Total unsellable"]
    ].rename(columns={
        "Warehouse Facility ID": "warehouse_id",
        "Item ID": "item_id",
        "Total sellable": "current_stock",
        "Total unsellable": "unsellable_stock",
    })

    sales = stock[["Warehouse Facility ID", "Item ID", "Last 30 days"]].rename(columns={
        "Warehouse Facility ID": "warehouse_id", "Item ID": "item_id",
    })

    # Incoming + min/max + warehouse name from RO Sheet
    inc = ro[
        ["Warehouse ID", "Warehouse Name", "Item ID", "Incoming Quantity",
         "Suggested Min Inventory", "Max Inventory"]
    ].rename(columns={
        "Warehouse ID": "warehouse_id",
        "Warehouse Name": "warehouse_name",
        "Item ID": "item_id",
        "Incoming Quantity": "incoming_stock",
        "Suggested Min Inventory": "min_inventory",
        "Max Inventory": "max_inventory",
    })
    return inv, inc, sales


def _parse_multi_sheet_format(file_bytes: bytes) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Alternative format with 'Warehouse details' / 'Incoming inventory' / 'Units sold' sheets."""
    warehouse_df = _norm_cols(pd.read_excel(io.BytesIO(file_bytes), sheet_name="Warehouse details"))
    incoming_df = _norm_cols(pd.read_excel(io.BytesIO(file_bytes), sheet_name="Incoming inventory"))
    units_df = _norm_cols(pd.read_excel(io.BytesIO(file_bytes), sheet_name="Units sold"))

    inv = warehouse_df[
        ["Warehouse Facility ID", "Warehouse Facility Name", "Item ID", "Total sellable", "Total unsellable"]
    ].rename(columns={
        "Warehouse Facility ID": "warehouse_id",
        "Warehouse Facility Name": "warehouse_name_inv",
        "Item ID": "item_id",
        "Total sellable": "current_stock",
        "Total unsellable": "unsellable_stock",
    })
    inc = incoming_df[
        ["Warehouse Facility ID", "Item ID", "Incoming Quantity", "Suggested Min Inventory", "Max Inventory"]
    ].rename(columns={
        "Warehouse Facility ID": "warehouse_id",
        "Item ID": "item_id",
        "Incoming Quantity": "incoming_stock",
        "Suggested Min Inventory": "min_inventory",
        "Max Inventory": "max_inventory",
    })
    # In this format warehouse name comes from inv side
    inc["warehouse_name"] = ""
    inv_named = inv.rename(columns={"warehouse_name_inv": "warehouse_name"})
    # Move warehouse_name into inc by warehouse_id
    name_map = inv_named.drop_duplicates("warehouse_id").set_index("warehouse_id")["warehouse_name"]
    inc["warehouse_name"] = inc["warehouse_id"].map(name_map).fillna("")
    inv = inv_named.drop(columns=["warehouse_name"])

    sales = units_df[["Warehouse Facility ID", "Item ID", "Last 30 days"]].rename(columns={
        "Warehouse Facility ID": "warehouse_id", "Item ID": "item_id",
    })
    return inv, inc, sales


def process_inventory_excel(file_bytes: bytes) -> Dict[str, Any]:
    """Parse a Blinkit-style inventory Excel and return processed recommendations."""
    xls = pd.ExcelFile(io.BytesIO(file_bytes))
    sheet_names = [s.lower() for s in xls.sheet_names]

    try:
        if any("stock on hand" in s for s in sheet_names) and any("ro sheet" in s for s in sheet_names):
            inv, inc, sales = _parse_stock_ro_format(file_bytes)
        elif any("warehouse details" in s for s in sheet_names) and any("incoming inventory" in s for s in sheet_names):
            inv, inc, sales = _parse_multi_sheet_format(file_bytes)
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Excel format not recognized. Expected either ('Stock On Hand' + 'RO Sheet') "
                    "or ('Warehouse details' + 'Incoming inventory' + 'Units sold') sheets."
                ),
            )
    except HTTPException:
        raise
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing expected column: {e}")

    # Daily sales
    sales["Last 30 days"] = pd.to_numeric(sales["Last 30 days"], errors="coerce").fillna(30)
    sales["Last 30 days"] = sales["Last 30 days"].replace(0, 30)
    sales["daily_sales"] = sales["Last 30 days"] / 30.0

    # Merge inventory + incoming + sales
    merged = inc.merge(inv, on=["warehouse_id", "item_id"], how="left")
    merged = merged.merge(sales[["warehouse_id", "item_id", "daily_sales"]], on=["warehouse_id", "item_id"], how="left")

    # Fill warehouse_name from any side
    if "warehouse_name" not in merged.columns:
        merged["warehouse_name"] = ""
    merged["warehouse_name"] = merged["warehouse_name"].fillna("")

    for col, default in [
        ("current_stock", 0),
        ("unsellable_stock", 0),
        ("incoming_stock", 0),
        ("min_inventory", 0),
        ("max_inventory", 0),
        ("daily_sales", 1),
    ]:
        if col not in merged.columns:
            merged[col] = default
        merged[col] = pd.to_numeric(merged[col], errors="coerce").fillna(default)

    # City + lead time
    merged["city"] = merged["warehouse_name"].apply(extract_city)
    merged["lead_time_days"] = merged["city"].map(LEAD_TIME_MAPPING).fillna(DEFAULT_LEAD_TIME).astype(int)

    # Total inventory
    merged["total_inventory"] = (
        merged["current_stock"] + merged["incoming_stock"] - merged["unsellable_stock"]
    ).clip(lower=0)

    # Quantity to send
    def qty(row):
        if row["max_inventory"] == 0:
            return 0
        if row["total_inventory"] < row["min_inventory"]:
            return max(0, row["max_inventory"] - row["total_inventory"])
        return 0

    merged["quantity_to_send"] = merged.apply(qty, axis=1).clip(lower=0)

    # Days of inventory left
    merged["days_of_inventory_left"] = np.where(
        merged["daily_sales"] > 0,
        merged["total_inventory"] / merged["daily_sales"],
        999,
    ).round(2)

    # Stockout risk
    def risk(row):
        days = row["days_of_inventory_left"]
        lt = row["lead_time_days"]
        if days <= lt:
            return "HIGH"
        if days <= lt + BUFFER_DAYS:
            return "MEDIUM"
        return "LOW"

    merged["stockout_risk"] = merged.apply(risk, axis=1)
    merged["alert"] = np.where(merged["quantity_to_send"] > 0, "PLACE ORDER", "NO ACTION")

    # Round numerics
    merged["daily_sales"] = merged["daily_sales"].round(2)

    return {
        "recommendations": merged.to_dict(orient="records"),
        "row_count": len(merged),
    }


def compute_kpis_and_charts(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate metrics for KPI cards, charts, and alerts."""
    df = pd.DataFrame(records)
    if df.empty:
        return {
            "kpis": {
                "high_risk_skus": 0,
                "total_replenishment_qty": 0,
                "warehouses_at_risk": 0,
                "healthy_inventory_pct": 0,
                "pending_orders": 0,
            },
            "charts": {},
            "alerts": [],
        }

    total_rows = len(df)
    high_risk = df[df["stockout_risk"] == "HIGH"]
    medium_risk = df[df["stockout_risk"] == "MEDIUM"]
    low_risk = df[df["stockout_risk"] == "LOW"]

    kpis = {
        "high_risk_skus": int(len(high_risk)),
        "total_replenishment_qty": int(df["quantity_to_send"].sum()),
        "warehouses_at_risk": int(high_risk["warehouse_id"].nunique()),
        "healthy_inventory_pct": round(float(len(low_risk) / total_rows * 100), 1),
        "pending_orders": int((df["alert"] == "PLACE ORDER").sum()),
    }

    # City-wise inventory health (stacked bar)
    city_group = df.groupby("city").agg(
        total_inventory=("total_inventory", "sum"),
        high_risk_count=("stockout_risk", lambda x: int((x == "HIGH").sum())),
        medium_risk_count=("stockout_risk", lambda x: int((x == "MEDIUM").sum())),
        low_risk_count=("stockout_risk", lambda x: int((x == "LOW").sum())),
        sku_count=("item_id", "count"),
    ).reset_index()
    city_inventory = city_group.to_dict(orient="records")

    # Stockout risk distribution
    risk_distribution = [
        {"name": "HIGH", "value": int(len(high_risk))},
        {"name": "MEDIUM", "value": int(len(medium_risk))},
        {"name": "LOW", "value": int(len(low_risk))},
    ]

    # Top risky SKUs (highest qty_to_send among HIGH risk)
    top_risky_df = (
        df[df["stockout_risk"].isin(["HIGH", "MEDIUM"])]
        .sort_values(["quantity_to_send", "days_of_inventory_left"], ascending=[False, True])
        .head(10)
    )
    top_risky_skus = [
        {
            "sku": f"#{int(r['item_id'])} @ {r['warehouse_name'] or r['city']}",
            "qty_to_send": int(r["quantity_to_send"]),
            "days_left": float(r["days_of_inventory_left"]),
            "city": r["city"],
        }
        for _, r in top_risky_df.iterrows()
    ]

    # Quantity to send by city (line)
    qty_by_city = (
        df.groupby("city")["quantity_to_send"].sum().reset_index()
        .sort_values("quantity_to_send", ascending=False)
        .to_dict(orient="records")
    )

    # Lead time vs avg days of inventory (comparison)
    lead_vs_inv = (
        df.groupby("city").agg(
            lead_time=("lead_time_days", "mean"),
            avg_days_left=("days_of_inventory_left", lambda x: round(float(np.clip(x, 0, 60).mean()), 2)),
        )
        .reset_index()
        .to_dict(orient="records")
    )

    # Critical alerts — top 5 highest risk
    alerts = []
    for _, r in df[df["stockout_risk"] == "HIGH"].sort_values("days_of_inventory_left").head(8).iterrows():
        alerts.append({
            "severity": "critical",
            "title": f"SKU #{int(r['item_id'])} stockout imminent",
            "subtitle": f"{r['warehouse_name'] or r['city']} • {r['city']}",
            "metric": f"{round(float(r['days_of_inventory_left']), 1)}d left",
            "lead_time": int(r["lead_time_days"]),
            "qty": int(r["quantity_to_send"]),
        })

    return {
        "kpis": kpis,
        "charts": {
            "city_inventory": city_inventory,
            "risk_distribution": risk_distribution,
            "top_risky_skus": top_risky_skus,
            "qty_by_city": qty_by_city,
            "lead_vs_inv": lead_vs_inv,
        },
        "alerts": alerts,
    }


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class ReasoningRequest(BaseModel):
    job_id: str
    record: Dict[str, Any]


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"service": "Inventory Command Center API", "status": "ok"}


@api_router.post("/upload")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx or .xls files are supported")

    content = await file.read()
    try:
        parsed = process_inventory_excel(content)
    except HTTPException:
        raise
    except Exception as e:  # noqa
        logging.exception("Excel parse failed")
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    aggregates = compute_kpis_and_charts(parsed["recommendations"])

    job_id = str(uuid.uuid4())
    doc = {
        "job_id": job_id,
        "filename": file.filename,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "row_count": parsed["row_count"],
        "recommendations": parsed["recommendations"],
        "kpis": aggregates["kpis"],
        "charts": aggregates["charts"],
        "alerts": aggregates["alerts"],
    }
    await db.inventory_jobs.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    doc = await db.inventory_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return doc


@api_router.get("/jobs")
async def list_jobs():
    """List recent jobs (lightweight, no recommendations payload)."""
    docs = await db.inventory_jobs.find(
        {}, {"_id": 0, "recommendations": 0, "charts": 0}
    ).sort("created_at", -1).to_list(50)
    return docs


@api_router.post("/reasoning")
async def reasoning(req: ReasoningRequest):
    """Generate AI reasoning for a single recommendation using Emergent LLM key."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    r = req.record
    prompt = (
        f"You are an inventory replenishment analyst for a quick-commerce platform. "
        f"Given this SKU's data, produce a SHORT (2 to 3 sentences, max 60 words) operational "
        f"recommendation. Be specific with numbers. Avoid generic phrases. Do NOT include bullet "
        f"points, headers, or markdown.\n\n"
        f"SKU: {r.get('item_id')}\n"
        f"Warehouse: {r.get('warehouse_name')} ({r.get('city')})\n"
        f"Current stock: {r.get('current_stock')}\n"
        f"Incoming stock: {r.get('incoming_stock')}\n"
        f"Unsellable: {r.get('unsellable_stock')}\n"
        f"Total available: {r.get('total_inventory')}\n"
        f"Min inventory: {r.get('min_inventory')}\n"
        f"Max inventory: {r.get('max_inventory')}\n"
        f"Daily sales: {r.get('daily_sales')} units/day\n"
        f"Days of inventory left: {r.get('days_of_inventory_left')}\n"
        f"Lead time: {r.get('lead_time_days')} days\n"
        f"Recommended quantity to send: {r.get('quantity_to_send')}\n"
        f"Risk: {r.get('stockout_risk')}\n"
    )

    chat = LlmChat(
        api_key=key,
        session_id=f"reasoning-{req.job_id}",
        system_message=(
            "You are a senior supply-chain analyst. Speak with precision and confidence. "
            "Always cite the exact numbers from the SKU data when explaining reasoning."
        ),
    ).with_model("anthropic", "claude-sonnet-4-6")

    try:
        text = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        logging.exception("LLM call failed")
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")

    return {"reasoning": text.strip()}


@api_router.get("/download/{job_id}")
async def download_ro_sheet(job_id: str):
    doc = await db.inventory_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")

    df = pd.DataFrame(doc["recommendations"])
    column_order = [
        "warehouse_id", "warehouse_name", "item_id", "current_stock",
        "unsellable_stock", "incoming_stock", "min_inventory", "max_inventory",
        "daily_sales", "lead_time_days", "total_inventory", "quantity_to_send",
        "days_of_inventory_left", "stockout_risk", "alert", "city",
    ]
    df = df[[c for c in column_order if c in df.columns]]
    df = df.sort_values(by=["stockout_risk", "quantity_to_send"], ascending=[True, False])

    zero_max = df[df.get("max_inventory", 0) == 0]

    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Final_RO_Output", index=False)
        if not zero_max.empty:
            zero_max.to_excel(writer, sheet_name="Zero_Max_Inventory", index=False)
    out.seek(0)

    fname = f"Blinkit_RO_{job_id[:8]}.xlsx"
    return StreamingResponse(
        out,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


# -----------------------------------------------------------------------------
# Mount
# -----------------------------------------------------------------------------
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
