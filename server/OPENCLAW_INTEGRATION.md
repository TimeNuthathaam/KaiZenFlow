# 🤖 OpenClaw + Kaizen Flow Integration Setup

> คู่มือการตั้งค่า OpenClaw เพื่อรับ events จาก Kaizen Flow

---

## 🔄 ภาพรวมการทำงาน

```
┌─────────────────┐         POST /hooks/wake         ┌─────────────┐
│   Kaizen Flow   │ ──────────────────────────────▶ │  OpenClaw   │
│   (Docker)      │     Authorization: Bearer       │  (VPS Host) │
└─────────────────┘                                  └─────────────┘
       ↑                                                    │
       │              (optional callback)                   │
       └────────────────────────────────────────────────────┘
```

---

## 📋 สิ่งที่ต้องเตรียม

| รายการ | ค่าตัวอย่าง |
|--------|------------|
| OpenClaw Port | `18789` |
| Webhook Endpoint | `/hooks/wake` |
| Secret Token | สร้างเอง (แนะนำ 32+ chars) |

---

## 🔧 Step 1: สร้าง Secret Token

```bash
# สร้าง random token
openssl rand -hex 32
```

**Output ตัวอย่าง:**
```
a8f2b4c6d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6
```

---

## 🔧 Step 2: ตั้งค่า OpenClaw

### 2.1 สร้าง Webhook Handler

ใน OpenClaw (ถ้าใช้ n8n-style หรือ custom server):

```javascript
// OpenClaw webhook handler
app.post('/hooks/wake', (req, res) => {
    // 1. ตรวจสอบ Token
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== process.env.KAIZEN_FLOW_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 2. รับ Event
    const { event, data, timestamp, source } = req.body;
    
    console.log(`[Kaizen Flow] Event: ${event}`, data);
    
    // 3. ประมวลผลตาม event type
    switch (event) {
        case 'task_completed':
            handleTaskCompleted(data);
            break;
        case 'sprint_started':
            handleSprintStarted(data);
            break;
        case 'sprint_ended':
            handleSprintEnded(data);
            break;
        case 'guard_rail_triggered':
            handleGuardRail(data);
            break;
    }
    
    res.json({ received: true });
});
```

### 2.2 Environment Variables (OpenClaw)

```env
# OpenClaw .env
KAIZEN_FLOW_TOKEN=a8f2b4c6d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6
```

---

## 🔧 Step 3: ตั้งค่า Kaizen Flow

### 3.1 แก้ไข server/.env

```env
# Kaizen Flow server/.env
OPENCLAW_URL=http://host.docker.internal:18789/hooks/wake
OPENCLAW_TOKEN=a8f2b4c6d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6
```

### 3.2 Docker Networking (สำคัญ!)

| สถานการณ์ | OPENCLAW_URL |
|-----------|--------------|
| Kaizen ใน Docker, OpenClaw นอก (Mac/Win) | `http://host.docker.internal:18789/hooks/wake` |
| Kaizen ใน Docker, OpenClaw นอก (Linux) | `http://172.17.0.1:18789/hooks/wake` |
| ทั้งคู่ใน Docker Compose | `http://openclaw:18789/hooks/wake` |

---

## 📡 ตัวอย่าง Event Payloads

### task_completed
```json
{
    "event": "task_completed",
    "data": {
        "taskId": 42,
        "title": "ส่งรายงานประจำเดือน",
        "bucket": "deadline",
        "isDailyHighlight": true
    },
    "timestamp": "2025-02-09T16:30:00.000Z",
    "source": "kaizen-flow"
}
```

### sprint_ended
```json
{
    "event": "sprint_ended",
    "data": {
        "bucket": "creative",
        "durationSeconds": 2700,
        "mood": "flow",
        "endedAt": "2025-02-09T17:15:00.000Z"
    },
    "timestamp": "2025-02-09T17:15:00.000Z",
    "source": "kaizen-flow"
}
```

### guard_rail_triggered
```json
{
    "event": "guard_rail_triggered",
    "data": {
        "type": "hard_stop_9pm",
        "triggeredAt": "2025-02-09T21:00:00.000Z"
    },
    "timestamp": "2025-02-09T21:00:00.000Z",
    "source": "kaizen-flow"
}
```

---

## 🧪 Step 4: ทดสอบการเชื่อมต่อ

### จาก Kaizen Flow Server:
```bash
# เข้าไปใน Docker container หรือรันจาก server
curl -X POST http://localhost:18789/hooks/wake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"event":"test","data":{"message":"Hello from Kaizen Flow"}}'
```

### Expected Response:
```json
{"received": true}
```

---

## 🔁 (Optional) OpenClaw Callback กลับมา

ถ้าต้องการให้ OpenClaw ส่งข้อมูลกลับมา Kaizen Flow:

### Kaizen Flow Callback Endpoint:
```javascript
// server/index.js - เพิ่ม endpoint
app.post('/api/webhooks/openclaw', (req, res) => {
    const { action, data } = req.body;
    
    // เช่น OpenClaw สั่งให้สร้าง task ใหม่
    if (action === 'create_task') {
        // logic สร้าง task
    }
    
    res.json({ success: true });
});
```

### OpenClaw ยิงกลับมา:
```javascript
fetch('http://kaizen-flow:3001/api/webhooks/openclaw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'create_task',
        data: { title: 'Task จาก AI', bucket: 'admin' }
    })
});
```

---

## 📊 Summary Checklist

- [ ] สร้าง Secret Token (เหมือนกันทั้ง 2 ฝั่ง)
- [ ] ตั้งค่า `OPENCLAW_TOKEN` ใน Kaizen Flow
- [ ] ตั้งค่า `KAIZEN_FLOW_TOKEN` ใน OpenClaw
- [ ] ตรวจสอบ URL ให้ถูกต้องตาม Docker network
- [ ] เปิด port 18789 บน VPS firewall (ถ้าจำเป็น)
- [ ] ทดสอบด้วย curl

---

## ❓ FAQ

**Q: ทำไม connection refused?**
A: ตรวจสอบ Docker network, ลอง `host.docker.internal` หรือ `172.17.0.1`

**Q: ได้ 401 Unauthorized?**
A: Token ไม่ตรงกัน หรือลืม `Bearer ` prefix

**Q: OpenClaw ล่มแล้ว Kaizen พังด้วย?**
A: ไม่พัง! Service มี try-catch ครอบไว้แล้ว แค่ log error

---

🎯 **Token ต้องเหมือนกันทั้ง 2 ฝั่ง!**
