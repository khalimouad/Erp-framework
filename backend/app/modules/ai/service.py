import os
import httpx
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an AI assistant embedded in NextERP, a modular open-source ERP framework.
You help users navigate, understand, and use the application efficiently.

The system has the following modules:
- Dashboard: KPI overview with quick navigation
- CRM (/crm): Lead and pipeline management
- Sales (/sales): Sales orders with order lines, status tracking
- Purchasing (/purchasing): Purchase orders and vendor management
- Inventory (/inventory): Product catalog and stock movements
- Accounting (/accounting): Invoices and payment recording
- HR (/hr): Employee records, job titles, salary
- Medical (/medical/patients, /medical/appointments, /medical/pharmacy): Patient management, appointments, pharmacy stock
- Manufacturing (/manufacturing/work-orders, /manufacturing/bom): Work orders and Bills of Materials
- Quality (/quality): Quality control checks with pass/fail/on_hold results
- Companies (/companies): Company/tenant management
- Users (/users): User accounts, roles, and permissions
- Settings (/settings): Module management, system config, vertical switcher

Navigation tip: Press Ctrl+K to open global search and jump to any page instantly.

Respond concisely and helpfully. If asked about specific data, explain the feature and where to find it.
Keep answers short (2-4 sentences) unless more detail is needed."""


async def ask(question: str) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")

    if api_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": "claude-haiku-4-5-20251001",
                        "max_tokens": 512,
                        "system": SYSTEM_PROMPT,
                        "messages": [{"role": "user", "content": question}],
                    },
                    timeout=30.0,
                )
                if resp.status_code == 200:
                    return resp.json()["content"][0]["text"]
                logger.warning(f"AI API returned {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.error(f"AI API call failed: {e}")

    return _mock_response(question)


def _mock_response(question: str) -> str:
    q = question.lower()

    if any(w in q for w in ["crm", "lead", "pipeline", "opportunity"]):
        return "The CRM module manages your sales leads and pipeline. Navigate to /crm to view, create and update leads with stage tracking."

    if any(w in q for w in ["invoice", "accounting", "payment", "bill"]):
        return "Accounting (/accounting) handles invoices and payments. You can create invoices, track their status (draft → sent → paid) and record payments."

    if any(w in q for w in ["employee", "staff", "hr", "payroll", "salary"]):
        return "The HR module (/hr) manages employee records including job title, department, and salary. Active/inactive status is also tracked."

    if any(w in q for w in ["patient", "appointment", "clinic", "doctor", "medical"]):
        return "The Medical vertical covers Patients (/medical/patients), Appointments (/medical/appointments) and Pharmacy stock (/medical/pharmacy)."

    if any(w in q for w in ["pharmacy", "drug", "medication", "low stock"]):
        return "Pharmacy (/medical/pharmacy) tracks medication inventory. Low-stock alerts appear when items fall below minimum quantity."

    if any(w in q for w in ["product", "inventory", "stock", "warehouse"]):
        return "Inventory (/inventory) manages your product catalog and stock movements. You can record stock moves to adjust levels."

    if any(w in q for w in ["purchase", "vendor", "supplier", "po"]):
        return "Purchase Orders (/purchasing) track vendor orders. Status flows: draft → confirmed → received → cancelled."

    if any(w in q for w in ["sale", "so", "customer order"]):
        return "Sales Orders (/sales) manage customer orders with line items. Status: draft → confirmed → shipped → invoiced."

    if any(w in q for w in ["manufactur", "production", "bom", "bill of material", "work order"]):
        return "Manufacturing has Work Orders (/manufacturing/work-orders) for production tracking and Bills of Materials (/manufacturing/bom) for product recipes."

    if any(w in q for w in ["quality", "qc", "check", "inspection"]):
        return "Quality Control (/quality) logs quality checks per product/work-order with pass, fail, or on_hold results."

    if any(w in q for w in ["user", "role", "permission", "access", "rbac"]):
        return "Users (/users) manages accounts and role-based access. Each module declares its own roles (e.g. crm.manager) which are assigned per user."

    if any(w in q for w in ["setting", "config", "module", "install", "vertical"]):
        return "Settings (/settings) lets you manage installed modules, system configuration values, and switch between ERP verticals (General, Trading, Medical, Manufacturing)."

    if any(w in q for w in ["search", "ctrl", "navigate", "shortcut"]):
        return "Press Ctrl+K anywhere to open the global search — instantly jump to any module or page in the app."

    if any(w in q for w in ["company", "tenant", "organization"]):
        return "Companies (/companies) stores your company registry with tax ID, currency, contact info, and address."

    if any(w in q for w in ["dashboard", "kpi", "overview"]):
        return "The Dashboard (/) shows key metrics: leads, employees, invoices, and inventory. Click any card to jump to that module."

    if any(w in q for w in ["help", "how", "what", "guide"]):
        return "I can help you with any NextERP module. Ask me about CRM, Sales, Purchasing, Inventory, HR, Accounting, Medical, Manufacturing, Quality, or Settings."

    return (
        "I'm the NextERP AI assistant. I can help you navigate and use the system. "
        "Try asking about a specific module like 'How do I manage invoices?' or 'Where are purchase orders?'. "
        "Press Ctrl+K to search pages quickly."
    )
