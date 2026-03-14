<div align="center">

<br/>

```
██████╗ ██╗  ██╗ █████╗ ██████╗ ███╗   ███╗ █████╗      ██████╗██████╗ ███╗   ███╗
██╔══██╗██║  ██║██╔══██╗██╔══██╗████╗ ████║██╔══██╗    ██╔════╝██╔══██╗████╗ ████║
██████╔╝███████║███████║██████╔╝██╔████╔██║███████║    ██║     ██████╔╝██╔████╔██║
██╔═══╝ ██╔══██║██╔══██║██╔══██╗██║╚██╔╝██║██╔══██║    ██║     ██╔══██╗██║╚██╔╝██║
██║     ██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║    ╚██████╗██║  ██║██║ ╚═╝ ██║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝     ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝
```

<br/>

# 🧬 Pharma CRM — AI Interaction Logger

### *Log doctor meetings in plain English. Let AI do the rest.*

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent-FF6B6B?style=for-the-badge&logo=python&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Persistent-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.1-F55036?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com/)

<br/>

> A conversational AI assistant for pharma sales representatives.  
> Describe a doctor meeting in natural language — the agent extracts every detail,  
> fills the structured form, and saves it to the database. **Zero manual typing.**

<br/>

---

</div>

## ✨ What Makes This Special

Instead of filling out a boring CRM form field by field, you just *talk* to the AI:

```
You:  "Met Dr. Arjun Mehta this afternoon. He was very receptive to OncoBoost.
       Shared the Phase III PDF and gave him 2 sample packs. He wants a follow-up
       in two weeks and mentioned he might join the advisory board."

AI:   ✓ Interaction with Dr. Arjun Mehta logged.
      Sentiment: Positive · Materials: OncoBoost Phase III PDF
      Samples: 2 packs · Follow-up: Scheduled in 2 weeks
```

**The form fills itself. The database updates in real time. The memory persists.**

<br/>

---

## 🖥️ Demo

<div align="center">

| Left Panel — Smart Form | Right Panel — AI Chat |
|:---:|:---:|
| Auto-populates from AI | Natural language input |
| Tag-chip attendees | Typing indicator |
| Sentiment pills | Full conversation history |
| Clickable AI suggestions | Persistent memory |

</div>

<br/>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React + TS)                        │
│                                                                     │
│   ┌──────────────────────┐        ┌──────────────────────────────┐  │
│   │    LEFT PANEL         │        │       RIGHT PANEL            │  │
│   │   (Smart Form)        │◄──────►│       (AI Chat)              │  │
│   │                       │  sync  │                              │  │
│   │  • HCP Name           │        │  • WebSocket connection      │  │
│   │  • Interaction Type   │        │  • Animated typing dots      │  │
│   │  • Date & Time        │        │  • Message bubbles           │  │
│   │  • Attendees (tags)   │        │  • Auto-scroll               │  │
│   │  • Topics             │        │                              │  │
│   │  • Materials & Samples│        └──────────────────────────────┘  │
│   │  • Sentiment Pills    │                      │                   │
│   │  • Outcomes           │                      │ ws://             │
│   │  • Follow-up Actions  │                      │                   │
│   └──────────────────────┘                      ▼                   │
└──────────────────────────────────────────────────│──────────────────┘
                                                   │
                              ┌────────────────────▼──────────────────┐
                              │         FastAPI Backend                │
                              │                                        │
                              │   WebSocket /ws  ◄──── receives msg   │
                              │        │                               │
                              │        ▼                               │
                              │   LangGraph Agent (Llama 3.1 / Groq)  │
                              │        │                               │
                              │    decides tool ──────────────────┐   │
                              │                                   │   │
                              │   ┌───────────────────────────────▼─┐ │
                              │   │           TOOLS                  │ │
                              │   │  • log_interaction()             │ │
                              │   │  • update_interaction_field()    │ │
                              │   │  • GET  /form                    │ │
                              │   │  • POST /interactions            │ │
                              │   │  • SqliteSaver (memory)          │ │
                              │   └──────────────┬───────────────────┘ │
                              │                  │                      │
                              │        ┌─────────▼──────────┐          │
                              │        │      SQLite         │          │
                              │        │  interactions.db    │          │
                              │        │  agent_memory.db    │          │
                              │        └────────────────────┘          │
                              └────────────────────────────────────────┘
```

<br/>

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI, form state, chat interface |
| **Styling** | CSS-in-JS (no external lib) | Custom design system, DM Sans + Sora fonts |
| **Realtime** | WebSocket (native browser API) | Bidirectional agent communication |
| **HTTP** | Axios | Form fetch on load, submit interaction |
| **Backend** | FastAPI | WebSocket server, REST endpoints |
| **Agent** | LangGraph `create_react_agent` | Tool-calling loop with memory |
| **LLM** | Llama 3.1 8B via Groq | Fast inference, tool use |
| **Memory** | `SqliteSaver` | Persistent conversation history |
| **Database** | SQLite | Interaction records storage |
| **Validation** | Pydantic | Request body schema |

<br/>

---

## 🤖 The 5 LangGraph Tools

Each tool is triggered automatically by the agent based on user intent:

### `01` — `log_interaction`
**Trigger:** User describes any HCP meeting, call, or visit

Extracts all 11 fields from natural language and inserts a new row into `interactions.db`.

```python
# Example trigger phrase:
"Met Dr. Sharma, she was neutral about the product, shared the brochure"

# What the agent calls:
log_interaction(
    hcp_name="Dr. Sharma",
    sentiment="neutral",
    materials='["OncoBoost Brochure"]',
    ...
)
```

---

### `02` — `update_interaction_field`
**Trigger:** User corrects a single field on the last entry

Updates one column without re-logging the entire record.

```python
# Example trigger phrase:
"Actually, the sentiment was positive not neutral"

# What the agent calls:
update_interaction_field(field="sentiment", value="positive")
```

---

### `03` — `GET /form`
**Trigger:** Page load or browser refresh

Fetches the latest interaction from the database and auto-populates all 11 form fields. Array fields (`attendees`, `materials`, `samples`) are parsed from JSON strings back into tag chips.

```typescript
// Called on component mount:
const res = await axios.get("http://localhost:8000/form");
setForm(prev => ({ ...DEFAULT_FORM, ...prev, ...res.data }));
```

---

### `04` — `POST /interactions`
**Trigger:** User clicks the **Submit Interaction** button

Validates required fields → POSTs the full FormData as JSON → saves to DB → resets the form → shows toast confirmation.

```typescript
await axios.post("http://localhost:8000/interactions", form);
// → green toast: "✓ Interaction submitted successfully"
// → form resets to defaults
// → localStorage draft cleared
```

---

### `05` — `SqliteSaver` (Memory Tool)
**Trigger:** Every agent invocation, automatically

Persists the full conversation thread to `agent_memory.db`. Unlike the default `MemorySaver` (RAM only), this survives server restarts — the agent remembers previous conversations across sessions.

```python
from langgraph.checkpoint.sqlite import SqliteSaver
memory = SqliteSaver.from_conn_string("agent_memory.db")
# → conversation history survives uvicorn restarts
```

<br/>

---

## 📁 Project Structure

```
pharma-crm/
│
├── 📄 main.py                    # FastAPI backend
│   ├── Database setup            # SQLite schema (11 fields)
│   ├── Helper functions          # row_to_form(), coerce_json_array()
│   ├── LLM setup                 # ChatGroq (Llama 3.1)
│   ├── Tool definitions          # log_interaction, update_interaction_field
│   ├── Agent setup               # create_react_agent + system_prompt
│   ├── WebSocket endpoint        # /ws — realtime chat
│   └── REST endpoints            # GET /form, POST /interactions, GET /interactions, DELETE
│
├── 📄 src/App.tsx                # React frontend (single file)
│   ├── GlobalStyles              # CSS-in-JS design system
│   ├── TagInput component        # Chip-style multi-value input
│   ├── MaterialList component    # Add/remove materials & samples
│   ├── Icon components           # Inline SVG icons
│   └── App component             # Main layout + all state + WS logic
│
├── 🗄️ interactions.db            # Auto-created on first run
├── 🗄️ agent_memory.db            # Auto-created on first run
└── 📋 requirements.txt           # Python dependencies
```

<br/>

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com/) (free tier available)

---

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/pharma-crm-ai.git
cd pharma-crm-ai
```

---

### 2. Backend setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn websockets \
            langchain-groq langgraph \
            langgraph-checkpoint-sqlite \
            pydantic python-dotenv
```

Set your Groq API key — open `main.py` and replace:
```python
api_key="api"
# ↓ replace with:
api_key="gsk_your_actual_key_here"
```

Or use a `.env` file:
```bash
echo "GROQ_API_KEY=gsk_your_key" > .env
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     WebSocket ready at ws://localhost:8000/ws
```

---

### 3. Frontend setup

```bash
# In a new terminal
npx create-react-app pharma-frontend --template typescript
cd pharma-frontend

# Install dependencies
npm install axios

# Replace src/App.tsx with the provided App.tsx file
cp ../App.tsx src/App.tsx

# Start the dev server
npm start
```

Open [http://localhost:3000](http://localhost:3000) 🎉

<br/>

---

## 💡 Usage Examples

### Log a new interaction via chat

```
"Had a 30-minute meeting with Dr. Priya Shah at Apollo Hospital today.
 Discussed the new OncoBoost Phase III trial results. She was very enthusiastic.
 Shared the clinical summary PDF and gave her 3 sample packs.
 She agreed to present at the next oncology conference."
```

**Result:** Form auto-fills with HCP name, sentiment → positive, materials, samples, and a suggested follow-up.

---

### Correct a mistake

```
"Change the date to yesterday"
"The HCP name is Dr. Priya Shah not Priya"  
"Add the dosing guide to materials"
```

---

### Submit via form

Fill additional fields manually, click **Submit Interaction** for validation + database save with a confirmation toast.

---

### Save a draft

Click **Save Draft** — the form state is saved to `localStorage` and automatically restored on next page load.

<br/>

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `WS` | `/ws` | WebSocket — realtime agent chat |
| `GET` | `/form` | Latest interaction as FormData |
| `POST` | `/interactions` | Submit full interaction from form |
| `GET` | `/interactions?limit=20` | List last N interactions |
| `DELETE` | `/interactions/{id}` | Delete interaction by ID |

### FormData schema

```typescript
interface FormData {
  hcp_name:          string        // "Dr. Arjun Mehta"
  interaction_type:  string        // "Meeting" | "Call" | "Email" | "Conference" | "Virtual"
  date:              string        // "2025-04-19"
  time:              string        // "19:36"
  attendees:         string[]      // ["Dr. Priya Shah", "Sales Rep 2"]
  topics:            string        // "Discussed OncoBoost Phase III..."
  materials:         string[]      // ["OncoBoost Phase III PDF"]
  samples:           string[]      // ["OncoBoost 10mg x2"]
  sentiment:         "positive" | "neutral" | "negative"
  outcomes:          string        // "Dr. agreed to trial enrollment"
  follow_up_actions: string        // "Schedule follow-up in 2 weeks"
}
```

### WebSocket message format

**Send** (client → server):
```
"Met Dr. Mehta today, positive meeting, shared OncoBoost PDF"
```

**Receive** (server → client):
```json
{
  "message": "Interaction with Dr. Mehta logged successfully. I've noted the positive sentiment and the OncoBoost PDF you shared.",
  "form": {
    "hcp_name": "Dr. Mehta",
    "sentiment": "positive",
    "materials": ["OncoBoost PDF"],
    ...
  }
}
```

<br/>

---

## 🗄️ Data Persistence

| Data | Storage | File | Survives Restart? |
|------|---------|------|-------------------|
| Interaction records | SQLite | `interactions.db` | ✅ Yes |
| Agent conversation memory | SQLite | `agent_memory.db` | ✅ Yes |
| Browser draft | localStorage | Browser | ✅ Yes |
| React in-memory state | RAM | — | ❌ No (re-fetched from `/form`) |

<br/>

---

## 🧠 How the Agent Works

```
User message
     │
     ▼
┌─────────────────────────────┐
│   LangGraph ReAct Loop      │
│                             │
│  1. Read conversation       │
│     history from memory     │
│                             │
│  2. LLM decides:            │
│     → Call log_interaction? │
│     → Call update_field?    │
│     → Just respond?         │
│                             │
│  3. Tool executes           │
│     → SQLite write          │
│                             │
│  4. LLM sees tool result    │
│     → Generates reply       │
│                             │
│  5. Save state to           │
│     agent_memory.db         │
└─────────────────────────────┘
     │
     ▼
{ message: reply, form: latest_row }
     │
     ▼
WebSocket → React → setForm() + chat bubble
```

The key insight: **the system prompt acts as the agent's brain**. Field extraction rules, sentiment classification, and tool selection are all governed by the prompt — not hardcoded logic.

<br/>

---

## 🎨 UI Features

- **Two-panel layout** — form left, AI chat right
- **Tag-chip input** for attendees — press `Enter` or `,` to add, `Backspace` to remove
- **Sentiment pills** — clickable Positive / Neutral / Negative with color coding
- **AI suggested follow-ups** — click any suggestion to append it to the actions field
- **Animated typing indicator** — three bouncing dots while AI responds
- **Toast notifications** — green (success), blue (draft saved), red (error)
- **Form validation** — red highlights on required fields before submit
- **Draft persistence** — `Save Draft` stores to `localStorage`, auto-restored on next visit
- **Auto-scroll** — chat always scrolls to latest message
- **Keyboard shortcuts** — `Enter` to send, `Shift+Enter` for newline

<br/>

---

## 🔧 Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Groq API key | `main.py` → `api_key` | `"api"` |
| LLM model | `main.py` → `model=` | `"llama-3.1-8b-instant"` |
| Backend URL | `App.tsx` → axios/WebSocket URLs | `localhost:8000` |
| DB file names | `main.py` | `interactions.db`, `agent_memory.db` |
| Thread ID (per user) | `main.py` → `thread_id` | `"user_1"` |

<br/>

---

## 🚧 Known Limitations & Future Improvements

- [ ] **Multi-user support** — currently uses a single `thread_id: "user_1"`. Add auth + per-user thread IDs for production.
- [ ] **Voice input** — the "Summarize from Voice Note" button is a UI placeholder. Connect to Whisper API for real transcription.
- [ ] **Search/autocomplete** — HCP name field could search an existing doctor database.
- [ ] **History view** — `GET /interactions` endpoint exists but no UI for browsing past interactions.
- [ ] **Export** — add CSV/PDF export of interaction history.
- [ ] **Docker** — containerise backend + frontend for one-command deployment.

<br/>

---

## 📦 Dependencies

### Backend (`requirements.txt`)

```txt
fastapi
uvicorn[standard]
langchain-groq
langgraph
langgraph-checkpoint-sqlite
pydantic
python-dotenv
```

### Frontend

```txt
react@18
react-dom@18
typescript
axios
```

No UI component libraries — the entire design system is custom CSS-in-JS.

<br/>

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/voice-transcription`
3. Commit your changes — `git commit -m 'Add Whisper voice transcription'`
4. Push to the branch — `git push origin feature/voice-transcription`
5. Open a Pull Request

<br/>

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

<br/>

---

<div align="center">

**Built with** ❤️ **using LangGraph, FastAPI, and React**

*"The best CRM is the one your team actually uses."*

<br/>

[![Star this repo](https://img.shields.io/github/stars/yourusername/pharma-crm-ai?style=social)](https://github.com/yourusername/pharma-crm-ai)

</div>
