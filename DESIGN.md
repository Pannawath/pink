---
version: 1.0.0
name: Ayutthaya Sarakhampittayakhom Studio 2026
description: Pink Liquid Glass & High-End Athletic Configurator Design System
generator: designmd.me
colors:
  primary: "#ef4fa3"
  primaryDark: "#9b315f"
  primaryWine: "#6e2446"
  accentRose: "#ff8fbe"
  textDark: "#1e293b"
  textMuted: "#475569"
  bgGradientStart: "#c74580"
  bgGradientEnd: "#a63769"
  glassWhite: "rgba(255, 255, 255, 0.28)"
  glassBorder: "rgba(255, 255, 255, 0.88)"
  glassShadowDark: "rgba(15, 23, 42, 0.22)"
typography:
  fontFamilyBody: "Kanit, Plus Jakarta Sans, sans-serif"
  fontFamilyDisplay: "Prompt, Kanit, sans-serif"
  fontFamilyJerseyNumbers: "BebasNeue, JerseyMiami, sans-serif"
  h1:
    fontFamily: "Kanit, sans-serif"
    fontSize: "24px"
    fontWeight: "800"
  h2:
    fontFamily: "Kanit, sans-serif"
    fontSize: "20px"
    fontWeight: "700"
spacing:
  base: "8px"
  cardPadding: "24px"
  containerMaxWidth: "1080px"
rounded:
  sm: "12px"
  md: "20px"
  lg: "30px"
  pill: "9999px"
effects:
  backdropBlurNav: "48px"
  backdropBlurCard: "52px"
  shadowLiquid: "0 30px 75px -12px rgba(15, 23, 42, 0.22), 0 15px 35px -10px rgba(153, 27, 88, 0.28)"
---

# DESIGN.md - Ayutthaya Sarakhampittayakhom Studio 2026

เอกสารสรุปข้อกำหนดการออกแบบ (Design System Specification) ที่สร้างผ่านระบบของ **[designmd.me](https://designmd.me)** เพื่อเป็นแนวทางอ้างอิงมาตรฐาน (Source of Truth) สำหรับ AI Agents และทีมพัฒนา

---

## 1. Visual Style & Aesthetic Philosophy (แนวทางการออกแบบ)

- **Style:** Pink Liquid Glassmorphic Aesthetic (สไตล์กระจกวิเศษสีชมพูพรีเมียม)
- **Concept:** ผสานความสปอร์ตเข้ากับความหรูหราแบบโปร่งแสง (Liquid Glass, Backdrop Blur, Deep Elevation Shadows)
- **Key Characteristics:**
  - ตัวกรอบกระจกมีความโค้งมนสูง (`border-radius: 30px` และ `9999px`)
  - ใช้ความเบลอของพื้นหลังระดับสูง (`backdrop-filter: blur(48px)` ถึง `52px`)
  - มีเงาแบบมิติลึกลอยเด่นตัดกับฉากหลัง (`0 30px 75px -12px rgba(15, 23, 42, 0.22)`)
  - ข้อความทุกจุดในส่วนควบคุมและอินเทอร์เฟซใช้สีโทนเข้ม `#0f172a` / `#1e293b` อ่านง่ายและมีความคมชัดสูง

---

## 2. Color Palette & Tokens (ระบบชุดสี)

| Token Name | Color Value | Usage Description |
|---|---|---|
| `primary` | `#ef4fa3` | สีชมพูหลักสำหรับปุ่มและการไฮไลท์ |
| `primaryDark` | `#9b315f` | สีชมพูเข้มสำหรับเอฟเฟกต์ Hover และขอบ |
| `accentRose` | `#ff8fbe` | สีชมพูพาสเทลประดับตกแต่ง |
| `textDark` | `#1e293b` | สีตัวหนังสือหลัก คมชัด อ่านง่าย |
| `textMuted` | `#475569` | สีตัวหนังสือรอง / คำอธิบาย |
| `glassWhite` | `rgba(255, 255, 255, 0.28)` | สีพื้นหลังกระจกโปร่งแสง |
| `glassBorder` | `rgba(255, 255, 255, 0.88)` | สีขอบกระจกสะท้อนแสง |

---

## 3. Typography Rules (ระบบตัวอักษร)

1. **Body & UI Text:** ใช้ฟอนต์ **Kanit** และ **Plus Jakarta Sans** สำหรับการอ่านข้อมูลทั่วไปและปุ่มต่างๆ
2. **Headings & Titles:** ใช้ฟอนต์ **Prompt** และ **Kanit** (Bold 700 / 800) สำหรับชื่อหัวข้อและชื่อแบรนด์
3. **Sports Numbers & Screen Names:** ใช้ฟอนต์สปอร์ต **BebasNeue** (หรือ `JerseyMiami`) สำหรับหมายเลขและชื่อบนเสื้อสกรีน

---

## 4. Component Standards (มาตรฐานส่วนประกอบ UI)

### 4.1 Floating Header Bar (`.apple-glass-nav`)
- **Background:** `linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.12))`
- **Backdrop Blur:** `48px`
- **Border-Radius:** `9999px` (ทรงแคปซูล)

### 4.2 Segmented View Switcher (`.apple-segmented-control`)
- **Pill Animation:** มีตัวเลื่อนสีขาว (`.apple-segmented-indicator`) สไลด์นุ่มนวล (`transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)`)
- **Active State:** ตัวหนังสือเปลี่ยนเป็นสีดำเข้ม `#0f172a` ตัวหนา `800`

### 4.3 Configurator Card (`.apple-glass-card`)
- **Backdrop Blur:** `48px`
- **Border-Radius:** `30px`
- **Shadow:** มิติลึกลอยเด่นพร้อมขอบเส้นเงาสีเข้มตัดฉากหลัง

---

## 5. Security & DevTools Protection Guardrails (ข้อกำหนดความปลอดภัย)

- **F12 & Shortcut Blocking:** บล็อก `F12`, `Ctrl+Shift+I/J/C`, `Ctrl+U`, `Ctrl+S`, และ `Cmd+Option+I/J/C/U` บน macOS
- **Context Menu:** ปิดการคลิกขวา `contextmenu` ทั่วทั้งหน้าเว็บ
- **DevTools Freeze Loop:** ตรวจจับขนาด `window.outerWidth - window.innerWidth` หากมีการเปิด DevTools ระบบจะสั่ง `console.clear()` และลูป `debugger` แช่แข็งการทำงานทันที

---

## 6. Architecture & File Structure (โครงสร้างไฟล์)

```text
pink/
├── DESIGN.md           # เอกสารข้อกำหนดการออกแบบ (สร้างจาก designmd.me)
├── config.js           # คอนฟิกการเชื่อมต่อ Backend (Apps Script URL)
├── configUI.js         # คอนฟิกข้อความและสไตล์กระจก UI ทั้งหมด
├── index.html          # โครงสร้างหน้าเว็บหลัก
├── css/
│   └── style.css       # สไตล์ชีตหลักและดีไซน์โทเคน
├── js/
│   ├── app.js          # โค้ดควบคุมฟอร์มและการสั่งซื้อ
│   ├── security.js     # สคริปต์ป้องกันการกด F12 / DevTools
│   └── studio3d.js     # ฉากหลัง WebGL 3D Shirt Model
└── assets/
    ├── fonts/          # ฟอนต์ BebasNeue, Prompt, Inter Miami
    ├── images/         # รูปภาพเสื้อ HD, ตราโรงเรียน, QR Code
    └── models/         # โมเดล 3D (.glb, .blend)
```
