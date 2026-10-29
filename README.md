# Pink Jersey Studio 2026 - ระบบสั่งจองเสื้อและจัดการกิจกรรมกีฬาสี คณะอยุธยา

ระบบเว็บแอปพลิเคชันสำหรับการสั่งจอง ปรับแต่งชื่อ-เบอร์สกรีนเสื้อแบบ 2D/3D Real-time ตรวจสอบสลิปด้วย OCR และบันทึกข้อมูลลง Google Sheets / Google Drive อัตโนมัติ พร้อมระบบเช็กชื่อลงทะเบียนกิจกรรม สำหรับคณะสีชมพู (อยุธยา) โรงเรียนสารคามพิทยาคม

---

## 1. ภาพรวมระบบ (System Overview)

- **สถาปัตยกรรม**: Client-side Jamstack เชื่อมต่อ Serverless Backend (Google Apps Script Web App)
- **ระบบจัดเก็บข้อมูล**: Google Sheets Spreadsheet API (Database) และ Google Drive API (File Storage)
- **วัตถุประสงค์หลัก**:
  1. อำนวยความสะดวกให้นักเรียนและบุคลากรสั่งจองเสื้อกีฬาสีชมพู พร้อมระบุห้องเรียน เลขที่ และขนาดไซส์ (SS ถึง 6XL)
  2. แสดงตัวอย่างชื่อสกรีนและเบอร์เสื้อแบบ Real-time ทั้งมุมมอง 2D SVG Curved Vector และ 3D WebGL Model
  3. ฟังก์ชันสุ่มเบอร์มงคล "โชคดีวันนี้" พร้อมแอนิเมชันลูกเต๋า Slot Ticker และความหมายเลขนำโชค
  4. ตรวจสอบประวัติการสั่งจองเดิมผ่านอีเมลแบบ On-Demand เพื่อดึงข้อมูลมาแก้ไขได้อย่างรวดเร็ว
  5. ตรวจสอบสลิปโอนเงิน PromptPay เบื้องต้นด้วย Client-side OCR ก่อนบันทึกข้อมูล
  6. โมดูลระบบเช็กชื่อและลงทะเบียนนักเรียนประจำฝ่าย/ห้องเรียน (Check Attendance Subsystem)

---

## 2. ฟังก์ชันการทำงานหลัก (Key Features)

### 2.1 Live Jersey Customizer & 3D WebGL Stage
- **มุมมองเสื้อ 3 รูปแบบ**: สลับมุมมองด้านหลัง (Back), ด้านหน้า (Front), และคู่หน้า-หลัง (Both)
- **สกรีนชื่อแบบโค้ง (Curved Text)**: จัดวางชื่อตามแนวโค้งบนเสื้อด้วย SVG `<textPath>` แบบ Solid Print คมชัด
- **สกรีนเบอร์ (Jersey Number)**: ปรับแต่งเบอร์เสื้อได้ตั้งแต่ 00 ถึง 99 รองรับฟอนต์กีฬาทางการ
- **ฟีเจอร์ "โชคดีวันนี้" (Lucky Number Experience)**:
  - ปุ่มสไตล์ Apple Glass Pill พร้อมไอคอนลูกเต๋า
  - แอนิเมชัน Dice Spin และ Slot Machine Ticker สลับตัวเลขสุ่มทุก 45ms ก่อนหยุดที่เลขมงคล
  - คลังเลขมงคล 11 หมายเลขประจำตำแหน่งนักกีฬา (07 ปีกความเร็วสูง, 10 จอมทัพเพลย์เมกเกอร์, 23 หมายเลขแห่งตำนาน, 99 พลังขั้นสุด ฯลฯ)
  - Visual Pulse Effect บนตัวเลขเสื้อ SVG และการสั่นแจ้งเตือน Haptic Feedback บนสมาร์ตโฟน
- **3D WebGL Stage**: โมเดลเสื้อ 3 มิติ รองรับการหมุนรอบทิศทาง 360 องศาด้วย Three.js และ OrbitControls

### 2.2 การชำระเงินและตรวจสอบสลิป (Payment & Slip Verification)
- **QR Code PromptPay**: แสดง QR Code บัญชีทางการ พร้อมปุ่มดาวน์โหลดและปุ่มคัดลอกชื่อบัญชี
- **Client-Side OCR (Tesseract.js v5)**: ตรวจจับชื่อผู้รับโอนบนสลิปในเครื่องของผู้ใช้โดยตรงโดยไม่ส่งข้อมูลส่วนตัวออกนอกอุปกรณ์
- **Image Whitelisting & Drive Storage**: กรองไฟล์สลิปเฉพาะภาพ (JPEG, PNG, WebP, GIF) และบันทึกลงโฟลเดอร์ Google Drive พร้อมสร้างลิงก์พรีวิวขนาดเต็มใน Google Sheets

### 2.3 ระบบเช็กชื่อและลงทะเบียนกิจกรรม (Check Attendance Module)
- **Subsystem**: อยู่ในโฟลเดอร์ `check-attendance/` แยกการทำงานเป็นอิสระ
- **SWR Caching & Deduplication**: บันทึกและดึงข้อมูลสรุปสถานะการลงทะเบียนของนักเรียนผ่าน Local Storage / Session Storage แบบ Stale-While-Revalidate
- **Classroom & Department View**: ค้นหารายชื่อนักเรียนแยกตามระดับชั้น ม.1 - ม.6 และฝ่ายกิจกรรม (หลีดเดอร์, กองเชียร์, นักกีฬา, สวัสดิการ ฯลฯ)

### 2.4 สถาปัตยกรรมความปลอดภัย (Security Hardening)
ระบบได้รับการตรวจสอบและปรับปรุงตามมาตรฐาน **Cloudflare Security Audit Skill**:
1. **Protection against Excessive Data Exposure (OWASP API3)**:
   - ปิดกั้นการเข้าถึง `?action=list` สาธารณะ ต้องใช้ `ADMIN_SECRET` token ในการเข้าถึงฐานข้อมูลทั้งหมด
   - ยกเลิกการดึงข้อมูลทั้งโรงเรียนมาเก็บในเครื่องผู้ใช้ เปลี่ยนเป็นระบบ On-Demand Query เฉพาะอีเมลที่ค้นหาจริง
2. **Spreadsheet Formula Injection Prevention (CWE-1236)**:
   - ฟังก์ชัน `sanitizeCellText()` ใน `Code.gs` ทำการเติม `'` นำหน้าข้อความที่ขึ้นต้นด้วย `=`, `+`, `-`, `@`, `\t`, `\r`
   - ฟังก์ชัน `buildSafeSlipFormula()` ตรวจสอบ HTTPS scheme และ Escape เครื่องหมายคำพูดคู่ ป้องกัน Formula Breakout ในคำสั่ง `=HYPERLINK()`
3. **Stored Cross-Site Scripting (XSS) Prevention (CWE-79)**:
   - นำฟังก์ชัน `esc()` เข้ารหัสอักขระ HTML (`&`, `<`, `>`, `"`, `'`) ครอบตัวแปรผู้ใช้ทุกจุดก่อนแทรกลง DOM `innerHTML`
   - ฟังก์ชัน `sanitizeMediaUrl()` ตรวจสอบโครงสร้าง URL สลิปให้อนุญาตเฉพาะ `data:image/` หรือ `https://`
4. **Server-Side Order State Locking**:
   - ล็อกคำสั่งซื้อที่มีสถานะ "ชำระเงินแล้ว", "จัดส่งแล้ว", หรือ "เสร็จสิ้น" ป้องกันการส่งอีเมลเพื่อเขียนทับข้อมูลโดยไม่ได้รับอนุญาต

---

## 3. สถาปัตยกรรมและเทคโนโลยี (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่ใช้ |
|---|---|
| **Frontend Core** | HTML5, CSS3, Modern JavaScript (Vanilla ES6+) |
| **Styling** | Tailwind CSS (CDN), Custom Liquid Glass Stylesheet |
| **3D Rendering** | Three.js (r128), GLTFLoader, OrbitControls |
| **OCR Engine** | Tesseract.js v5 (Web Worker Client-Side OCR) |
| **Serverless Backend** | Google Apps Script (GAS) Web App |
| **Database** | Google Sheets Spreadsheet API |
| **Storage** | Google Drive API (Folder-scoped public view) |
| **Security Suite** | Cloudflare Security Audit Skill, Custom Sanitizer, CWE-1236/79 Guards |
| **Typography** | FontAwesome 6.5, Kanit, Outfit, Plus Jakarta Sans, Prompt, Bebas Neue |

---

## 4. โครงสร้างไฟล์ในโปรเจกต์ (Project Structure)

```text
pink/
├── .agents/
│   └── skills/
│       └── security-audit/      # Cloudflare Security Audit Skill & Validators
├── assets/
│   ├── fonts/                   # ฟอนต์กีฬาและภาษาไทย (Prompt, Bebas Neue, Inter Miami)
│   ├── images/                  # รูปภาพเสื้อ, ตราโรงเรียน, QR Code, พื้นหลัง 2K
│   │   ├── jersey_clean_back.png
│   │   ├── jersey_clean_front.png
│   │   ├── jersey_clean_both.png
│   │   └── school_crest.png
│   └── models/                  # โมเดลเสื้อ 3 มิติ (GLTF/GLB)
│       └── shirt.glb
├── check-attendance/            # ระบบเช็กชื่อและลงทะเบียนกิจกรรม
│   ├── css/attendance.css
│   ├── js/api.js
│   ├── js/app.js
│   ├── js/config.js
│   ├── js/store.js
│   └── index.html
├── css/
│   ├── style.css                # ดีไซน์หลัก Liquid Glass & Layout Responsive
│   └── accessibility-fixes.css  # การรองรับความสามารถในการเข้าถึง (A11y)
├── js/
│   ├── app.js                   # ตรรกะหลักของฟอร์ม, พรีวิวเสื้อ, Lucky Randomizer, Security Sanitizers
│   ├── stage3d.js               # ตัวควบคุม WebGL Three.js สำหรับเสื้อ 3 มิติ
│   ├── silk3d.js                # แอนิเมชันผ้าพริ้วไหว
│   └── studio3d.js
├── tests/
│   ├── attendance_test.js       # ทดสอบระบบ Attendance API, Dedupe & Store
│   ├── run_all.js               # ชุดทดสอบ E2E Layout & Touch Routing (4 Tiers)
│   └── engine/
├── Code.gs                      # Backend Script สำหรับรันบน Google Apps Script
├── config.js                    # การตั้งค่า URL สำหรับเชื่อมต่อ Backend
├── configUI.js                  # ข้อความ ป้ายกำกับ และเนื้อหาบนหน้าเว็บ
├── index.html                   # หน้าเว็บหลักของแอปพลิเคชัน
├── SECURITY_AUDIT_REPORT.md     # รายงานผลการตรวจสอบความปลอดภัยฉบับสมบูรณ์
└── README.md                    # เอกสารประกอบโปรเจกต์
```

---

## 5. การติดตั้งและการตั้งค่า (Installation & Setup)

### 5.1 การตั้งค่า Backend (Google Apps Script)
1. เปิด Google Spreadsheet ที่ต้องการใช้เป็นฐานข้อมูล
2. ไปที่เมนู **ส่วนขยาย (Extensions) > Apps Script**
3. คัดลอกโค้ดจาก [Code.gs](Code.gs) ไปวางในโปรเจกต์ Apps Script
4. กำหนดค่าคอนฟิกส่วนหัวของไฟล์:
   - `SPREADSHEET_ID`: รหัสไอดีของ Google Sheets
   - `SHEET_NAME`: ชื่อแท็บชีต (เช่น "จองเสื้อกีฬาสี สีชมพู 2026 - สารคามพิทยาคม")
   - `DRIVE_FOLDER_NAME`: ชื่อโฟลเดอร์สำหรับเก็บภาพสลิปบน Google Drive
5. (แนะนำ) ตั้งค่ารหัสผ่านผู้ดูแลระบบ:
   - ไปที่ **การตั้งค่าโปรเจกต์ (Project Settings) > คุณสมบัติของสคริปต์ (Script Properties)**
   - เพิ่มพร็อพเพอร์ตี้ชื่อ `ADMIN_SECRET` พร้อมตั้งค่ารหัสผ่านสำหรับใช้ดึงข้อมูลรายการทั้งหมด (`action=list`)
6. กด **การทำให้ใช้งานได้ (Deploy) > การทำให้ใช้งานได้รายการใหม่ (New Deployment)**:
   - ชนิด: **เว็บแอป (Web App)**
   - ดำเนินการในฐานะ: **ฉัน (Me)**
   - ผู้มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)**
7. คัดลอก URL ของเว็บแอป (ลงท้ายด้วย `/exec`) มาใช้งาน

### 5.2 การตั้งค่า Frontend (`config.js`)
สร้างหรือแก้ไขไฟล์ `config.js` ในโฟลเดอร์รากของโปรเจกต์:
```javascript
const CONFIG = {
  gasUrl: 'https://script.google.com/macros/s/AKfycb.../exec',
  accountName: 'น.ส. ภัททิยา เมืองวงษ์',
  openChatUrl: ''
};
```

---

## 6. การทดสอบระบบ (Automated Testing)

โปรเจกต์มาพร้อมชุดทดสอบอัตโนมัติ 2 ชุด:

1. **Check Attendance Subsystem Tests**:
   ```bash
   node tests/attendance_test.js
   ```
   - ทดสอบความถูกต้องของ AttendanceConfig
   - ทดสอบฟังก์ชัน Deduplication ของ AttendanceAPI
   - ทดสอบ AttendanceStore และ Domain Constraints
   - ทดสอบ SWR Cache และ Syntax ของระบบ

2. **E2E Layout & Responsiveness Tests**:
   ```bash
   node tests/run_all.js
   ```
   - ทดสอบ Mobile Grid, Sticky Stacking, Z-index
   - ทดสอบ Breakpoints (320px, 768px, 1024px, 2560px)
   - ทดสอบ Touch Routing และ Form Input Constraints

---

## 7. ลิขสิทธิ์และการพัฒนา (License & Credits)

- **ผู้พัฒนา**: คณะทำงานฝ่ายเทคโนโลยีและสารสนเทศ คณะสีชมพู (อยุธยา) โรงเรียนสารคามพิทยาคม
- **ลิขสิทธิ์ฟอนต์และภาพ**: เป็นไปตามเงื่อนไขของ Open Font License (OFL) สำหรับฟอนต์ Prompt, Bebas Neue และสิทธิ์การใช้งานภายในองค์กรสำหรับตราโรงเรียนและกราฟิกเสื้อ
