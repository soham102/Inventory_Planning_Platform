# Inventory Command Center - PRD

## Problem Statement (Original)
Build a modern frontend UI for an "Inventory Command Center" platform used by quick commerce operations teams. Real-world inventory replenishment platform for Blinkit seller-model operations. Premium SaaS dashboard / operational mission control feel. Primary user flow: upload Blinkit Excel → process replenishment recommendations → visual dashboard → review recommendations → download final RO sheet.

## User Decisions
- Full-stack: FastAPI backend that actually parses Excel files
- Dark mission-control aesthetic (design agent picked deep slate + cyan/emerald)
- Empty/upload-first state
- Real LLM reasoning per SKU (Claude Sonnet via Emergent LLM key)
- All sidebar pages built as separate routes

## Architecture
- React + Tailwind + Recharts + Shadcn/UI + lucide-react
- Routes: /, /inventory-health, /stockout-risks, /recommendations, /reports, /settings
- FastAPI backend with endpoints: POST /api/upload, GET /api/jobs/{id}, GET /api/jobs, POST /api/reasoning, GET /api/download/{id}
- MongoDB stores parsed job documents
- Excel parsing supports two formats: ("Stock On Hand" + "RO Sheet") and ("Warehouse details" + "Incoming inventory" + "Units sold")

## Implemented (2026-02-28)
- Excel ingestion + replenishment algorithm (lead time, days-of-inventory, quantity-to-send, risk levels)
- KPIs: high-risk SKUs, total replenishment qty, warehouses at risk, healthy %, pending orders
- Charts: city-wise stacked bar, risk pie, top risky horizontal bar, qty-by-city line, lead vs inventory comparison
- Recommendations table with search, risk + alert filters, pagination, sticky header, expandable rows with AI reasoning
- Critical alerts panel (top 8 highest risk SKUs)
- AI reasoning powered by Claude Sonnet via Emergent LLM key (per-row, on demand)
- Final RO Sheet Excel download endpoint
- All 6 sidebar pages (Dashboard, Inventory Health, Stockout Risks, Recommendations, Reports, Settings)
- Dark mission-control aesthetic: deep slate + cyan/emerald accents, Chivo + IBM Plex fonts, tactical grid background

## Backlog
- P1: Persist last successful job in localStorage so users can resume
- P1: Multi-file batch upload + run history page
- P2: Drill-down to per-warehouse views
- P2: Real-time websocket updates for live mode
- P2: Slack/Email notification wiring (settings already mocked)
