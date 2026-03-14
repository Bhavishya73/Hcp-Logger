import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  hcp_name: string;
  date: string;
  time: string;
  interaction_type: string;
  attendees: string[];
  topics: string;
  materials: string[];
  samples: string[];
  sentiment: "positive" | "neutral" | "negative";
  outcomes: string;
  follow_up_actions: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_SUGGESTIONS = [
  "Schedule follow-up meeting in 2 weeks",
  "Send OncoBoost Phase III PDF",
  "Add Dr. Sharma to advisory board invite list",
];

const DEFAULT_FORM: FormData = {
  hcp_name: "",
  date: new Date().toISOString().split("T")[0],
  time: new Date().toTimeString().slice(0, 5),
  interaction_type: "Meeting",
  attendees: [],
  topics: "",
  materials: [],
  samples: [],
  sentiment: "neutral",
  outcomes: "",
  follow_up_actions: "",
};

// ─── Styles (CSS-in-JS via style tag) ─────────────────────────────────────────

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Sora:wght@400;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #f0f2f7;
      --panel: #ffffff;
      --border: #e2e6ef;
      --accent: #4461f2;
      --accent-light: #eef0fd;
      --accent-hover: #3450e0;
      --text-primary: #1a1d2e;
      --text-secondary: #6b7280;
      --text-muted: #9ca3af;
      --positive: #10b981;
      --neutral: #f59e0b;
      --negative: #ef4444;
      --radius: 10px;
    }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      height: 100vh;
      overflow: hidden;
      color: var(--text-primary);
    }

    .hcp-root {
      display: grid;
      grid-template-columns: 1fr 380px;
      height: 100vh;
    }

    /* ── LEFT ── */
    .left-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--panel);
      border-right: 1px solid var(--border);
    }

    .left-header {
      padding: 18px 28px 14px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .left-header h1 {
      font-family: 'Sora', sans-serif;
      font-size: 17px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }

    .left-body {
      flex: 1;
      overflow-y: auto;
      padding: 18px 28px 24px;
    }

    .left-body::-webkit-scrollbar { width: 4px; }
    .left-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

    .section-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 18px;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .form-row:last-child { margin-bottom: 0; }
    .form-row.single { grid-template-columns: 1fr; }

    .field { display: flex; flex-direction: column; gap: 4px; }

    label {
      font-size: 11.5px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    input[type="text"],
    input[type="date"],
    input[type="time"],
    select,
    textarea {
      width: 100%;
      font-family: 'DM Sans', sans-serif;
      font-size: 13.5px;
      color: var(--text-primary);
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 7px;
      padding: 7px 10px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      appearance: none;
      -webkit-appearance: none;
    }

    input:focus, select:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(68,97,242,0.1);
      background: #fff;
    }

    input::placeholder, textarea::placeholder { color: var(--text-muted); }

    textarea { resize: none; line-height: 1.5; }

    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-color: var(--bg);
      padding-right: 28px;
    }

    /* Tag input */
    .tag-input {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 7px;
      padding: 5px 8px;
      min-height: 36px;
      cursor: text;
      transition: border-color 0.15s, background 0.15s;
    }
    .tag-input:focus-within { border-color: var(--accent); background: #fff; box-shadow: 0 0 0 3px rgba(68,97,242,0.1); }
    .tag-input input { border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 13px; background: transparent; color: var(--text-primary); min-width: 80px; flex: 1; padding: 2px; }
    .tag-input input::placeholder { color: var(--text-muted); }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--accent-light);
      color: var(--accent);
      font-size: 11.5px;
      font-weight: 500;
      border-radius: 4px;
      padding: 2px 7px;
    }

    .tag-remove {
      cursor: pointer;
      font-size: 13px;
      line-height: 1;
      opacity: 0.6;
      border: none;
      background: none;
      color: var(--accent);
      padding: 0;
    }
    .tag-remove:hover { opacity: 1; }

    /* Voice button */
    .voice-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: var(--accent);
      background: var(--accent-light);
      border: 1px solid #c7d0fa;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      margin-top: 8px;
      transition: background 0.15s;
    }
    .voice-btn:hover { background: #dde3fc; }

    /* Material area */
    .mat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 7px;
    }

    .mat-label {
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 5px 10px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .add-btn:hover { border-color: var(--accent); color: var(--accent); }

    .material-area {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 7px;
      overflow: hidden;
      margin-bottom: 14px;
    }
    .material-area:last-child { margin-bottom: 0; }

    .material-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 12.5px;
    }
    .material-row:last-child { border-bottom: none; }
    .material-empty { color: var(--text-muted); font-style: italic; }

    /* Sentiment */
    .sentiment-group { display: flex; gap: 8px; flex-wrap: wrap; }

    .sentiment-pill {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1.5px solid var(--border);
      font-size: 12.5px;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--bg);
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }

    .sentiment-pill.positive.active { border-color: #10b981; background: #ecfdf5; color: #10b981; }
    .sentiment-pill.neutral.active  { border-color: #f59e0b; background: #fffbeb; color: #f59e0b; }
    .sentiment-pill.negative.active { border-color: #ef4444; background: #fef2f2; color: #ef4444; }

    /* AI Suggestions */
    .suggestions-box {
      background: var(--accent-light);
      border: 1px solid #c7d0fa;
      border-radius: 8px;
      padding: 11px 14px;
      margin-top: 12px;
    }

    .suggestions-title {
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: var(--accent);
      margin-bottom: 7px;
    }

    .suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12.5px;
      color: #3450e0;
      padding: 3px 0;
      cursor: pointer;
      transition: opacity 0.1s;
    }
    .suggestion-item:hover { text-decoration: underline; opacity: 0.85; }
    .suggestion-arrow { flex-shrink: 0; font-size: 11px; margin-top: 1px; }

    /* Footer */
    .left-footer {
      padding: 12px 28px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-shrink: 0;
    }

    .btn-secondary {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 7px;
      padding: 8px 18px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-secondary:hover { border-color: #bbb; color: var(--text-primary); }

    .btn-primary {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      background: var(--accent);
      border: 1px solid var(--accent);
      border-radius: 7px;
      padding: 8px 22px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: var(--accent-hover); }

    /* ── RIGHT (CHAT) ── */
    .right-panel {
      display: flex;
      flex-direction: column;
      background: #f7f8fc;
      overflow: hidden;
    }

    .chat-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      flex-shrink: 0;
    }

    .ai-avatar {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #4461f2, #7c8ff7);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .chat-header-info h2 {
      font-family: 'Sora', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .chat-header-info p {
      font-size: 11.5px;
      color: var(--text-muted);
    }

    .online-dot {
      width: 7px; height: 7px;
      background: #10b981;
      border-radius: 50%;
      margin-left: auto;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-messages::-webkit-scrollbar { width: 3px; }
    .chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    .msg {
      max-width: 88%;
      animation: fadeUp 0.2s ease;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .msg.assistant { align-self: flex-start; }
    .msg.user      { align-self: flex-end; }

    .msg-label {
      font-size: 10.5px;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 4px;
      padding: 0 2px;
    }

    .msg.user .msg-label { text-align: right; }

    .msg-bubble {
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.55;
    }

    .msg.assistant .msg-bubble {
      background: #fff;
      border: 1px solid var(--border);
      color: var(--text-primary);
      border-bottom-left-radius: 4px;
    }

    .msg.user .msg-bubble {
      background: var(--accent);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .typing-bubble {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 12px 16px;
    }

    .typing-dot {
      width: 6px; height: 6px;
      background: var(--text-muted);
      border-radius: 50%;
      animation: bounce 1.2s infinite ease-in-out;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40%            { transform: scale(1);   opacity: 1; }
    }

    /* Chat input */
    .chat-input-area {
      padding: 10px 14px 12px;
      border-top: 1px solid var(--border);
      background: #fff;
      flex-shrink: 0;
    }

    .chat-input-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 7px 9px;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    }

    .chat-input-row:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(68,97,242,0.08);
      background: #fff;
    }

    .chat-textarea {
      flex: 1;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: var(--text-primary);
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      line-height: 1.4;
      max-height: 80px;
    }

    .chat-textarea::placeholder { color: var(--text-muted); }

    .send-btn {
      width: 32px; height: 32px;
      background: var(--accent);
      border: none;
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }
    .send-btn:hover { background: var(--accent-hover); }
    .send-btn:active { transform: scale(0.93); }
    .send-btn:disabled { background: #c4c9e4; cursor: not-allowed; }

    .hint-text {
      font-size: 10.5px;
      color: var(--text-muted);
      text-align: center;
      margin-top: 7px;
    }
  `}</style>
);

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconMic = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const IconSearch = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconBot = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M12 2v4M8 2h8"/>
    <circle cx="9" cy="16" r="1" fill="white" stroke="none"/>
    <circle cx="15" cy="16" r="1" fill="white" stroke="none"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TagInputProps {
  tags: string[];
  placeholder: string;
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags = [], placeholder, onAdd, onRemove }) => {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && val.trim()) {
      e.preventDefault();
      onAdd(val.trim());
      setVal("");
    } else if (e.key === "Backspace" && !val && tags.length) {
      onRemove(tags.length - 1);
    }
  };

  return (
    <div className="tag-input" onClick={() => ref.current?.focus()}>
      {tags.map((t, i) => (
        <span key={i} className="tag">
          {t}
          <button className="tag-remove" onClick={(e) => { e.stopPropagation(); onRemove(i); }}>×</button>
        </span>
      ))}
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={handleKey}
        placeholder={tags.length === 0 ? placeholder : ""}
      />
    </div>
  );
};

interface MaterialListProps {
  label: string;
  items: string[];
  btnLabel: string;
  onAdd: () => void;
  onRemove: (i: number) => void;
}

const MaterialList: React.FC<MaterialListProps> = ({ label, items = [], btnLabel, onAdd, onRemove }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="mat-header">
      <span className="mat-label">{label}</span>
      <button className="add-btn" onClick={onAdd}>
        {btnLabel === "Search/Add" ? <IconSearch /> : <IconPlus />}
        {btnLabel}
      </button>
    </div>
    <div className="material-area">
      {items.length === 0 ? (
        <div className="material-row material-empty">No {label.toLowerCase()} added</div>
      ) : (
        items.map((item, i) => (
          <div key={i} className="material-row">
            <span>{item}</span>
            <button className="tag-remove" onClick={() => onRemove(i)}>×</button>
          </div>
        ))
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: 'Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "draft"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const fetchForm = useCallback(async () => {
    try {
      const res = await axios.get<Partial<FormData>>("http://localhost:8000/form");
      // Merge with defaults so array fields are never undefined
      setForm(prev => ({
        ...DEFAULT_FORM,
        ...prev,
        ...res.data,
        attendees: Array.isArray(res.data.attendees) ? res.data.attendees : prev.attendees,
        materials: Array.isArray(res.data.materials) ? res.data.materials : prev.materials,
        samples: Array.isArray(res.data.samples) ? res.data.samples : prev.samples,
      }));
    } catch {
      // silently fail in dev; backend may not be running
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    ws.current = new WebSocket("ws://localhost:8000/ws");

    ws.current.onopen = () => console.log("WS connected");

    ws.current.onmessage = (event: MessageEvent) => {
      setIsTyping(false);
      try {
        const payload = JSON.parse(event.data) as { message: string; form?: Partial<FormData> };
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: payload.message, timestamp: new Date() },
        ]);
        if (payload.form && Object.keys(payload.form).length > 0) {
          setForm(prev => ({
            ...DEFAULT_FORM,
            ...prev,
            ...payload.form,
            attendees: Array.isArray(payload.form!.attendees) ? payload.form!.attendees : prev.attendees,
            materials: Array.isArray(payload.form!.materials) ? payload.form!.materials : prev.materials,
            samples:   Array.isArray(payload.form!.samples)   ? payload.form!.samples   : prev.samples,
          }));
        }
      } catch {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: event.data, timestamp: new Date() },
        ]);
      }
    };

    ws.current.onclose = () => {
      console.log("WS closed — reconnecting…");
      setTimeout(connectWebSocket, 2000);
    };

    ws.current.onerror = () => ws.current?.close();
  }, [fetchForm]);

  useEffect(() => {
    fetchForm();
    connectWebSocket();
    // Restore draft if backend has no record
    try {
      const raw = localStorage.getItem("hcp_draft");
      if (raw) {
        const draft = JSON.parse(raw) as FormData & { _savedAt?: string };
        delete (draft as any)._savedAt;
        setForm(prev => ({
          ...DEFAULT_FORM,
          ...draft,
          attendees: Array.isArray(draft.attendees) ? draft.attendees : prev.attendees,
          materials: Array.isArray(draft.materials) ? draft.materials : prev.materials,
          samples:   Array.isArray(draft.samples)   ? draft.samples   : prev.samples,
        }));
      }
    } catch { /* ignore */ }
    return () => ws.current?.close();
  }, []);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("WS not ready");
      return;
    }
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    ws.current.send(text);
    setInput("");
    setIsTyping(true);
    if (chatInputRef.current) chatInputRef.current.style.height = "auto";
  };

  // Form helpers
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const addAttendee = (t: string) => setField("attendees", [...form.attendees, t]);
  const removeAttendee = (i: number) => setField("attendees", form.attendees.filter((_, j) => j !== i));

  const addMaterial = () => {
    const v = prompt("Material name:");
    if (v?.trim()) setField("materials", [...form.materials, v.trim()]);
  };
  const removeMaterial = (i: number) => setField("materials", form.materials.filter((_, j) => j !== i));

  const addSample = () => {
    const v = prompt("Sample name:");
    if (v?.trim()) setField("samples", [...form.samples, v.trim()]);
  };
  const removeSample = (i: number) => setField("samples", form.samples.filter((_, j) => j !== i));

  const appendFollowUp = (text: string) =>
    setField("follow_up_actions", form.follow_up_actions ? form.follow_up_actions + "\n" + text : text);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error" | "draft", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.hcp_name.trim())   errs.hcp_name = "HCP name is required";
    if (!form.date)              errs.date     = "Date is required";
    if (!form.topics.trim())     errs.topics   = "Topics discussed is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit Interaction ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) {
      showToast("error", "Please fill in the required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:8000/interactions", form);
      showToast("success", "✓ Interaction submitted successfully");
      // Clear draft from localStorage if any
      localStorage.removeItem("hcp_draft");
      // Reset form after short delay so user sees the toast
      setTimeout(() => {
        setForm(DEFAULT_FORM);
        setErrors({});
      }, 800);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || "Unknown error";
      showToast("error", `Submission failed: ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Save Draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = () => {
    try {
      localStorage.setItem("hcp_draft", JSON.stringify({ ...form, _savedAt: new Date().toISOString() }));
      showToast("draft", "Draft saved — you can resume anytime");
    } catch {
      showToast("error", "Could not save draft");
    }
  };

  // ── Load Draft on mount ─────────────────────────────────────────────────────
  // (runs once; only loads if form is still at defaults)

  const handleChatKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleChatInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
  };

  return (
    <>
      <GlobalStyles />
      <div className="hcp-root">

        {/* ── LEFT: FORM ── */}
        <div className="left-panel">
          <div className="left-header">
            <h1>Log HCP Interaction</h1>
          </div>

          <div className="left-body">

            {/* Interaction Details */}
            <div className="section-card">
              <div className="section-title">Interaction Details</div>

              <div className="form-row">
                <div className={`field ${errors.hcp_name ? "field-error" : ""}`}>
                  <label>HCP Name</label>
                  <input
                    type="text"
                    placeholder="Search or select HCP..."
                    value={form.hcp_name}
                    onChange={e => { setField("hcp_name", e.target.value); setErrors(p => ({...p, hcp_name: ""})); }}
                  />
                  {errors.hcp_name && <span className="error-msg">{errors.hcp_name}</span>}
                </div>
                <div className="field">
                  <label>Interaction Type</label>
                  <select value={form.interaction_type} onChange={e => setField("interaction_type", e.target.value)}>
                    <option>Meeting</option>
                    <option>Call</option>
                    <option>Email</option>
                    <option>Conference</option>
                    <option>Virtual</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className={`field ${errors.date ? "field-error" : ""}`}>
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => { setField("date", e.target.value); setErrors(p => ({...p, date: ""})); }} />
                  {errors.date && <span className="error-msg">{errors.date}</span>}
                </div>
                <div className="field">
                  <label>Time</label>
                  <input type="time" value={form.time} onChange={e => setField("time", e.target.value)} />
                </div>
              </div>

              <div className="form-row single">
                <div className="field">
                  <label>Attendees</label>
                  <TagInput
                    tags={form.attendees}
                    placeholder="Enter names and press Enter..."
                    onAdd={addAttendee}
                    onRemove={removeAttendee}
                  />
                </div>
              </div>

              <div className="form-row single" style={{ marginBottom: 0 }}>
                <div className="field">
                  <label>Topics Discussed</label>
                  <textarea
                    rows={3}
                    placeholder="Enter key discussion points..."
                    value={form.topics}
                    className={errors.topics ? "field-error" : ""}
                    onChange={e => { setField("topics", e.target.value); setErrors(p => ({...p, topics: ""})); }}
                  />
                  {errors.topics && <span className="error-msg">{errors.topics}</span>}
                  <button className="voice-btn">
                    <IconMic />
                    Summarize from Voice Note (Requires Consent)
                  </button>
                </div>
              </div>
            </div>

            {/* Materials & Samples */}
            <div className="section-card">
              <div className="section-title">Materials Shared / Samples Distributed</div>
              <MaterialList
                label="Materials Shared"
                items={form.materials}
                btnLabel="Search/Add"
                onAdd={addMaterial}
                onRemove={removeMaterial}
              />
              <MaterialList
                label="Samples Distributed"
                items={form.samples}
                btnLabel="Add Sample"
                onAdd={addSample}
                onRemove={removeSample}
              />
            </div>

            {/* Sentiment */}
            <div className="section-card">
              <div className="section-title">Observed / Inferred HCP Sentiment</div>
              <div className="sentiment-group">
                {(["positive", "neutral", "negative"] as const).map(s => (
                  <div
                    key={s}
                    className={`sentiment-pill ${s} ${form.sentiment === s ? "active" : ""}`}
                    onClick={() => setField("sentiment", s)}
                  >
                    {s === "positive" ? "😊" : s === "neutral" ? "😐" : "😟"}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes & Follow-up */}
            <div className="section-card">
              <div className="section-title">Outcomes & Follow-up</div>

              <div className="form-row single">
                <div className="field">
                  <label>Outcomes</label>
                  <textarea
                    rows={2}
                    placeholder="Key outcomes or agreements..."
                    value={form.outcomes}
                    onChange={e => setField("outcomes", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row single" style={{ marginBottom: 0 }}>
                <div className="field">
                  <label>Follow-up Actions</label>
                  <textarea
                    rows={2}
                    placeholder="Enter next steps or tasks..."
                    value={form.follow_up_actions}
                    onChange={e => setField("follow_up_actions", e.target.value)}
                  />
                </div>
              </div>

              <div className="suggestions-box">
                <div className="suggestions-title">✦ AI Suggested Follow-ups</div>
                {AI_SUGGESTIONS.map((s, i) => (
                  <div key={i} className="suggestion-item" onClick={() => appendFollowUp(s)}>
                    <span className="suggestion-arrow">→</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="left-footer">
            <button className="btn-secondary" onClick={handleSaveDraft}>
              💾 Save Draft
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit Interaction"}
            </button>
          </div>
        </div>

        {/* ── RIGHT: CHAT ── */}
        <div className="right-panel">
          <div className="chat-header">
            <div className="ai-avatar"><IconBot /></div>
            <div className="chat-header-info">
              <h2>AI Assistant</h2>
              <p>Log interaction via chat</p>
            </div>
            <div className="online-dot" />
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="msg-label">{m.role === "user" ? "You" : "AI Assistant"}</div>
                <div className="msg-bubble">{m.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="msg assistant">
                <div className="msg-label">AI Assistant</div>
                <div className="msg-bubble">
                  <div className="typing-bubble">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                ref={chatInputRef}
                className="chat-textarea"
                rows={1}
                placeholder="Describe interaction..."
                value={input}
                onChange={handleChatInput}
                onKeyDown={handleChatKey}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!input.trim()}>
                <IconSend />
              </button>
            </div>
            <div className="hint-text">Press Enter to send · Shift+Enter for new line</div>
          </div>
        </div>

      </div>
    </>
  );
};

export default App;