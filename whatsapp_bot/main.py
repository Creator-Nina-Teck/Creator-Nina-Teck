import os
import random
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Query, Request

load_dotenv()

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
ADMIN_BROADCAST_NUMBERS = [
    number.strip()
    for number in os.getenv("WHATSAPP_ADMIN_NUMBERS", "").split(",")
    if number.strip()
]
WEBHOOK_SECRET = os.getenv("WHATSAPP_WEBHOOK_SECRET", "")
DAILY_POST_HOUR_UTC = int(os.getenv("DAILY_POST_HOUR_UTC", "7"))
DB_PATH = Path(os.getenv("BOT_DB_PATH", "study_bot.db"))

app = FastAPI(title="WhatsApp Study Bot")

DAILY_DROPS = {
    "monday": {
        "title": "📘 Mathematics Monday",
        "topic": "Quadratic Equations",
        "tip": "Factor first before using formula.",
        "practice": ["Solve x² - 5x + 6 = 0", "Find roots of x² + x - 12 = 0"],
    },
    "tuesday": {
        "title": "📘 Chemistry Tuesday",
        "topic": "Balancing Equations",
        "tip": "Balance metals first, oxygen last.",
        "practice": ["__ + O2 -> Fe2O3", "C3H8 + O2 -> CO2 + H2O"],
    },
    "wednesday": {
        "title": "📘 Physics Wednesday",
        "topic": "Speed, Distance, Time",
        "tip": "Always keep units consistent.",
        "practice": ["A car covers 150km in 3h. Find speed.", "Find distance if v=20m/s for 30s."],
    },
}

QUIZ_BANK = {
    "chemistry": [
        {
            "q": "What is the valency of oxygen?",
            "options": ["A) 1", "B) 2", "C) 3", "D) 4"],
            "answer": "B",
            "explain": "Oxygen needs 2 electrons to complete octet.",
        }
    ],
    "math": [
        {
            "q": "If 2x + 3 = 11, x = ?",
            "options": ["A) 3", "B) 4", "C) 5", "D) 6"],
            "answer": "B",
            "explain": "2x = 8, so x = 4.",
        }
    ],
}

RESOURCE_LIBRARY = {
    "notes chemistry": "Chem notes: https://example.com/chem-notes.pdf",
    "formula physics": "Physics formulas: https://example.com/physics-formula-sheet.pdf",
    "waec pastquestions": "WAEC past questions: https://example.com/waec-past-questions",
}

REVISION_PROMPTS = [
    "⚡ QUICK REVISION: What is the valency of oxygen?",
    "⚡ QUICK REVISION: State one difference between speed and velocity.",
    "⚡ QUICK REVISION: Expand (x + 3)(x - 2).",
]


def db_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = db_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS student_stats (
          phone TEXT PRIMARY KEY,
          quizzes_completed INTEGER NOT NULL DEFAULT 0,
          questions_asked INTEGER NOT NULL DEFAULT 0,
          helpful_answers INTEGER NOT NULL DEFAULT 0,
          last_active_date TEXT,
          streak_count INTEGER NOT NULL DEFAULT 0
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS bot_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def get_or_create_user(phone: str) -> sqlite3.Row:
    conn = db_conn()
    conn.execute("INSERT OR IGNORE INTO student_stats(phone) VALUES (?)", (phone,))
    conn.commit()
    row = conn.execute("SELECT * FROM student_stats WHERE phone = ?", (phone,)).fetchone()
    conn.close()
    return row


def mark_active(phone: str) -> None:
    today = datetime.now(UTC).date().isoformat()
    row = get_or_create_user(phone)
    last_active = row["last_active_date"]
    streak = row["streak_count"]

    if last_active == today:
        return

    if last_active:
        last_dt = datetime.fromisoformat(last_active).date()
        diff_days = (datetime.now(UTC).date() - last_dt).days
        streak = streak + 1 if diff_days == 1 else 1
    else:
        streak = 1

    conn = db_conn()
    conn.execute(
        "UPDATE student_stats SET last_active_date = ?, streak_count = ? WHERE phone = ?",
        (today, streak, phone),
    )
    conn.commit()
    conn.close()


def increment_stat(phone: str, field: str) -> None:
    if field not in {"quizzes_completed", "questions_asked", "helpful_answers"}:
        return
    get_or_create_user(phone)
    conn = db_conn()
    conn.execute(f"UPDATE student_stats SET {field} = {field} + 1 WHERE phone = ?", (phone,))
    conn.commit()
    conn.close()


def streak_text(phone: str) -> str:
    row = get_or_create_user(phone)
    return (
        f"🔥 Your study streak: {row['streak_count']} day(s)\n"
        f"✅ Quizzes completed: {row['quizzes_completed']}\n"
        f"❓ Questions asked: {row['questions_asked']}"
    )


def extract_incoming_message(payload: dict[str, Any]) -> tuple[str, str] | None:
    try:
        value = payload["entry"][0]["changes"][0]["value"]
        messages = value.get("messages", [])
        if not messages:
            return None
        message = messages[0]
        sender = message["from"]
        if message.get("type") != "text":
            return sender, ""
        text = message["text"]["body"].strip()
        return sender, text
    except (KeyError, IndexError, TypeError):
        return None


def format_daily_drop(day_name: str) -> str:
    entry = DAILY_DROPS.get(day_name.lower(), DAILY_DROPS["monday"])
    practice = "\n".join([f"{idx+1}. {q}" for idx, q in enumerate(entry["practice"])])
    return (
        f"{entry['title']}\n"
        f"Topic: {entry['topic']}\n"
        f"Mini tip: {entry['tip']}\n"
        f"Practice:\n{practice}\n"
        "Challenge: Explain one concept to a classmate today."
    )


def build_help_thread_prompt(topic: str) -> str:
    return (
        f"🧵 Help Request: {topic}\n"
        "Everyone, keep replies focused on this topic only.\n"
        "Helpers/admins please respond with clear step-by-step explanation."
    )


def handle_command(phone: str, text: str) -> str:
    lower = text.lower()
    mark_active(phone)

    if lower.startswith("/quiz"):
        parts = lower.split()
        subject = parts[1] if len(parts) > 1 else "chemistry"
        quiz_set = QUIZ_BANK.get(subject)
        if not quiz_set:
            return "No quiz found for that subject yet. Try /quiz chemistry or /quiz math"
        q = random.choice(quiz_set)
        increment_stat(phone, "quizzes_completed")
        options = "\n".join(q["options"])
        return (
            f"🧠 Timed Quiz ({subject.title()})\n"
            f"{q['q']}\n{options}\n\n"
            f"Answer: {q['answer']}\n"
            f"Explanation: {q['explain']}"
        )

    if lower.startswith("/help"):
        topic = text[5:].strip() or "General question"
        increment_stat(phone, "questions_asked")
        return build_help_thread_prompt(topic)

    if lower.startswith("/streak"):
        return streak_text(phone)

    if lower.startswith("/notes") or lower.startswith("/formula") or lower.startswith("/waec"):
        command_key = lower[1:]
        resource = RESOURCE_LIBRARY.get(command_key)
        if resource:
            return f"📚 Resource:\n{resource}"
        return "No resource matched exactly. Try: /notes chemistry, /formula physics, /waec pastquestions"

    if lower.startswith("/simple"):
        topic = text[7:].strip() or "this topic"
        return (
            f"🧒 Explain like SS1: {topic}\n"
            "Think of chemistry like cooking. Ingredients are atoms. "
            "A reaction is just rearranging ingredients to make something new."
        )

    if lower.startswith("/revision"):
        return random.choice(REVISION_PROMPTS)

    if lower.startswith("/remind"):
        custom = text[7:].strip() or "WAEC Chemistry in 12 days. Today's focus: Organic Chemistry."
        return f"⏰ Study Reminder:\n{custom}"

    if lower.startswith("/daily"):
        weekday = datetime.now(UTC).strftime("%A").lower()
        return format_daily_drop(weekday)

    return (
        "Hi 👋 I can help with study flow.\n"
        "Commands:\n"
        "/daily, /quiz <subject>, /help <topic>, /streak, /notes chemistry,\n"
        "/formula physics, /waec pastquestions, /simple <topic>, /revision, /remind <text>"
    )


async def send_whatsapp_text(to: str, text: str) -> None:
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        raise HTTPException(status_code=500, detail="Missing WhatsApp API credentials")

    url = f"https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
    data = {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": text[:4096]}}

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(url, headers=headers, json=data)

    if response.status_code >= 300:
        raise HTTPException(status_code=502, detail=f"WhatsApp API error: {response.status_code} {response.text}")


@app.on_event("startup")
async def on_startup() -> None:
    init_db()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
) -> str:
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed")


@app.post("/webhook")
async def receive_webhook(request: Request, x_hub_signature_256: str | None = Header(default=None)) -> dict[str, bool]:
    if WEBHOOK_SECRET and not x_hub_signature_256:
        raise HTTPException(status_code=401, detail="Missing webhook signature")

    payload = await request.json()
    incoming = extract_incoming_message(payload)
    if not incoming:
        return {"ok": True}

    sender, text = incoming
    if not text:
        return {"ok": True}

    reply = handle_command(sender, text)
    await send_whatsapp_text(sender, reply)
    return {"ok": True}


@app.post("/broadcast/daily")
async def broadcast_daily_drop() -> dict[str, Any]:
    if not ADMIN_BROADCAST_NUMBERS:
        return {"ok": False, "reason": "No WHATSAPP_ADMIN_NUMBERS configured"}

    message = format_daily_drop(datetime.now(UTC).strftime("%A").lower())
    sent = 0
    for number in ADMIN_BROADCAST_NUMBERS:
        await send_whatsapp_text(number, message)
        sent += 1

    conn = db_conn()
    conn.execute(
        "INSERT INTO bot_state(key, value) VALUES('last_daily_broadcast_utc', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (datetime.now(UTC).isoformat(),),
    )
    conn.commit()
    conn.close()

    return {"ok": True, "sent": sent}


@app.get("/scheduler/status")
async def scheduler_status() -> dict[str, Any]:
    now = datetime.now(UTC)
    conn = db_conn()
    row = conn.execute("SELECT value FROM bot_state WHERE key = 'last_daily_broadcast_utc'").fetchone()
    conn.close()
    return {
        "ok": True,
        "daily_post_hour_utc": DAILY_POST_HOUR_UTC,
        "last_daily_broadcast_utc": row["value"] if row else None,
        "current_utc": now.isoformat(),
    }
