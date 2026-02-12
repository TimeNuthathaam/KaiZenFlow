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

### MCP Tools (10 tools)

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_tasks` | `bucket?`, `show_completed?` | ดูรายการ tasks |
| `create_task` | `title`, `bucket?` | สร้าง task |
| `update_task` | `id`, `title?`, `bucket?`, `is_daily_highlight?`, `sort_order?` | แก้ไข task |
| `complete_task` | `id`, `is_completed?` | Complete/uncomplete task |
| `delete_task` | `id` | ลบ task |
| `start_sprint` | `bucket` | เริ่ม sprint |
| `stop_sprint` | — | หยุด sprint |
| `get_active_sprint` | — | ดู active sprint |
| `create_kaizen_log` | `bucket`, `mood`, `duration_seconds?`, `notes?` | บันทึก log |
| `get_health` | — | ดูสถานะ server |

### Bucket Values

| Bucket | คำอธิบาย |
|--------|----------|
| `unsorted` | ยังไม่จัด |
| `urgent` | เร่งด่วน |
| `deadline` | มี deadline |
| `admin` | งานบริหาร |
| `creative` | งาน creative |

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
