# 📘 KaiZen Flow — คู่มือการใช้งานฉบับเต็ม

> **KaiZen Flow** คือแอปจัดการงานที่ออกแบบมาเพื่อคนที่มีสมาธิสั้น (ADHD) โดยเฉพาะ  
> ใช้หลักการ **Kaizen** — ทำทีละนิด ไม่ต้องสมบูรณ์แบบ ไม่ต้องวางแผนซับซ้อน  
> **แค่ "เท" ความคิดออกมา → จัดตามพลังงาน → โฟกัสทีละ bucket**

---

## สารบัญ

1. [แนวคิดหลัก (Core Concept)](#-แนวคิดหลัก-core-concept)
2. [เริ่มต้นใช้งาน](#-เริ่มต้นใช้งาน)
3. [Brain Dump Zone — เททุกอย่างออกจากหัว](#-brain-dump-zone--เททุกอย่างออกจากหัว)
4. [Energy Buckets — จัดงานตามพลังงาน](#-energy-buckets--จัดงานตามพลังงาน)
5. [Task Card — การจัดการ task แต่ละอัน](#-task-card--การจัดการ-task-แต่ละอัน)
6. [Priority Icons — สัญลักษณ์ความสำคัญ](#-priority-icons--สัญลักษณ์ความสำคัญ)
7. [Sprint Mode — โหมดโฟกัส](#-sprint-mode--โหมดโฟกัส)
8. [Reality Check — ประเมินเวลาแม่นแค่ไหน?](#-reality-check--ประเมินเวลาแม่นแค่ไหน)
9. [Kaizen Log — บันทึกหลังจบ Sprint](#-kaizen-log--บันทึกหลังจบ-sprint)
10. [Distraction Parking Lot — จอดความคิดที่แทรก](#-distraction-parking-lot--จอดความคิดที่แทรก)
11. [Daily Highlight — งานสำคัญสุดของวัน](#-daily-highlight--งานสำคัญสุดของวัน)
12. [Guard Rails — ระบบป้องกันทำงานเกิน](#-guard-rails--ระบบป้องกันทำงานเกิน)
13. [Stats & Review — ดูสถิติ](#-stats--review--ดูสถิติ)
14. [เฉลิมฉลอง — Celebration & Streak](#-เฉลิมฉลอง--celebration--streak)
15. [Drag & Drop — ลากย้าย task](#-drag--drop--ลากย้าย-task)
16. [API สำหรับ Developer](#-api-สำหรับ-developer)
17. [MCP สำหรับ AI Agent](#-mcp-สำหรับ-ai-agent)
18. [การ Deploy](#-การ-deploy)
19. [เทคนิคสำหรับ ADHD](#-เทคนิคสำหรับ-adhd)
20. [FAQ — คำถามที่พบบ่อย](#-faq--คำถามที่พบบ่อย)

---

## 🧠 แนวคิดหลัก (Core Concept)

### ปัญหาของคน ADHD กับ Calendar Blocking

วิธี "จองเวลาล่วงหน้า" ที่คนทั่วไปแนะนำ มักล้มเหลวกับ ADHD เพราะ:
- **พลังงานคาดเดาไม่ได้** — ตื่นมาอาจ flow สุดๆ หรือเหนื่อยมาก
- **ถ้าพลาด 1 slot ก็ล่มทั้งวัน** — ทำให้รู้สึกผิดและเลิกทำหมด
- **Time blindness** — ประเมินเวลาผิดเสมอ (คิดว่า 10 นาที แต่ใช้จริง 45)

### วิธีของ KaiZen Flow

แทนที่จะจัดตามเวลา → **จัดตามพลังงาน**:

```
Brain Dump → จัดเข้า Bucket → Sprint เมื่อพร้อม → Kaizen Log
```

1. **เทออกมาก่อน** — ไม่ต้องคิดว่าทำอะไรก่อน
2. **จัดตามพลังงาน** — ลากเข้า bucket ที่เหมาะกับอารมณ์ตอนนี้
3. **Sprint ทีละ bucket** — โฟกัส 100% กับ bucket เดียว
4. **เรียนรู้จาก pattern** — Kaizen Log บันทึกว่าช่วงไหน flow ที่สุด

---

## 🚀 เริ่มต้นใช้งาน

### เปิดแอป
- **Production**: เข้าที่ URL ที่ deploy ไว้ (เช่น `https://kaizen.yourdomain.com`)
- **Development**: `npm run dev` → เปิด `http://localhost:5173`

### หน้าจอหลัก

เมื่อเปิดแอปจะเห็น:
1. **Header** — ชื่อแอป + ปุ่มดูสถิติ 📊
2. **Brain Dump Zone** — ช่อง input ด้านบน
3. **Energy Buckets** — 5 กล่องจัดงาน (Brain Dump, Urgent, Deadline, Admin, Creative)
4. **Parking Lot** — ปุ่ม 🅿️ ลอยมุมซ้ายล่าง
5. **Streak Badge** — มุมขวาล่าง (ปรากฏเมื่อทำ task ติดกัน ≥2)

---

## 📥 Brain Dump Zone — เททุกอย่างออกจากหัว

### วิธีใช้พื้นฐาน

1. คลิกที่ช่อง input ด้านบนสุด
2. พิมพ์สิ่งที่อยู่ในหัว เช่น `"ตอบอีเมลลูกค้า"`
3. กด **Enter** หรือกดปุ่ม **+** ทางขวา
4. Task จะปรากฏใน **Brain Dump** bucket ทันที

### ตัวเลือกขั้นสูง (Options Panel)

กดปุ่ม **▼** ข้าง input → dropdown จะเปิดตัวเลือก 2 อย่าง:

#### ⏱️ เวลาประเมิน (Estimated Duration)

เลือกว่า task นี้จะใช้เวลาประมาณเท่าไหร่:

| ตัวเลือก | ใช้กับงาน |
|----------|----------|
| **5 นาที** | ตอบแชท, ส่งอีเมลสั้น |
| **15 นาที** | ตอบอีเมลยาว, นัดหมาย |
| **25 นาที** | 1 Pomodoro — งานชิ้นเล็ก |
| **30 นาที** | ประชุมสั้น, draft เอกสาร |
| **45 นาที** | งานวิจัย, เขียนบทความ |
| **60 นาที** | งานใหญ่ที่ต้องโฟกัส |
| **90 นาที** | Deep work session |

> **💡 ทำไมต้องประเมินเวลา?**  
> คน ADHD มักมี "time blindness" — คิดว่างานใช้เวลาน้อยกว่าจริง  
> การประเมินไว้ก่อนจะช่วยให้เรียนรู้ว่าจริงๆ แล้วใช้เวลาเท่าไหร่  
> ระบบจะเปรียบเทียบให้อัตโนมัติใน **Reality Check**

#### ⚡ ระดับพลังงาน (Energy Level)

เลือกว่า task นี้ต้องใช้พลังงานมากแค่ไหน:

| ระดับ | Emoji | ตัวอย่าง |
|-------|-------|----------|
| **Low** | 🔋 | งาน Admin ที่ทำแบบ autopilot ได้ |
| **Medium** | ⚡ | งานที่ต้องคิดบ้างแต่ไม่หนัก |
| **High** | 🔥 | งาน Creative ที่ต้องสมาธิเต็มที่ |

> **💡 เมื่อไหร่ควรตั้ง?**  
> ไม่ต้องตั้งทุก task ก็ได้ — ตั้งเฉพาะเมื่อรู้สึกว่า "อันนี้ต้องใช้พลังเยอะ"  
> จะช่วยเตือนตัวเองว่า "ตอนนี้เหนื่อย ไปทำงาน Low ก่อนดีกว่า"

---

## 🪣 Energy Buckets — จัดงานตามพลังงาน

แทนที่จะจัดตามเวลา → จัดตาม **ประเภทพลังงาน** ที่ต้องใช้

### 5 Buckets

| # | Bucket | Emoji | คำอธิบาย | ใช้เมื่อ |
|---|--------|-------|----------|---------|
| 1 | **Brain Dump** | 🧠 | สิ่งที่ยังไม่จัด | เพิ่ง dump ออกมา ยังไม่ต้องคิด |
| 2 | **Urgent** | 🔥 | ไฟลนก้น | ต้องทำวันนี้ — ไม่ทำมีปัญหา |
| 3 | **Deadline** | 📅 | กันไว้ก่อน | ใกล้ถึงกำหนด ต้องทำเร็วๆ นี้ |
| 4 | **Admin** | 📥 | งานน่าเบื่อ | จ่ายบิล, อีเมล, นัดหมาย |
| 5 | **Creative** | ✨ | งานสนุก | ออกแบบ, เขียน, สร้างสรรค์ |

### วิธีจัดงานเข้า Bucket

- **ลาก (Drag & Drop)**: คลิก task ค้าง → ลากไปยัง bucket ที่ต้องการ → ปล่อย
- task จะย้ายไปทันทีพร้อม animation

### ปุ่มและข้อมูลบน Bucket

แต่ละ bucket แสดง:
- **ชื่อ bucket** + emoji
- **จำนวน task**: เช่น `3/5` = เสร็จ 3 จาก 5
- **ปุ่ม Sprint** (เฉพาะ bucket ที่มี task และไม่ใช่ Brain Dump)
- **ปุ่ม ▼/▲** พับ/ขยาย รายการ task

---

## 🗂️ Task Card — การจัดการ task แต่ละอัน

แต่ละ task card แสดงข้อมูลเหล่านี้:

### ส่วนประกอบ

```
┌──────────────────────────────────────────────┐
│ 🔥  ตอบอีเมลลูกค้า                    ⭐  🗑️ │
│     ⏱️ ~15m  ⚡ Medium  🅿️ Parking Lot       │
└──────────────────────────────────────────────┘
```

| ส่วน | ตำแหน่ง | ฟังก์ชัน |
|------|---------|---------|
| **Priority Icon** | ซ้ายสุด | 🔥⚡🐢 — กดเพื่อเปลี่ยน |
| **ชื่อ Task** | กลาง | ชื่องาน |
| **⭐ Highlight** | ขวา | กดเพื่อตั้ง/ยกเลิก Daily Highlight |
| **🗑️ Delete** | ขวาสุด | กดเพื่อลบ (กดเปิด → กด confirm) |
| **✅ Complete** | ขวา (เมื่อ hover) | วงกลม — กดเพื่อเสร็จ |
| **⏱️ Duration** | แถวล่าง | เวลาประเมิน (ถ้าตั้งไว้) |
| **⚡ Energy** | แถวล่าง | ระดับพลังงาน (ถ้าตั้งไว้) |
| **🅿️ Source** | แถวล่าง | แหล่งที่มา (เช่น Parking Lot) |

### การ Mark Complete

1. กดปุ่ม **วงกลม** ทางซ้ายของ task
2. จะเห็น:
   - ✅ task ถูกขีดทับ (strikethrough)
   - 🎉 confetti animation ยิงออกมา!
   - 🔥 Streak counter +1
3. กดอีกครั้งเพื่อ **uncomplete**

### การลบ Task

1. กดปุ่ม **🗑️** ทางขวา
2. task จะหายไปทันที

---

## 🔥⚡🐢 Priority Icons — สัญลักษณ์ความสำคัญ

### 3 ระดับ Priority

| Icon | ชื่อ | ความหมาย | ใช้เมื่อ |
|------|------|----------|---------|
| 🔥 **Fire** | ด่วน | ด่วน + สำคัญ | ลูกค้ารอ, deadline วันนี้ |
| ⚡ **Bolt** | Quick Win | ทำเร็วได้ (<5 นาที) | ตอบแชท, approve PR, ส่งอีเมลสั้น |
| 🐢 **Turtle** | Deep Work | ต้องใช้เวลา + สมาธิ | เขียนโค้ด, ออกแบบ, วิจัย |

### วิธีใช้

1. กดที่ **priority icon** บน task card  
2. ระบบจะ **cycle** ผ่านตามลำดับ:

```
⭕ (None) → 🔥 Fire → ⚡ Bolt → 🐢 Turtle → ⭕ (None) → ...
```

3. แต่ละครั้งที่กด จะเปลี่ยนเป็นตัวถัดไป
4. สถานะจะ **บันทึกทันที** ลง database

> **💡 เทคนิค ADHD:**  
> เริ่มวันด้วยการ scan ทุก task → กดตั้ง priority  
> ถ้ามี ⚡ Quick Win → ทำก่อน! ช่วยสร้าง momentum ได้เร็ว

---

## 🏃 Sprint Mode — โหมดโฟกัส

Sprint Mode คือ "โหมดเต็มจอ" ที่ช่วยให้โฟกัส 100% กับ bucket เดียว

### วิธีเริ่ม Sprint

1. ไปที่ bucket ที่ต้องการ (เช่น **Urgent**)
2. กดปุ่ม **▶ Sprint** บน header ของ bucket
3. หน้าจอจะเปลี่ยนเป็น **full-screen mode** ทันที

### สิ่งที่เห็นใน Sprint Mode

```
┌─────────────────────────────────────────┐
│         💪 ไปได้เลย! ทำได้!              │  ← ข้อความให้กำลังใจ (สุ่ม)
│                                         │
│     🔥 Urgent Sprint                    │  ← ชื่อ Bucket
│     โฟกัสแค่ bucket นี้ • ทำมาแล้ว 12 นาที │
│                                         │
│         00:12:34                        │  ← Timer (count-up)
│     Time Elapsed (นับขึ้น ไม่ใช่ countdown) │
│                                         │
│     ┌─ Reality Check ─────────────────┐ │
│     │ 📐 ประเมิน           ~45m       │ │  ← แถบสีน้ำเงิน 100%
│     │ ⏱️ ใช้จริง           12:34      │ │  ← แถบสีเขียว (ขยับตาม)
│     │         🏎️ เร็วกว่าที่คิด!       │ │
│     └─────────────────────────────────┘ │
│                                         │
│       ✅ 2 เสร็จแล้ว  |  3 เหลืออยู่     │
│                      |  ~45m ประเมินรวม  │
│                                         │
│   ○ 🔥 ตอบอีเมลลูกค้า      ⏱️ ~15m     │  ← task ที่ต้องทำ
│   ✅ ⚡ ส่ง invoice          ⏱️ ~5m      │  ← task ที่เสร็จแล้ว
│   ○ 🐢 เขียนรายงาน         ⏱️ ~25m     │
│                                         │
│         ■ Stop Sprint                   │  ← ปุ่มหยุด
└─────────────────────────────────────────┘
```

### Feature ใน Sprint Mode

| Feature | รายละเอียด |
|---------|-----------|
| **Count-up Timer** | จับเวลาขึ้นเรื่อยๆ ไม่ใช่ countdown (ลดความกดดัน) |
| **Reality Check** | เปรียบเทียบเวลาประเมินกับเวลาจริง (ถ้าตั้งไว้) |
| **Progress Counter** | แสดงจำนวน task ที่เสร็จ/เหลือ + ประเมินรวม |
| **Task List** | ทำ✅ได้เลยไม่ต้องออกจาก Sprint |
| **Priority Icons** | แสดง 🔥⚡🐢 หน้าชื่อ task |
| **Duration Badges** | แสดง ⏱️ ~Xm ต่อ task |
| **Milestones** | ข้อความให้กำลังใจที่ 15, 25, 45, 60, 90 นาที |
| **ข้อความสุ่ม** | ให้กำลังใจตอนเริ่ม Sprint |

### การหยุด Sprint

1. กดปุ่ม **■ Stop Sprint** ด้านล่าง
2. ถ้าทำมาแล้ว **< 1 นาที** → หยุดทันที
3. ถ้าทำมา **≥ 1 นาที** → popup ถาม:

```
┌──────────────────────────────┐
│ ⚠️ หยุดจริงๆ เหรอ?           │
│                              │
│ คุณทำมาแล้ว 00:12:34!        │
│ 📐 ประเมินไว้ 45m → ⏱️ 12:34 │
│                              │
│ [ ไปต่อ! 💪 ]  [ หยุดเลย ]  │
└──────────────────────────────┘
```

4. กด **ไปต่อ** → กลับ Sprint
5. กด **หยุดเลย** → เปิด Kaizen Log

---

## ⏱️ Reality Check — ประเมินเวลาแม่นแค่ไหน?

### จุดประสงค์

คน ADHD มักมี **Time Blindness** — รู้สึกว่า "แค่ 10 นาที" แต่จริงๆ ใช้ 45 นาที  
Reality Check ช่วยให้เห็นข้อมูลจริง → เรียนรู้ → ประเมินแม่นขึ้นเรื่อยๆ

### ระบบทำงานอย่างไร

1. **ตั้งเวลาประเมิน** ตอนสร้าง task (เช่น task A = 15m, task B = 30m)
2. **เริ่ม Sprint** → ระบบรวมเวลาประเมินทั้งหมด (เช่น 45m)
3. **ระหว่าง Sprint** → แสดงแถบเปรียบเทียบ real-time:
   - แถบน้ำเงิน = เวลาประเมิน (คงที่ 100%)
   - แถบเขียว/แดง = เวลาจริง (ขยับตามนาฬิกา)
4. **หลังจบ Sprint** → Kaizen Log แสดงสรุปความแม่นยำ

### สถานะความแม่นยำ

| สถานะ | เมื่อ | ความหมาย |
|-------|------|----------|
| 🏎️ **เร็วกว่าที่คิด!** | ใช้จริง < 80% ของประเมิน | เก่งมาก! หรืออาจประเมินสูงไป |
| 🎯 **ตรงเป๊ะ!** | ใช้จริง 80-120% ของประเมิน | แม่นยำ! |
| ⏰ **นานกว่าที่คิดนิดหน่อย** | ใช้จริง 120-150% ของประเมิน | ปกติ — ลองเพิ่มเวลาอีกนิด |
| 🐢 **นานกว่าที่คิดมาก!** | ใช้จริง > 150% ของประเมิน | Time blindness — ต้องปรับ |

### สีของแถบเวลาจริง

- **สีเขียว** = ยังอยู่ภายในเวลาประเมิน
- **สีแดง** = เกินเวลาประเมินแล้ว

> **💡 เทคนิค:**  
> ไม่ต้องกังวลถ้าเกินเวลา — จุดประสงค์ไม่ใช่ "ทำให้เสร็จตามเวลา"  
> แต่คือ "เรียนรู้ว่าจริงๆ ใช้เวลาเท่าไหร่" → ครั้งหน้าจะประเมินแม่นขึ้น

---

## 📝 Kaizen Log — บันทึกหลังจบ Sprint

เปิดอัตโนมัติหลังกด Stop Sprint — บันทึก 3 อย่าง:

### 1. ระยะเวลา Sprint

แสดงเวลาที่ทำจริง เช่น `00:12:34` พร้อม emoji ของ bucket

### 2. Reality Check (ถ้ามีเวลาประเมิน)

```
┌──────────────────────────┐
│ 📐 ประเมิน   |  45m      │
│ ⏱️ ใช้จริง    |  38m      │
│                          │
│    🎯 แม่นยำมาก! (16%)   │
└──────────────────────────┘
```

### 3. Mood — รู้สึกอย่างไร?

เลือก 1 จาก 3:

| Mood | Emoji | ความหมาย | คำอธิบาย |
|------|-------|----------|---------|
| **Flow** | 🔥 | ลื่นไหล | ทำได้ไม่สะดุด สนุก |
| **Okay** | 😐 | ก็ได้ | ทำได้แต่ไม่ได้สนุก |
| **Drained** | 😫 | เหนื่อย | ฝืน ต้องพักแล้ว |

### 4. Notes (ไม่บังคับ)

จดสั้นๆ ว่าทำอะไรไปบ้าง:
- `"ตอบอีเมล 5 ฉบับ"`
- `"ออกแบบ mockup เสร็จ 2 หน้า"`
- `"stuck ตรง bug login"`

### การบันทึก

- กด **บันทึก** → ข้อมูลเก็บเข้า database → ใช้วิเคราะห์ pattern ภายหลัง
- กด **ข้าม** → ไม่บันทึก (ไม่แนะนำ แต่ทำได้)

> **💡 ทำไมต้องบันทึก?**  
> ADHD ทำให้ลืมง่าย — Kaizen Log คือ "หลักฐาน" ว่าวันนี้ทำอะไรไปบ้าง  
> หลังจากสะสมหลายวัน → เริ่มเห็น pattern:  
> เช่น "ช่วงเช้า flow เสมอ" / "หลังเที่ยง drained admin"

---

## 🅿️ Distraction Parking Lot — จอดความคิดที่แทรก

### ปัญหา

ระหว่างทำงาน → สมองแวบคิดถึงอย่างอื่น:
- "อ้อ ต้องซื้อนม"
- "ลืมตอบ Line แม่"
- "อยากลอง setup ของใหม่"

ถ้าหยุดทำเพื่อจัด task → **หลุดโฟกัสทันที**  
ถ้าไม่จด → **กังวลว่าจะลืม ก็หลุดอยู่ดี**

### วิธีใช้ Parking Lot

1. **สังเกตปุ่ม** 🅿️ สีน้ำเงิน ลอยอยู่ **มุมซ้ายล่าง** ของจอ
2. **กดปุ่ม** → กล่อง input จะเปิดขึ้น
3. **พิมพ์** ความคิดที่แทรก เช่น `"ซื้อนม"`
4. **กด Enter** หรือปุ่ม **Send**
5. ✅ ความคิดถูก "จอด" เรียบร้อย → กลับทำงานต่อได้ทันที!

### สิ่งที่เกิดขึ้นหลังจด

- Item จะถูกเพิ่มเป็น **task ใหม่** ใน **Brain Dump** bucket
- task จะมี tag **🅿️ Parking Lot** เพื่อบอกว่ามาจากที่จอดความคิด
- **Badge สีแดง** บนปุ่ม 🅿️ จะแสดงจำนวน items ที่จอดอยู่

### พฤติกรรมพิเศษ

| สถานการณ์ | พฤติกรรม |
|-----------|---------|
| อยู่ใน Sprint Mode | ใช้ได้! จดแล้วกลับ Sprint ทันที |
| มี item จอดอยู่แล้ว | กดปุ่มเพื่อเปิดดูรายการ |
| กดปิด | กดปุ่ม 🅿️ อีกครั้ง หรือกดที่อื่น |

> **💡 เทคนิค ADHD:**  
> "จอดแล้วลืม" คือเป้าหมาย!  
> พอจบ Sprint ค่อยกลับมาดูว่ามีอะไรจอดอยู่บ้าง  
> → ลากเข้า bucket ที่เหมาะ → ทำทีหลัง

---

## ⭐ Daily Highlight — งานสำคัญสุดของวัน

### แนวคิด

จาก "Make Time" — เลือก **งานสำคัญสุด 1 อย่าง** ที่ถ้าเสร็จวันนี้จะรู้สึกดี  
ทำ Highlight ก่อนงานอื่นทั้งหมด

### วิธีตั้ง

1. กดปุ่ม **⭐** บน task card ที่ต้องการ
2. ดาว⭐จะเปลี่ยนเป็นสีเหลือง + เติมสี
3. task จะมี **กรอบสีทอง** เด่นกว่า task อื่น
4. **เลือกได้แค่ 1** — ถ้ากดอีก task → อันเก่าจะถูกยกเลิกอัตโนมัติ

### กดอีกครั้งเพื่อยกเลิก

กด ⭐ บน task เดิมอีกครั้ง → Daily Highlight จะถูกยกเลิก

> **💡 เลือก Highlight ยังไง?**  
> ถามตัวเอง: "ถ้าวันนี้ทำได้แค่อย่างเดียว จะทำอะไร?"  
> คำตอบนั้น = Daily Highlight ของคุณ

---

## 🛡️ Guard Rails — ระบบป้องกันทำงานเกิน

### สำหรับเวลาไหน?

คน ADHD อาจ "hyperfocus" จนลืมเวลา → Guard Rails คอยเตือน

### 2 ระดับ

| เวลา | ระดับ | ข้อความ | สิ่งที่เห็น |
|------|-------|---------|-----------|
| **16:00** | ⚠️ Emergency | "ยังมี Daily Highlight ค้างอยู่!" | แถบสีเหลือง + ปุ่ม "โฟกัส Highlight" |
| **21:00** | 🛑 Hard Stop | "ถึงเวลาพักแล้ว!" | แถบสีแดง + แนะนำให้หยุด |

### วิธีจัดการ

- **กด "กดรับทราบ"** → ซ่อน alert ไปจนกว่าจะ refresh
- **กด "โฟกัส Highlight"** (เฉพาะ Emergency) → เริ่ม Sprint กับ bucket ที่มี Daily Highlight ทันที

> **💡 ปรับเวลาได้:**  
> แก้ที่ `src/utils/constants.js` → `GUARD_RAILS.EMERGENCY_HOUR` และ `HARD_STOP_HOUR`

---

## 📊 Stats & Review — ดูสถิติ

### วิธีเปิด

กดปุ่ม **📊** ที่ header ด้านขวาบน

### ข้อมูลที่เห็น

- **Sprint History** — รายการ sprint ทั้งหมดพร้อม duration
- **Mood Distribution** — สัดส่วน Flow/Okay/Drained
- **Total Focus Time** — เวลาทำงานรวม

### วิธีปิด

กดปุ่ม **📊** อีกครั้ง หรือกดปุ่ม **✕** บน panel

---

## 🎉 เฉลิมฉลอง — Celebration & Streak

### Confetti

เมื่อ mark task เป็น ✅ complete:
- 🎊 confetti จะยิงออกจากจุดที่กด
- animation หายไปใน 1.5 วินาที

### Streak Badge

เมื่อทำ task เสร็จ **ติดต่อกัน ≥ 2 ครั้ง**:
- badge จะปรากฏ **มุมขวาล่าง**: `🔥 x3`
- ยิ่งทำเยอะ ตัวเลขยิ่งสูง
- reset เมื่อ refresh หน้า

> **💡 ADHD + Dopamine:**  
> Confetti + Streak ช่วยปล่อย dopamine → สร้าง momentum  
> "อีกแค่ 1 task ได้ streak 5 แล้ว!" → ทำต่อ!

---

## ✋ Drag & Drop — ลากย้าย task

### วิธีใช้

1. **คลิกค้าง** ที่ task card
2. **ลาก** ไปยัง bucket ที่ต้องการ
3. bucket เป้าหมายจะ **สว่างขึ้น + ขยาย** เล็กน้อย
4. **ปล่อย** เพื่อย้าย
5. task จะ move ไปทันที + บันทึกใน database

### ข้อจำกัด

- **ใช้ไม่ได้ระหว่าง Sprint** — buckets จะถูก disabled
- **ต้องปล่อยบน bucket** — ปล่อยที่อื่นจะ cancel

---

## 🔌 API สำหรับ Developer

### Authentication

ทุก request ต้องใส่ header:
```
X-API-Key: <your-api-key>
```

API Key ตั้งใน environment variable `MCP_API_KEY`

### Base URL
```
http://<your-server>/api
```

### Endpoints

#### Tasks

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/tasks` | — | ดึง task ทั้งหมด (active) |
| `POST` | `/tasks` | `{ title, bucket?, estimated_duration?, energy_level?, priority_type?, source? }` | สร้าง task ใหม่ |
| `PUT` | `/tasks/:id` | `{ title?, bucket?, is_completed?, is_daily_highlight?, estimated_duration?, energy_level?, priority_type? }` | แก้ไข task |
| `DELETE` | `/tasks/:id` | — | ลบ task |
| `POST` | `/tasks/reorder` | `{ tasks: [{id, sort_order}] }` | เรียงลำดับ |

#### Sprints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/sprints/active` | — | ดู sprint ที่กำลังทำ |
| `POST` | `/sprints/start` | `{ bucket }` | เริ่ม sprint |
| `POST` | `/sprints/stop` | — | หยุด sprint |
| `GET` | `/sprints/history?limit=20` | — | ดูประวัติ sprint |

#### Kaizen Logs

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/kaizen-logs?limit=50` | — | ดึง logs |
| `GET` | `/kaizen-logs/stats` | — | สถิติรวม |
| `POST` | `/kaizen-logs` | `{ bucket, mood, duration_seconds, notes? }` | สร้าง log |

#### Real-time Events (SSE)

```
GET /api/events
```

เชื่อมต่อ Server-Sent Events เพื่อรับ update แบบ real-time:

```javascript
const source = new EventSource('/api/events');
source.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data.type, data.data);
};
```

Event types: `task_created`, `task_updated`, `task_deleted`, `sprint_started`, `sprint_stopped`, `kaizen_log_created`

#### Health Check

```
GET /api/health
```

Response:
```json
{
    "status": "ok",
    "database": { "connected": true, "tables_ready": true },
    "uptime": 12345
}
```

### ตัวอย่าง Request

#### สร้าง task พร้อม priority

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "title": "ตอบอีเมลลูกค้า",
    "bucket": "urgent",
    "estimated_duration": 15,
    "energy_level": "medium",
    "priority_type": "fire"
  }'
```

#### เปลี่ยน priority

```bash
curl -X PUT http://localhost:3000/api/tasks/42 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"priority_type": "bolt"}'
```

---

## 🤖 MCP สำหรับ AI Agent

### Model Context Protocol (MCP)

MCP ให้ AI agents (Cursor, Claude, Gemini) ควบคุม KaiZen Flow ได้:

```
Endpoint: http://<your-server>/mcp
Transport: Streamable HTTP
Auth: X-API-Key header
```

### 10 MCP Tools

| # | Tool | Description |
|---|------|-------------|
| 1 | `list_tasks` | ดึง tasks ทั้งหมด (filter ตาม bucket/completed) |
| 2 | `create_task` | สร้าง task ใหม่ (title, bucket, estimated_duration, energy_level, priority_type, source) |
| 3 | `update_task` | แก้ไข task (title, bucket, highlight, sort_order, estimated_duration, energy_level, priority_type) |
| 4 | `complete_task` | Mark complete/uncomplete |
| 5 | `delete_task` | ลบ task |
| 6 | `start_sprint` | เริ่ม sprint |
| 7 | `stop_sprint` | หยุด sprint |
| 8 | `get_active_sprint` | ดู sprint ที่กำลังทำ |
| 9 | `create_kaizen_log` | บันทึก kaizen log |
| 10 | `get_health` | ดูสถานะ server |

### Config สำหรับ Cursor

สร้างไฟล์ `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kaizen-flow": {
      "url": "http://<your-server>/mcp",
      "headers": {
        "X-API-Key": "<your-api-key>"
      }
    }
  }
}
```

### ตัวอย่างการใช้กับ AI

พิมพ์ใน Cursor:
> "สร้าง task 'แก้ bug login' ใน urgent bucket ประเมิน 30 นาที priority fire"

AI จะเรียก `create_task` tool ให้อัตโนมัติ → task ปรากฏในแอปทันทีผ่าน SSE

---

## 🚀 การ Deploy

### ด้วย Docker Compose

```bash
# 1. Clone
git clone https://github.com/TimeNuthathaam/KaiZenFlow.git
cd KaiZenFlow

# 2. สร้าง .env
cp .env.example .env
# แก้ไข DB_HOST, DB_USER, DB_PASSWORD, MCP_API_KEY

# 3. Build & Run
docker compose up -d --build

# 4. เปิดเว็บ
# http://localhost:80
```

### Environment Variables

| Variable | ค่า | คำอธิบาย |
|----------|-----|---------|
| `DB_HOST` | `mariadb` | ชื่อ container หรือ IP |
| `DB_PORT` | `3306` | port ของ MariaDB |
| `DB_USER` | `kaizen` | username |
| `DB_PASSWORD` | `***` | password |
| `DB_NAME` | `kaizenflow` | ชื่อ database |
| `MCP_API_KEY` | `***` | API Key สำหรับ MCP/API |
| `PORT` | `3000` | port ของ backend |

### ดูรายละเอียดเพิ่มเติม

📄 [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — ขั้นตอน deploy แบบละเอียด  
📄 [API_MANUAL.md](API_MANUAL.md) — เอกสาร API ฉบับเต็ม

---

## 🧘 เทคนิคสำหรับ ADHD

### 1. เริ่มต้นวัน (Morning Routine)

```
1. เปิดแอป → Brain Dump ทุกอย่างในหัว (3-5 นาที)
2. ลาก task เข้า bucket ที่เหมาะ
3. ตั้ง Daily Highlight ⭐ 1 อย่าง
4. Sprint bucket ที่ "รู้สึกพร้อม" ตอนนี้
```

### 2. เมื่อหลุดโฟกัส

```
1. กดปุ่ม 🅿️ → จดความคิดที่แทรก
2. กลับไปทำงานต่อ
3. หลังจบ Sprint → ค่อยจัดความคิดที่จอดไว้
```

### 3. เมื่อรู้สึกเหนื่อย

```
1. หยุด Sprint → บันทึก Kaizen Log (mood = Drained)
2. มองหา task ⚡ Quick Win ที่ใช้ Low Energy
3. ทำ 1-2 อัน → สร้าง momentum ใหม่
4. ถ้ายังเหนื่อย → พัก! Guard Rails จะเตือนตอน 21:00
```

### 4. เมื่อ Overwhelmed

```
1. อย่ามอง task ทั้งหมด — พับ bucket ที่ไม่เกี่ยว (กด ▼)
2. เปิดแค่ 1 bucket → Sprint
3. "แค่ task เดียว" ก็นับว่าสำเร็จ!
```

### 5. Weekly Review (ทุกวันอาทิตย์)

```
1. เปิด Stats 📊 → ดูว่าสัปดาห์นี้ Flow กี่ครั้ง
2. ดูว่า Reality Check แม่นขึ้นหรือยัง
3. ลบ task เก่าที่ไม่ทำแล้ว (อนุญาตให้ตัดทิ้ง!)
4. Brain Dump อะไรใหม่ที่อยากทำสัปดาห์หน้า
```

---

## ❓ FAQ — คำถามที่พบบ่อย

### Q: ต้องตั้ง estimated duration ทุก task ไหม?
**A:** ไม่ต้อง! ตั้งเฉพาะ task ที่อยากติดตามเวลา Reality Check จะแสดงเฉพาะเมื่อมี task ที่ตั้งเวลาไว้

### Q: Priority กับ Bucket ต่างกันยังไง?
**A:** 
- **Bucket** = ประเภทพลังงานของงาน (Creative, Admin, ฯลฯ)
- **Priority** = ความเร่งด่วน/ลักษณะงาน (ด่วน, Quick Win, Deep Work)
- ใช้ร่วมกันได้ เช่น task อยู่ใน Creative bucket แต่มี priority 🔥 Fire

### Q: ข้อมูลเก็บที่ไหน?
**A:** ข้อมูลทั้งหมดเก็บใน **MariaDB** ผ่าน Docker — ไม่หายแม้ปิดเปิดแอป

### Q: ใช้บนมือถือได้ไหม?
**A:** ได้! เป็น responsive web app — ใช้ได้ทุก browser ทุกขนาดหน้าจอ

### Q: Parking Lot กับ Brain Dump ต่างกันยังไง?
**A:**
- **Brain Dump** = จด task ที่วางแผนจะทำ (ตั้งใจจด)
- **Parking Lot** = "จอด" ความคิดที่แทรกระหว่างทำงาน (จดเร็วๆ ไม่ให้หลุดโฟกัส)
- ทั้งคู่ไปอยู่ที่ Brain Dump bucket แต่ Parking Lot task จะมี tag 🅿️

### Q: Sprint ต้องทำนานแค่ไหน?
**A:** ไม่มีขั้นต่ำ! ทำ 5 นาทีก็ได้ — **เริ่มแล้ว = สำเร็จ**

### Q: Guard Rail ปิดได้ไหม?
**A:** กด "กดรับทราบ" → ซ่อนจนกว่าจะ refresh หน้า

### Q: API Key อยู่ที่ไหน?
**A:** ตั้งใน environment variable `MCP_API_KEY` ใน `.env` file หรือ `docker-compose.yml`

---

*KaiZen Flow v2.0 • Follow your energy, respect the guard rails 🧘*  
*Built with ❤️ for ADHD brains*
