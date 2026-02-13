# KaiZen Flow — API & MCP Manual

## ภาพรวม

KaiZen Flow รองรับการจัดการ Tasks, Sprints และ Kaizen Logs ผ่าน 2 ช่องทาง:

1. **REST API** — สำหรับ external scripts, webhooks, n8n, etc.
2. **MCP Server** — สำหรับ AI agents (Cursor, Claude, etc.)

---

## 🔑 Authentication

ทุก request จากภายนอกต้องมี `X-API-Key` header:

```
X-API-Key: kzf_a7x9m2p4q8w1e5r3t6y0
```

> **หมายเหตุ:** Health check (`/api/health`) และ SSE events (`/api/events`) ไม่ต้องใช้ API key

---

## 📡 REST API

Base URL: `http://<VPS-IP>/api`

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | ดึงรายการ tasks ทั้งหมด |
| GET | `/api/tasks/:id` | ดึง task เดียว |
| POST | `/api/tasks` | สร้าง task ใหม่ |
| PUT | `/api/tasks/:id` | อัพเดท task |
| DELETE | `/api/tasks/:id` | ลบ task |
| POST | `/api/tasks/reorder` | เรียงลำดับ tasks ใหม่ |

#### ตัวอย่าง: สร้าง Task

```bash
curl -X POST http://<VPS-IP>/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kzf_a7x9m2p4q8w1e5r3t6y0" \
  -d '{"title": "ทำ Report Q4", "bucket": "deadline"}'
```

#### ตัวอย่าง: อัพเดท Task

```bash
curl -X PUT http://<VPS-IP>/api/tasks/5 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kzf_a7x9m2p4q8w1e5r3t6y0" \
  -d '{"bucket": "urgent", "is_daily_highlight": true}'
```

#### ตัวอย่าง: Complete Task

```bash
curl -X PUT http://<VPS-IP>/api/tasks/5 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kzf_a7x9m2p4q8w1e5r3t6y0" \
  -d '{"is_completed": true}'
```

#### ตัวอย่าง: ลบ Task

```bash
curl -X DELETE http://<VPS-IP>/api/tasks/5 \
  -H "X-API-Key: kzf_a7x9m2p4q8w1e5r3t6y0"
```

---

### Sprints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sprints/active` | ดู sprint ที่กำลังทำงาน |
| GET | `/api/sprints/history` | ดูประวัติ sprints |
| POST | `/api/sprints/start` | เริ่ม sprint |
| POST | `/api/sprints/stop` | หยุด sprint |

#### ตัวอย่าง: เริ่ม Sprint

```bash
curl -X POST http://<VPS-IP>/api/sprints/start \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kzf_a7x9m2p4q8w1e5r3t6y0" \
  -d '{"bucket": "creative"}'
```

---

### Kaizen Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kaizen-logs` | ดู logs (default 50) |
| GET | `/api/kaizen-logs/stats` | ดูสถิติ mood/bucket |
| POST | `/api/kaizen-logs` | บันทึก kaizen log |
| DELETE | `/api/kaizen-logs/:id` | ลบ log |

#### ตัวอย่าง: บันทึก Kaizen Log

```bash
curl -X POST http://<VPS-IP>/api/kaizen-logs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: kzf_a7x9m2p4q8w1e5r3t6y0" \
  -d '{
    "bucket": "urgent",
    "mood": "flow",
    "duration_seconds": 1500,
    "notes": "ทำ report เสร็จแล้ว สมาธิดีมาก"
  }'
```

Mood values: `flow`, `okay`, `drained`

---

### Health & Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | ❌ | ดูสถานะ DB diagnostic |
| GET | `/api/events` | ❌ | SSE stream (real-time events) |

---

## 🤖 MCP Server

### Endpoint

```
http://<VPS-IP>/mcp
```

Transport: **Streamable HTTP**

### ตั้งค่าใน Cursor

เพิ่มใน `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kaizen-flow": {
      "url": "http://<VPS-IP>/mcp"
    }
  }
}
```

### ตั้งค่าใน Claude Desktop

เพิ่มใน `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kaizen-flow": {
      "url": "http://<VPS-IP>/mcp"
    }
  }
}
```

### MCP Tools (16 tools)

#### Basic Tools (1-10)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_tasks` | `bucket?`, `show_completed?` | ดูรายการ tasks |
| `create_task` | `title`, `bucket?`, `estimated_duration?`, `energy_level?`, `priority_type?` | สร้าง task |
| `update_task` | `id`, `title?`, `bucket?`, `is_daily_highlight?`, `sort_order?` | แก้ไข task |
| `complete_task` | `id`, `is_completed?` | Complete/uncomplete task |
| `delete_task` | `id` | ลบ task |
| `start_sprint` | `bucket` | เริ่ม sprint |
| `stop_sprint` | — | หยุด sprint |
| `get_active_sprint` | — | ดู active sprint |
| `create_kaizen_log` | `bucket`, `mood`, `duration_seconds?`, `notes?` | บันทึก log |
| `get_health` | — | ดูสถานะ server |

#### OpenClaw Integration Tools (11-16)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_adhd_state` | — | **CALL FIRST** — ดู context ปัจจุบัน (sprint, energy, streaks, recommendations) |
| `plan_day_for_user` | `goals[]?`, `energy_level?`, `available_hours?` | สร้าง daily plan แบบ ADHD-friendly |
| `start_structured_sprint` | `bucket`, `task_ids?[]`, `target_minutes?`, `goal?` | เริ่ม sprint พร้อม auto-select tasks |
| `log_distraction` | `source`, `description?`, `capture_as_task?` | บันทึก distraction (parking lot) |
| `summarize_today` | `period?` (today/week/month) | สรุป productivity + insights |
| `get_focus_recommendation` | `energy?`, `available_minutes?` | AI แนะนำว่าควรทำอะไรต่อ |

### Bucket Values

| Bucket | คำอธิบาย |
|--------|----------|
| `unsorted` | ยังไม่จัด |
| `urgent` | เร่งด่วน |
| `deadline` | มี deadline |
| `admin` | งานบริหาร |
| `creative` | งาน creative |

---

## 🧠 ADHD API (OpenClaw Integration)

เพิ่มเติมสำหรับ AI Agent integration — ให้ OpenClaw หรือ AI อื่นเรียกใช้

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adhd/state` | ดู context ปัจจุบัน (sprint, energy, streaks) |
| POST | `/api/adhd/plan-day` | สร้าง daily plan |
| POST | `/api/adhd/distraction` | บันทึก distraction |
| GET | `/api/adhd/summary?period=today` | สรุป productivity |
| GET | `/api/adhd/focus-recommendation` | แนะนำว่าควรทำอะไรต่อ |
| POST | `/api/adhd/sprint/start` | เริ่ม structured sprint |

### GET /api/adhd/state

**Response:**
```json
{
  "current_sprint": { "id": 1, "bucket": "creative", "elapsed_seconds": 1200 },
  "energy_profile": {
    "current_hour": 10,
    "suggested_energy": "high",
    "is_guard_rail_time": false
  },
  "today_summary": {
    "tasks_completed": 3,
    "time_spent_seconds": 7200,
    "sprints_count": 2
  },
  "streaks": { "daily_plan": 5, "sprint_complete": 3 },
  "pending_tasks": { "urgent_count": 2, "parking_lot_count": 4 },
  "recommendations": ["Start with a quick win", "You have 2 urgent tasks"]
}
```

### POST /api/adhd/plan-day

**Request:**
```json
{
  "goals": ["Finish presentation", "Exercise"],
  "energy_profile": "high",
  "available_minutes": 360
}
```

**Response:**
```json
{
  "plan_id": 1,
  "plan_date": "2024-02-14",
  "scheduled_blocks": [
    {
      "time_slot": "09:00-12:00",
      "bucket": "urgent",
      "tasks": [{ "id": 1, "title": "Task 1", "estimated_duration": 30 }],
      "total_minutes": 90
    }
  ],
  "total_planned_minutes": 180,
  "buffer_minutes": 60,
  "warnings": [],
  "tips": ["Start with a quick win"]
}
```

### POST /api/adhd/distraction

**Request:**
```json
{
  "source": "thought",
  "description": "need to buy groceries",
  "capture_as_task": true
}
```

**Response:**
```json
{
  "distraction_id": 1,
  "captured_task": { "id": 15, "title": "need to buy groceries" },
  "encouragement": "Good catch! Now back to focus.",
  "focus_reminder": "You were working on: Creative Sprint"
}
```

### GET /api/adhd/focus-recommendation

**Response:**
```json
{
  "recommended_action": "start_sprint",
  "if_start_sprint": {
    "suggested_bucket": "urgent",
    "suggested_tasks": [
      { "id": 1, "title": "Task 1", "estimated_duration": 30, "reason": "Quick win" }
    ],
    "estimated_total_minutes": 45
  },
  "reasoning": "Based on your energy level and pending tasks.",
  "alternative_actions": ["Take a 5-minute break first"]
}
```

### New Task Fields

| Field | Type | Description |
|-------|------|-------------|
| `dopamine_score` | 0-3 | 0=Boring, 3=Exciting |
| `friction_level` | low/medium/high | ความยากในการเริ่ม |
| `environment` | home/clinic/cafe/anywhere | Best location |
| `deadline_at` | DATETIME | Hard deadline |
| `tags` | JSON array | Tag strings |

---

## 📡 SSE Real-time Events

เมื่อ task/sprint ถูกเปลี่ยนแปลง (จาก web หรือ MCP) จะ broadcast event ไปยังทุก client:

```bash
curl -N http://<VPS-IP>/api/events
```

Event types:

| Event | Trigger |
|-------|---------|
| `task_created` | สร้าง task ใหม่ |
| `task_updated` | แก้ไข/complete task |
| `task_deleted` | ลบ task |
| `tasks_reordered` | เรียงลำดับใหม่ |
| `sprint_started` | เริ่ม sprint |
| `sprint_stopped` | หยุด sprint |
| `kaizen_log_created` | บันทึก log |
| `kaizen_log_deleted` | ลบ log |

---

## 🔒 Security Notes

- API Key ตั้งค่าใน `docker-compose.yml` → env var `API_KEY`
- Frontend (localhost) ไม่ต้องใช้ key
- MCP ยังไม่มี auth ในตัว — ถ้าต้องการเพิ่มให้ใช้ reverse proxy
- เปลี่ยน API Key ได้โดยแก้ `docker-compose.yml` แล้ว rebuild

---

## 🦎 OpenClaw Integration

### MCP Config สำหรับ OpenClaw

เพิ่มใน OpenClaw MCP configuration:

```json
{
  "mcpServers": {
    "kaizen-flow": {
      "url": "http://<VPS-IP>:3080/mcp",
      "transport": "streamable-http",
      "description": "KaiZen Flow - Executive Function Engine for ADHD"
    }
  }
}
```

### System Prompt Guidelines

เพิ่มใน OpenClaw system prompt:

```
You have access to KaiZen Flow - an ADHD-friendly task management system.

## Best Practices:
1. ALWAYS call `get_adhd_state` first to understand user context
2. Keep messages SHORT (ADHD-friendly)
3. One decision at a time
4. Use emojis for visual anchoring
5. Celebrate small wins
6. Never shame for incomplete tasks

## Key Tools:
- `get_adhd_state` - Check current context (CALL FIRST)
- `plan_day_for_user` - Morning activation
- `start_structured_sprint` - Focus sessions
- `log_distraction` - Capture wandering thoughts
- `summarize_today` - End-of-day review
- `get_focus_recommendation` - "What should I do next?"
```

### Telegram Flow Examples

**Morning Activation:**
```
User: "สวัสดีตอนเช้า"
Bot: 🌅 Good morning! Day 5 streak!
     How's your energy? ⚡High 🔋Normal 😴Low
```

**Focus Sprint:**
```
User: "อยากทำงาน"
Bot: 🎯 Suggestion: Creative Sprint (45m)
     1. Design logo (~30m)
     2. Sketch wireframe (~15m)
     Start now?
```

**Distraction Capture:**
```
User: "คิดถึงเรื่องต้องซื้อของ"
Bot: 🅿️ Captured to Parking Lot: "ซื้อของ"
     You were on: Creative Sprint
     Ready to refocus?
```
