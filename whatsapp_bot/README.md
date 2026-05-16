# WhatsApp Study Bot (V1)

Simple and realistic V1 architecture for a WhatsApp study community:

- **Platform:** WhatsApp group/community
- **Bot stack:** Python + FastAPI
- **Database:** SQLite
- **Core systems:** command handler, quiz engine, daily scheduler support, resource storage, streak tracker

## Placeholder-first content system

The bot now reads editable content files from `whatsapp_bot/content/` so you can fill in your own curriculum:

- `daily_drops.json` → subject/day lesson placeholders
- `quizzes.json` → quiz question bank placeholders
- `resources.json` → notes/formula/past-question link placeholders
- `revision_prompts.json` → quick revision placeholders

If files are incomplete, the bot falls back to safe placeholders instead of crashing.

## Implemented Commands

- `/daily` → daily study drop (topic, tip, practice, challenge)
- `/quiz chemistry` or `/quiz math` → instant quiz + answer + explanation
- `/help stoichiometry` → focused help-thread style prompt
- `/streak` → streak + quiz count + questions asked
- `/notes chemistry`
- `/formula physics`
- `/waec pastquestions`
- `/simple <topic>` → explain like SS1
- `/revision` → random quick revision prompt
- `/remind <text>` → structured reminder message

## API Endpoints

- `GET /health`
- `GET /webhook` (Meta verification)
- `POST /webhook` (incoming messages)
- `POST /broadcast/daily` (sends daily drop to configured numbers)

## Data Model (SQLite)

- `student_stats`
  - phone (PK)
  - quizzes_completed
  - questions_asked
  - helpful_answers
  - last_active_date
  - streak_count
- `bot_state`
  - key (PK)
  - value

## Setup

1. Copy `.env.example` to `.env`
2. Fill in Meta credentials
3. Fill placeholders inside `content/*.json`
4. Install dependencies

```bash
pip install -r requirements.txt
```

5. Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

6. Expose publicly (ngrok/cloudflared), then set webhook URL to:

`https://<public-url>/webhook`

## Daily Scheduler

Use an external scheduler (cron/GitHub Actions/Render cron) to call `POST /broadcast/daily` at your target UTC hour.
