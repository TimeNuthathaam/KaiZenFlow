# 🚀 Kaizen Flow - Deployment Checklist

> สรุปขั้นตอน Deploy ไป VPS ด้วย Docker

---

## ✅ Pre-Deployment Checklist

### 📁 Files ที่ต้องมี (✅ = มีแล้ว)

| File | Status | Description |
|------|--------|-------------|
| `.gitignore` | ✅ | ป้องกัน secrets ไม่ขึ้น Git |
| `.env.example` | ✅ | Template สำหรับ config |
| `Dockerfile` | ✅ | Build image |
| `docker-compose.yml` | ✅ | Production setup |
| `USER_GUIDE.md` | ✅ | คู่มือใช้งาน |
| `server/OPENCLAW_INTEGRATION.md` | ✅ | คู่มือ OpenClaw |

---

## 📋 Deployment Steps

### Step 1: เตรียม Repository

```bash
cd "c:\Users\timen\Downloads\KaiZen FLow"

# Init git
git init
git add .
git commit -m "Initial commit: Kaizen Flow v2.0 with ADHD UX"

# Push to remote
git remote add origin <YOUR_GIT_URL>
git push -u origin main
```

---

### Step 2: เตรียม VPS

```bash
# SSH เข้า VPS
ssh user@your-vps-ip

# Clone repository
git clone <YOUR_GIT_URL> kaizen-flow
cd kaizen-flow

# สร้าง .env จาก template
cp .env.example .env
nano .env  # แก้ไขค่าจริง
```

---

### Step 3: แก้ไข .env บน VPS

```env
# MariaDB - ใช้ค่าจาก howToGeToMariadb.txt
DB_HOST=76.13.182.75
DB_PORT=32781
DB_USER=myapp_user
DB_PASSWORD=narq87pf5Jt9vcSF5BiLPm940b9OwN2Z
DB_NAME=myapp

# OpenClaw - ใส่ token ที่สร้าง
OPENCLAW_URL=http://host.docker.internal:18789/hooks/wake
OPENCLAW_TOKEN=your_secret_token
```

---

### Step 4: Build & Run

```bash
# Build และ run
docker-compose up -d --build

# ดู logs
docker-compose logs -f

# ตรวจสอบ status
docker-compose ps
```

---

### Step 5: ตรวจสอบการทำงาน

```bash
# ทดสอบ API
curl http://localhost:3001/api/health

# ทดสอบ Frontend
curl http://localhost:80
```

---

## 🔧 Environment Variables Summary

| Variable | Description | ตัวอย่าง |
|----------|-------------|---------|
| `DB_HOST` | MariaDB IP | `76.13.182.75` |
| `DB_PORT` | MariaDB Port | `32781` |
| `DB_USER` | Database user | `myapp_user` |
| `DB_PASSWORD` | Database password | `secret` |
| `DB_NAME` | Database name | `myapp` |
| `OPENCLAW_URL` | Webhook endpoint | `http://host.docker.internal:18789/hooks/wake` |
| `OPENCLAW_TOKEN` | Auth token | `your_token` |

---

## 🐳 Docker Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f kaizen-flow

# Shell into container
docker exec -it kaizen-flow sh
```

---

## 🔌 Ports

| Port | Service |
|------|---------|
| 80 | Frontend (Vite built) |
| 3001 | Backend API |

---

## ⚠️ Troubleshooting

### MariaDB Connection Failed
```bash
# ตรวจสอบว่า container เห็น MariaDB ได้
docker exec kaizen-flow ping -c 3 76.13.182.75
```

### OpenClaw Connection Failed
```bash
# ลอง URL แบบอื่น (Linux)
OPENCLAW_URL=http://172.17.0.1:18789/hooks/wake
```

### Port 80 ถูกใช้งาน
```yaml
# docker-compose.yml - เปลี่ยน port
ports:
  - "8080:80"  # ใช้ 8080 แทน
```

---

## 📊 Project Structure (Final)

```
KaiZen FLow/
├── 📁 src/                      # React Frontend
├── 📁 server/                   # Express Backend
│   ├── 📁 routes/               # API routes
│   ├── 📁 services/             # OpenClaw service
│   ├── index.js
│   ├── db.js
│   └── .env                     # ⚠️ ไม่ขึ้น Git!
├── .gitignore                   # ✅
├── .env.example                 # ✅ Template
├── Dockerfile                   # ✅
├── docker-compose.yml           # ✅
├── USER_GUIDE.md                # ✅
└── DEPLOY_CHECKLIST.md          # ✅ (นี่แหละ!)
```

---

## ✅ Final Checklist ก่อน Deploy

- [ ] ลบ `server/.env` ออกจาก Git (ถ้ามี)
- [ ] สร้าง `.env` บน VPS จาก `.env.example`
- [ ] ใส่ค่า `DB_PASSWORD` จริง
- [ ] ใส่ค่า `OPENCLAW_TOKEN` จริง
- [ ] ตรวจสอบ MariaDB firewall เปิด port
- [ ] ตรวจสอบ OpenClaw รัน port 18789
- [ ] `docker-compose up -d --build`
- [ ] ทดสอบ `curl localhost:3001/api/health`

---

🎉 **พร้อม Deploy แล้ว!**
