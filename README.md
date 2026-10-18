# Pink Jersey Studio 2026 - ระบบสั่งจองเสื้อกีฬาสีชมพู คณะอยุธยา

ระบบเว็บแอปพลิเคชันสำหรับการสั่งจอง ปรับแต่งชื่อ-เบอร์สกรีนเสื้อแบบ 2D/3D Real-time และแนบหลักฐานการชำระเงิน เชื่อมต่อฐานข้อมูล Google Sheets และจัดเก็บสลิปบน Google Drive โดยอัตโนมัติ สำหรับคณะสีชมพู (อยุธยา) โรงเรียนสารคามพิทยาคม

---

## 1. ภาพรวมระบบ (System Overview)

- **แพลตฟอร์ม**: เว็บแอปพลิเคชันแบบ Client-side สถาปัตยกรรม Jamstack เชื่อมต่อ Serverless Backend
- **วัตถุประสงค์**:
  1. ให้นักเรียนและบุคลากรสามารถสั่งจองเสื้อกีฬาสีชมพู พร้อมระบุข้อมูลห้องเรียน เลขที่ และขนาดไซส์ (SS - 6XL)
  2. ปรับแต่งชื่อสกรีนภาษาอังกฤษ (A-Z) และเบอร์เสื้อ พร้อมแสดงตัวอย่างบนเสื้อสดๆ แบบ 2D Real-time SVG และ 3D WebGL Model
  3. ระบบตรวจสอบประวัติเดิมด้วยอีเมล: หากเคยสั่งจองแล้วจะดึงข้อมูลเดิมขึ้นมาให้อัปเดตได้ทันที
  4. สแกนชำระเงินผ่าน QR Code PromptPay พร้อมระบบ OCR ตรวจสอบความถูกต้องของสลิปโอนเงินเบื้องต้น
  5. บันทึกคำสั่งซื้อลง Google Sheets และอัปโหลดไฟล์ภาพสลิปไปยัง Google Drive อัตโนมัติ พร้อมลิงก์คลิกดูรูปขนาดเต็มในตาราง

---

## 2. ฟังก์ชันการทำงานหลัก (Key Features)

### 2.1 Live Jersey Customizer & 3D Viewer
- **มุมมองเสื้อ (View Switcher)**: สลับมุมมองเสื้อได้ 3 รูปแบบ ได้แก่ ด้านหลัง (Back), ด้านหน้า (Front), และคู่หน้า-หลัง (Both)
- **สกรีนชื่อแบบโค้ง (Curved Text)**: จัดวางชื่อตามแนวโค้งบนเสื้อด้วย SVG `<textPath>` แบบ Solid Print คมชัด
- **สกรีนเบอร์ (Jersey Number)**: ปรับแต่งเบอร์เสื้อได้ตั้งแต่ 00 - 99 พร้อมฟังก์ชันสุ่มเลขนำโชค (Lucky Randomizer)
- **WebGL 3D Jersey Stage**: โมเดลเสื้อ 3 มิติ รองรับการหมุนรอบทิศทาง 360 องศาด้วย Three.js และ OrbitControls

### 2.2 ระบบค้นหาและบันทึกข้อมูล (Google Sheets Integration)
- **Instant Email Lookup**: ตรวจสอบประวัติการสั่งจองเดิมจากอีเมลทันทีผ่าน Background Auto-Sync Cache
- **ระบบล็อกสถานะการแก้ไข**: ป้องกันการส่งสลิปซ้ำเมื่อสถานะเป็น "ชำระเงินแล้ว", "จัดส่งแล้ว", หรือ "เสร็จสิ้น"
- **การจัดเก็บสลิปใน Google Sheets**: บันทึกรูปสลิปในช่องตารางด้วยสูตร `=HYPERLINK(viewUrl, IMAGE(imageUrl, 1))` ขยายภาพเต็มช่องตารางขนาด 240px และสามารถคลิกที่รูปเพื่อเปิดดูสลิปขนาดเต็มใน Google Drive ได้ทันที
- **แถบสีสถานะอัตโนมัติ (Conditional Formatting)**: จัดสีแถบสถานะในชีตแยกตามสถานะ เช่น รอชำระเงิน (เหลือง), รอตรวจสอบสลิป (ฟ้า), ชำระเงินแล้ว (เขียว), จัดส่งแล้ว (ม่วง), เสร็จสิ้น (มรกต), ยกเลิก (แดง)

### 2.3 การชำระเงินและตรวจสอบสลิป (Payment & Slip Verification)
- **QR Code PromptPay**: แสดง QR Code พร้อมปุ่มดาวน์โหลดรูปภาพ และปุ่มคัดลอกชื่อบัญชีผู้รับเงิน
- **Client-Side OCR Verification**: ผสานการทำงานกับ Tesseract.js เพื่อตรวจจับชื่อผู้รับโอนบนสลิปในเครื่องของผู้ใช้ก่อนส่ง โดยไม่ส่งข้อมูลส่วนตัวออกภายนอก

### 2.4 ระบบความปลอดภัย (Security Shield)
- **F12 Intercept & Admin Password Prompt**: ป้องกันการกดปุ่ม `F12` โดยระบบจะแสดงหน้าต่างยืนยันรหัสผ่านผู้ดูแลระบบก่อนปลดล็อก เพื่อลดการกดเข้าเครื่องมือตรวจสอบโดยไม่ได้ตั้งใจ
- **Safe Developer Access**: อนุญาตให้เข้าถึง Developer Tools ผ่านเมนูเบราว์เซอร์ได้ตามปกติโดยไม่มีการค้างหน้าจอหรือลูปสแปม
- **Device Exemption**: ละเว้นระบบตรวจสอบปุ่มลัดบนโทรศัพท์มือถือและ iPad/Tablet ทั้งหมด เพื่อให้การใช้งานบนอุปกรณ์พกพาราบรื่น 100%

---

## 3. สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่ใช้ |
|---|---|
| **Frontend Core** | HTML5, CSS3, Modern JavaScript (ES6+ Vanilla) |
| **CSS Framework** | Tailwind CSS (CDN Engine), Custom Liquid Glass Stylesheet |
| **3D Rendering** | Three.js (r128), GLTFLoader, OrbitControls |
| **OCR Engine** | Tesseract.js v5 (Web Worker Client-side OCR) |
| **Serverless Backend** | Google Apps Script (GAS) Web App |
| **Database** | Google Sheets Spreadsheet API |
| **File Storage** | Google Drive API (Public View Permission) |
| **Icons & Typography** | FontAwesome 6.5, Kanit, Outfit, Plus Jakarta Sans, Lobster, Computer Modern Serif |

---

## 4. โครงสร้างไฟล์ในโปรเจกต์ (Project Structure)

```text
pink/
├── assets/
│   ├── images/              # รูปภาพเสื้อ, ตราโรงเรียน, QR Code, พื้นหลัง 2K
│   │   ├── jersey_clean_back.png
│   │   ├── jersey_clean_front.png
│   │   ├── jersey_clean_both.png
│   │   ├── school_crest.png
│   │   ├── qr-code.png
│   │   └── ...
│   └── models/              # โมเดล 3 มิติสำหรับ Three.js Stage
│       └── jersey.glb
├── css/
│   ├── style.css            # สไตล์หลัก ดีไซน์ Liquid Glass & Responsive
│   └── accessibility-fixes.css
├── js/
│   ├── app.js               # ตรรกะหลักของระบบสั่งจอง แคช และการจัดการฟอร์ม
│   ├── security.js          # ระบบป้องกัน DevTools และการเข้าถึงโดยไม่ได้รับอนุญาต
│   └── stage3d.js           # ตัวควบคุม WebGL Three.js สำหรับเสื้อ 3 มิติ
├── Code.gs                  # Backend Script สำหรับรันบน Google Apps Script
├── config.js                # ไฟล์คอนฟิก URL สำหรับเชื่อมต่อ Google Apps Script
├── configUI.js              # ไฟล์จัดการข้อความ ป้ายกำกับ และเนื้อหาบนหน้าเว็บ
├── index.html               # หน้าเว็บหลักของแอปพลิเคชัน
└── README.md                # เอกสารประกอบโปรเจกต์ฉบับสมบูรณ์
```

---

## 5. การตั้งค่าและการใช้งาน (Configuration & Setup)

### 5.1 การตั้งค่า Backend (Google Apps Script)
1. เปิด Google Sheets ที่ต้องการใช้เก็บข้อมูลคำสั่งซื้อ
2. ไปที่เมนู **ส่วนขยาย (Extensions) > Apps Script**
3. คัดลอกโค้ดทั้งหมดจากไฟล์ `Code.gs` ไปวางในโปรเจกต์ Apps Script
4. ระบุ `SPREADSHEET_ID` และ `DRIVE_FOLDER_NAME` ให้ตรงกับระบบของคุณ
5. กด **การทำให้ใช้งานได้ (Deploy) > การทำให้ใช้งานได้รายการใหม่ (New Deployment)**
   - ชนิด: **เว็บแอป (Web App)**
   - ดำเนินการในฐานะ: **ฉัน (Me)**
   - ผู้มีสิทธิ์เข้าถึง: **ทุกคน (Anyone)**
6. คัดลอก Web App URL ที่ได้มาใช้งาน

### 5.2 การตั้งค่า Frontend (`config.js`)
สร้างหรือแก้ไขไฟล์ `config.js` ในโฟลเดอร์โปรเจกต์:
```javascript
const CONFIG = {
  gasUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  accountName: 'NAME XXXX',
  openChatUrl: ''
};
```
