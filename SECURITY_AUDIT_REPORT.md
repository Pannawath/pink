# Security Audit Report: Pink Jersey Studio & Attendance System

- **Audit Date**: 2026-10-29
- **Skill Engine**: Cloudflare Security Audit Skill (Defensive Source-First Architecture)
- **Target Repository**: Ayutthaya Sarakhampittayakhom - Pink Jersey Studio 2026
- **Assessed Scope**:
  - `Code.gs` (Google Apps Script API Backend)
  - `js/app.js` (Core Configurator & Order Workflow)
  - `check-attendance/js/app.js` & `api.js` (Attendance Registration Module)
  - `index.html` & `config.js`

---

## 1. Executive Summary

A comprehensive source-level defensive security review was conducted across the client-side single-page applications and the serverless Google Apps Script backend. 

Four vulnerabilities across the backend and frontend boundaries were identified and remediated:
1. **CRITICAL - OWASP API3 (Excessive Data Exposure & Broken Object Property Authorization)**: Unauthenticated database dumping endpoint exposing student PII and payment slips.
2. **HIGH - CWE-1236 (Improper Neutralization of Formula Elements in CSV/Spreadsheet Output)**: Google Sheets formula injection via unescaped hyperlinks and cell values.
3. **HIGH - CWE-79 (Improper Neutralization of Input During Web Page Generation - Stored XSS)**: Unsanitized DOM innerHTML interpolation in order lists and alerts.
4. **MEDIUM - Broken Access Control & State Machine Tampering**: Unvalidated order modification allowing arbitrary overwrite of locked/paid orders.

All four vulnerabilities have been patched directly in source code and validated against existing project test suites.

---

## 2. Detailed Findings and Remediations

### Finding SEC-01: Unauthenticated Database Dump via `action=list`
- **Severity**: Critical (CVSS 8.6)
- **Class**: Information Disclosure / Broken Access Control (OWASP API3:2023)
- **Affected File**: [Code.gs](file:///d:/antigravity/pink/Code.gs#L385-L420) & [js/app.js](file:///d:/antigravity/pink/js/app.js)
- **Vulnerability Description**:
  The `doGet` handler exposed an unauthenticated endpoint (`?action=list`) returning all student order rows (student email, real name, student ID, classroom, screen name, number, size, and Google Drive URL to the payment slip). Furthermore, `js/app.js` executed `setInterval(syncOrdersCache, 30000)`, dumping the entire school's student database into the local memory of every anonymous visitor's browser.
- **Remediation**:
  1. `Code.gs`: Guarded `action === "list"` behind an `ADMIN_SECRET` token check (via Google Apps Script PropertiesService). Unauthenticated queries are rejected with an authorization error.
  2. `js/app.js`: Removed the automatic `setInterval` polling and whole-database pre-fetch. Replaced with on-demand lookup (`?action=search&email=...`), querying only the specific record belonging to the actively searched student.

---

### Finding SEC-02: Google Sheets Formula Injection (CWE-1236)
- **Severity**: High (CVSS 7.8)
- **Class**: Formula Injection / CSV Injection
- **Affected File**: [Code.gs](file:///d:/antigravity/pink/Code.gs#L1-L40)
- **Vulnerability Description**:
  User-supplied fields (`name`, `classroom`, `studentNumber`, `slipUrl`) were inserted into Google Sheets cells without sanitization. Values starting with formula operators (`=`, `+`, `-`, `@`) would execute automatically when opened by school administrators. In addition, `slipUrl` was concatenated into `=HYPERLINK("...", IMAGE("...", 1))`, allowing double-quote breakout to execute formulas such as `=IMPORTXML` or `=IMAGE` to arbitrary exfiltration endpoints.
- **Remediation**:
  1. Added `sanitizeCellText()` in `Code.gs` to strip control characters and prepend a single quote (`'`) to any string starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.
  2. Added `sanitizeHttpsUrl()` and `buildSafeSlipFormula()` to enforce strict HTTPS scheme validation and quote escaping (`replace(/"/g, '%22')`) prior to formula generation.

---

### Finding SEC-03: Stored Cross-Site Scripting (XSS) in Client Renderers
- **Severity**: High (CVSS 7.2)
- **Class**: DOM-Based / Stored Cross-Site Scripting (CWE-79)
- **Affected Files**: [js/app.js](file:///d:/antigravity/pink/js/app.js#L1704-L1744) & [check-attendance/js/app.js](file:///d:/antigravity/pink/check-attendance/js/app.js#L284)
- **Vulnerability Description**:
  `DOM.ordersListContainer.innerHTML`, `showFieldError()`, `showToast()`, and attendance student cards interpolated user-controlled properties (`o.name`, `o.classroom`, `o.number`, `o.slipImage`) directly into HTML template literals without escaping. An attacker submitting an order containing `<img src=x onerror=...>` would achieve arbitrary JavaScript execution in the browser of anyone reviewing the orders.
- **Remediation**:
  1. Implemented `esc()` escaping characters `&`, `<`, `>`, `"`, and `'`.
  2. Implemented `sanitizeMediaUrl()` ensuring image URLs conform strictly to valid base64 image data or HTTPS URLs.
  3. Escaped all interpolated properties in `renderOrdersList`, `showFieldError`, and `showToast`.
  4. Escaped `classRoom` and `numberLabel` in `check-attendance/js/app.js`.

---

### Finding SEC-04: Unauthorized Order Overwrite on Locked Statuses
- **Severity**: Medium (CVSS 6.5)
- **Class**: Broken Access Control / State Machine Violation
- **Affected File**: [Code.gs](file:///d:/antigravity/pink/Code.gs#L137-L150)
- **Vulnerability Description**:
  `Code.gs` accepted any `doPost` containing an existing student's email and overwrote the record, even after the order status had transitioned to finalized states ("ชำระเงินแล้ว", "จัดส่งแล้ว", "เสร็จสิ้น"). An attacker or mistaken student could overwrite details and substitute a fraudulent slip over a confirmed order.
- **Remediation**:
  Enforced server-side status checks in `Code.gs`. If the existing row status is in `["ชำระเงินแล้ว", "จัดส่งแล้ว", "เสร็จสิ้น"]`, modification is rejected with a locked status error.

---

## 3. Verification & Validation Summary

1. **Check Attendance Test Suite**:
   - `node tests/attendance_test.js` executed: 5/5 tests passed (100% PASS).
2. **E2E Layout Suite**:
   - `node tests/run_all.js` executed: 41 tests passed (consistent baseline).
3. **Syntax and Code Integrity**:
   - Verified clean syntax parsing on all modified files (`Code.gs`, `js/app.js`, `check-attendance/js/app.js`).
