import json
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
CONTENT_DIR = Path(os.getenv("BOT_CONTENT_DIR", "content"))

app = FastAPI(title="WhatsApp Study Bot")


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return default


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


def format_daily_drop(day_name: str, daily_drops: dict[str, Any]) -> str:
    fallback = {
        "title": "📘 Daily Study Drop",
        "topic": "[TOPIC_PLACEHOLDER]",
        "tip": "[MINI_TIP_PLACEHOLDER]",
        "practice": ["[PRACTICE_QUESTION_1]", "[PRACTICE_QUESTION_2]"],
        "challenge": "[CHALLENGE_PROMPT_PLACEHOLDER]",
    }
    entry = daily_drops.get(day_name.lower(), fallback)
    practice = "\n".join([f"{idx+1}. {q}" for idx, q in enumerate(entry.get("practice", []))])
    return (
        f"{entry.get('title', fallback['title'])}\n"
        f"Topic: {entry.get('topic', fallback['topic'])}\n"
        f"Mini tip: {entry.get('tip', fallback['tip'])}\n"
        f"Practice:\n{practice}\n"
        f"Challenge: {entry.get('challenge', fallback['challenge'])}"
    )


def build_help_thread_prompt(topic: str) -> str:
    return (
        f"🧵 Help Request: {topic}\n"
        "Everyone, keep replies focused on this topic only.\n"
        "Helpers/admins please respond with clear step-by-step explanation."
    )


def handle_command(phone: str, text: str, content: dict[str, Any]) -> str:
    lower = text.lower()
    mark_active(phone)

    quiz_bank = content["quiz_bank"]
    resource_library = content["resource_library"]
    revision_prompts = content["revision_prompts"]
    daily_drops = content["daily_drops"]

    if lower.startswith("/quiz"):
        parts = lower.split()
        subject = parts[1] if len(parts) > 1 else "general"
        quiz_set = quiz_bank.get(subject)
        if not quiz_set:
            return "No quiz found yet for that subject. Update content/quizzes.json with your questions."
        q = random.choice(quiz_set)
        increment_stat(phone, "quizzes_completed")
        options = "\n".join(q.get("options", ["[OPTION_A]", "[OPTION_B]", "[OPTION_C]", "[OPTION_D]"]))
        return (
            f"🧠 Timed Quiz ({subject.title()})\n"
            f"{q.get('q', '[QUIZ_QUESTION_PLACEHOLDER]')}\n{options}\n\n"
            f"Answer: {q.get('answer', '[ANSWER_PLACEHOLDER]')}\n"
            f"Explanation: {q.get('explain', '[EXPLANATION_PLACEHOLDER]')}"
        )

    if lower.startswith("/help"):
        topic = text[5:].strip() or "General question"
        increment_stat(phone, "questions_asked")
        return build_help_thread_prompt(topic)

    if lower.startswith("/streak"):
        return streak_text(phone)

    if lower.startswith("/notes") or lower.startswith("/formula") or lower.startswith("/waec"):
        command_key = lower[1:]
        resource = resource_library.get(command_key)
        if resource:
            return f"📚 Resource:\n{resource}"
        return "No resource matched yet. Update content/resources.json placeholders."

    if lower.startswith("/simple"):
        topic = text[7:].strip() or "this topic"
        return (
            f"🧒 Explain like SS1: {topic}\n"
            "[SIMPLE_EXPLANATION_PLACEHOLDER]\n"
            "Example: [SIMPLE_EXAMPLE_PLACEHOLDER]"
        )

    if lower.startswith("/revision"):
        return random.choice(revision_prompts) if revision_prompts else "[REVISION_PROMPT_PLACEHOLDER]"

    if lower.startswith("/remind"):
        custom = text[7:].strip() or "[EXAM_NAME] in [X] days. Today's focus: [TOPIC]."
        return f"⏰ Study Reminder:\n{custom}"

    if lower.startswith("/daily"):
        weekday = datetime.now(UTC).strftime("%A").lower()
        return format_daily_drop(weekday, daily_drops)

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

    content = {
        "daily_drops": load_json(CONTENT_DIR / "daily_drops.json", {}),
        "quiz_bank": load_json(CONTENT_DIR / "quizzes.json", {}),
        "resource_library": load_json(CONTENT_DIR / "resources.json", {}),
        "revision_prompts": load_json(CONTENT_DIR / "revision_prompts.json", []),
    }

    reply = handle_command(sender, text, content)
    await send_whatsapp_text(sender, reply)
    return {"ok": True}


@app.post("/broadcast/daily")
async def broadcast_daily_drop() -> dict[str, Any]:
    if not ADMIN_BROADCAST_NUMBERS:
        return {"ok": False, "reason": "No WHATSAPP_ADMIN_NUMBERS configured"}

    daily_drops = load_json(CONTENT_DIR / "daily_drops.json", {})
    message = format_daily_drop(datetime.now(UTC).strftime("%A").lower(), daily_drops)

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
