import json
import sqlite3
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool

from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

# ─────────────────────────────────────────
# APP
# ─────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────

conn = sqlite3.connect("interactions.db", check_same_thread=False)

conn.execute("""
CREATE TABLE IF NOT EXISTS interactions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    hcp_name          TEXT    DEFAULT '',
    interaction_type  TEXT    DEFAULT 'Meeting',
    date              TEXT    DEFAULT '',
    time              TEXT    DEFAULT '',
    attendees         TEXT    DEFAULT '[]',
    topics            TEXT    DEFAULT '',
    materials         TEXT    DEFAULT '[]',
    samples           TEXT    DEFAULT '[]',
    sentiment         TEXT    DEFAULT 'neutral',
    outcomes          TEXT    DEFAULT '',
    follow_up_actions TEXT    DEFAULT '',
    created_at        TEXT    DEFAULT (datetime('now'))
)
""")

conn.commit()

# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

SELECT_LATEST = """
    SELECT hcp_name, interaction_type, date, time,
           attendees, topics, materials, samples,
           sentiment, outcomes, follow_up_actions
    FROM   interactions
    ORDER  BY id DESC
    LIMIT  1
"""

def safe_json_list(value: str) -> list:
    """Always return a Python list from a stored JSON string."""
    try:
        result = json.loads(value or "[]")
        return result if isinstance(result, list) else []
    except Exception:
        return []


def coerce_json_array(value: str) -> str:
    """
    Accept a JSON array string OR comma-separated plain text and
    always return a valid JSON array string.
    """
    if not value or not value.strip():
        return "[]"
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return json.dumps([str(i).strip() for i in parsed if str(i).strip()])
    except Exception:
        pass
    items = [v.strip() for v in value.split(",") if v.strip()]
    return json.dumps(items)


def row_to_form(row) -> dict:
    """Convert a DB row tuple to the FormData shape the frontend expects."""
    if not row:
        return {}
    return {
        "hcp_name":          row[0] or "",
        "interaction_type":  row[1] or "Meeting",
        "date":              row[2] or datetime.now().strftime("%Y-%m-%d"),
        "time":              row[3] or datetime.now().strftime("%H:%M"),
        "attendees":         safe_json_list(row[4]),
        "topics":            row[5] or "",
        "materials":         safe_json_list(row[6]),
        "samples":           safe_json_list(row[7]),
        "sentiment":         row[8] or "neutral",
        "outcomes":          row[9] or "",
        "follow_up_actions": row[10] or "",
    }

# ─────────────────────────────────────────
# LLM
# ─────────────────────────────────────────

model = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key="api",
    temperature=0,
)

# ─────────────────────────────────────────
# TOOLS
# ─────────────────────────────────────────

@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    date: str,
    time: str,
    attendees: str,
    topics: str,
    materials: str,
    samples: str,
    sentiment: str,
    outcomes: str,
    follow_up_actions: str,
) -> dict:
    """
    Save a new HCP interaction to the CRM database.

    Parameters
    ----------
    hcp_name          : Full name of the doctor / HCP, e.g. "Dr. Arjun Mehta"
    interaction_type  : One of Meeting | Call | Email | Conference | Virtual
    date              : Interaction date in YYYY-MM-DD format
    time              : Interaction time in HH:MM 24-hour format
    attendees         : JSON array of attendee name strings, e.g. '["Dr. Priya Shah"]'
    topics            : Plain-text summary of discussion points
    materials         : JSON array of materials/brochures shared, e.g. '["OncoBoost PDF"]'
    samples           : JSON array of drug samples distributed, e.g. '["OncoBoost 10mg x2"]'
    sentiment         : Observed HCP sentiment — MUST be exactly: positive | neutral | negative
    outcomes          : Key outcomes or agreements from the interaction
    follow_up_actions : Next steps (newline-separated if multiple)
    """
    try:
        sentiment = sentiment.lower().strip()
        if sentiment not in ("positive", "neutral", "negative"):
            sentiment = "neutral"

        valid_types = {"Meeting", "Call", "Email", "Conference", "Virtual"}
        if interaction_type not in valid_types:
            interaction_type = "Meeting"

        attendees_json = coerce_json_array(attendees)
        materials_json = coerce_json_array(materials)
        samples_json   = coerce_json_array(samples)

        conn.execute(
            """
            INSERT INTO interactions
                (hcp_name, interaction_type, date, time,
                 attendees, topics, materials, samples,
                 sentiment, outcomes, follow_up_actions)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                hcp_name, interaction_type, date, time,
                attendees_json, topics, materials_json, samples_json,
                sentiment, outcomes, follow_up_actions,
            ),
        )
        conn.commit()
        return {"status": "success", "message": f"Interaction with {hcp_name} logged."}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@tool
def update_interaction_field(field: str, value: str) -> dict:
    """
    Update a single field on the most recently logged interaction.
    Use when the user wants to correct or add a specific detail without
    re-logging the entire record.

    Parameters
    ----------
    field : One of: hcp_name | interaction_type | date | time | attendees |
                    topics | materials | samples | sentiment | outcomes | follow_up_actions
    value : New value. For list fields provide a JSON array or comma-separated text.
    """
    allowed_fields = {
        "hcp_name", "interaction_type", "date", "time", "attendees",
        "topics", "materials", "samples", "sentiment", "outcomes", "follow_up_actions",
    }
    if field not in allowed_fields:
        return {"status": "error", "message": f"Unknown field '{field}'."}

    try:
        cursor = conn.execute("SELECT id FROM interactions ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if not row:
            return {"status": "error", "message": "No interaction found to update."}

        if field in ("attendees", "materials", "samples"):
            value = coerce_json_array(value)
        if field == "sentiment":
            value = value.lower().strip()
            if value not in ("positive", "neutral", "negative"):
                value = "neutral"

        conn.execute(
            f"UPDATE interactions SET {field} = ? WHERE id = ?",
            (value, row[0]),
        )
        conn.commit()
        return {"status": "success", "message": f"Field '{field}' updated."}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ─────────────────────────────────────────
# AGENT
# ─────────────────────────────────────────

tools = [log_interaction, update_interaction_field]

system_prompt = """
You are an intelligent pharma CRM assistant helping medical representatives
log and manage HCP (Healthcare Professional) interactions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN TO CALL log_interaction
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Call log_interaction IMMEDIATELY whenever the user describes any HCP interaction —
a meeting, call, visit, email, or conference. Do not ask clarifying questions first.
Extract what you can; use empty strings / empty arrays for unknown fields.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN TO CALL update_interaction_field
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Call update_interaction_field when the user wants to correct or add a single
detail to the last logged interaction (e.g. "actually the sentiment was positive",
"add OncoBoost PDF to materials").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIELD EXTRACTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hcp_name         -> Full name with title if available, e.g. "Dr. Arjun Mehta"
interaction_type -> Infer: Meeting (default) | Call | Email | Conference | Virtual
date             -> Today YYYY-MM-DD unless user specifies
time             -> Current HH:MM unless user specifies
attendees        -> JSON array of all people present besides the primary HCP
topics           -> Clear prose summary of all discussed topics
materials        -> JSON array of brochures/PDFs/slides shared
samples          -> JSON array of drug samples distributed (include qty if mentioned)
sentiment        -> MUST be exactly: positive | neutral | negative
                   positive: receptive, interested, enthusiastic, agreed
                   neutral:  indifferent, busy, standard, no strong reaction
                   negative: reluctant, dismissive, concerned, refused
outcomes         -> Agreed decisions or key takeaways
follow_up_actions-> Next steps; separate multiple steps with newlines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- After logging give a concise 2-3 sentence confirmation of what was saved.
- Optionally suggest 1-2 follow-up actions if relevant.
- Keep replies professional and brief.
- If the user asks something unrelated to logging, answer helpfully.
"""

memory = MemorySaver()

agent = create_react_agent(
    model,
    tools,
    checkpointer=memory,
    prompt=system_prompt,
)

# ─────────────────────────────────────────
# WEBSOCKET
# ─────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            message = await websocket.receive_text()

            try:
                result = agent.invoke(
                    {"messages": [HumanMessage(content=message)]},
                    config={"configurable": {"thread_id": "user_1"}},
                )
                reply = result["messages"][-1].content
            except Exception as e:
                reply = f"Agent error: {str(e)}"

            try:
                cursor = conn.execute(SELECT_LATEST)
                form_data = row_to_form(cursor.fetchone())
            except Exception:
                form_data = {}

            # Always send { message, form } so the frontend handles both
            await websocket.send_text(json.dumps({
                "message": reply,
                "form":    form_data,
            }))

    except WebSocketDisconnect:
        print("Client disconnected")

# ─────────────────────────────────────────
# REST ENDPOINTS
# ─────────────────────────────────────────

# ─────────────────────────────────────────
# PYDANTIC SCHEMA (for POST body)
# ─────────────────────────────────────────

from pydantic import BaseModel
from typing import List

class InteractionIn(BaseModel):
    hcp_name:          str = ""
    interaction_type:  str = "Meeting"
    date:              str = ""
    time:              str = ""
    attendees:         List[str] = []
    topics:            str = ""
    materials:         List[str] = []
    samples:           List[str] = []
    sentiment:         str = "neutral"
    outcomes:          str = ""
    follow_up_actions: str = ""


@app.post("/interactions")
def create_interaction(body: InteractionIn):
    """
    Submit a fully-formed interaction from the frontend form.
    Used by the Submit Interaction button.
    """
    try:
        sentiment = body.sentiment.lower().strip()
        if sentiment not in ("positive", "neutral", "negative"):
            sentiment = "neutral"

        valid_types = {"Meeting", "Call", "Email", "Conference", "Virtual"}
        interaction_type = body.interaction_type if body.interaction_type in valid_types else "Meeting"

        conn.execute(
            """
            INSERT INTO interactions
                (hcp_name, interaction_type, date, time,
                 attendees, topics, materials, samples,
                 sentiment, outcomes, follow_up_actions)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                body.hcp_name,
                interaction_type,
                body.date,
                body.time,
                json.dumps(body.attendees),
                body.topics,
                json.dumps(body.materials),
                json.dumps(body.samples),
                sentiment,
                body.outcomes,
                body.follow_up_actions,
            ),
        )
        conn.commit()
        return {"status": "success", "message": f"Interaction with {body.hcp_name} submitted."}

    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/form")
def get_latest_form():
    """Return the most recently logged interaction as FormData."""
    try:
        cursor = conn.execute(SELECT_LATEST)
        return row_to_form(cursor.fetchone())
    except Exception as e:
        return {"error": str(e)}


@app.get("/interactions")
def list_interactions(limit: int = 20):
    """Return the last N interactions for a history / audit view."""
    try:
        cursor = conn.execute("""
            SELECT id, hcp_name, interaction_type, date, time, sentiment, created_at
            FROM   interactions
            ORDER  BY id DESC
            LIMIT  ?
        """, (limit,))
        rows = cursor.fetchall()
        return [
            {
                "id":               r[0],
                "hcp_name":         r[1],
                "interaction_type": r[2],
                "date":             r[3],
                "time":             r[4],
                "sentiment":        r[5],
                "created_at":       r[6],
            }
            for r in rows
        ]
    except Exception as e:
        return {"error": str(e)}


@app.delete("/interactions/{interaction_id}")
def delete_interaction(interaction_id: int):
    """Delete a specific interaction by ID."""
    try:
        conn.execute("DELETE FROM interactions WHERE id = ?", (interaction_id,))
        conn.commit()
        return {"status": "success", "message": f"Interaction {interaction_id} deleted."}
    except Exception as e:
        return {"status": "error", "message": str(e)}