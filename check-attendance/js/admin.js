/**
 * =========================================================================
 * AYUTTHAYA PINK 2569 · ADMIN CONTROLLER LOGIC
 * Manages PIN Auth, Live Analytics, Dynamic Quotas, Duplicates, and Exports
 * =========================================================================
 */

(function () {
  'use strict';

  let currentTab = 'dashboard';
  let adminSettings = AttendanceConfig.getSettings();
  let liveRecords = [];
  let isAuthed = false;
  let editingRecordId = null;

  const AUTH_SESSION_KEY = 'pink_admin_authenticated_v1';

  function init() {
    checkAuth();
    setupEventListeners();
    loadLiveRecords();
  }

  function checkAuth() {
    const sessionAuth = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (sessionAuth === 'true') {
      isAuthed = true;
      hidePinScreen();
      renderActiveTab();
    } else {
      showPinScreen();
    }
  }

  function showPinScreen() {
    const pinEl = document.getElementById('pinOverlay');
    if (pinEl) pinEl.style.display = 'flex';
  }

  function hidePinScreen() {
    const pinEl = document.getElementById('pinOverlay');
    if (pinEl) pinEl.style.display = 'none';
  }

  function verifyPin(inputPin) {
    const targetPin = adminSettings.adminPin || AttendanceConfig.DEFAULT_ADMIN_PIN;
    if (inputPin === targetPin) {
      isAuthed = true;
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      hidePinScreen();
      renderActiveTab();
      return true;
    }
    return false;
  }

  async function loadLiveRecords() {
    try {
      const records = await AttendanceAPI.fetchFromNetwork();
      liveRecords = records || [];
      AttendanceStore.setRegs(liveRecords);
      renderActiveTab();
      updateHeaderCounts();
    } catch (e) {
      console.error('Failed to load records:', e);
    }
  }

  function updateHeaderCounts() {
    const countEl = document.getElementById('headerTotalCount');
    if (countEl) countEl.textContent = `${liveRecords.length} คน`;

    const dupes = AttendanceStore.getDuplicateStudents();
    const dupeCount = Object.keys(dupes).length;
    const dupeBadge = document.getElementById('dupeTabBadge');
    if (dupeBadge) {
      dupeBadge.textContent = dupeCount;
      dupeBadge.style.display = dupeCount > 0 ? 'inline-block' : 'none';
    }
  }

  function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.nav-tabs-wrapper .tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    renderActiveTab();
  }

  function renderActiveTab() {
    if (!isAuthed) return;
    const container = document.getElementById('adminTabContent');
    if (!container) return;

    if (currentTab === 'dashboard') container.innerHTML = renderDashboard();
    else if (currentTab === 'duplicates') container.innerHTML = renderDuplicates();
    else if (currentTab === 'quotas') container.innerHTML = renderQuotas();
    else if (currentTab === 'directory') container.innerHTML = renderDirectory();
    else if (currentTab === 'export') container.innerHTML = renderExport();

    updateHeaderCounts();
  }

  /* -------------------------------------------------------------
     TAB 1: DASHBOARD
     ------------------------------------------------------------- */
  function renderDashboard() {
    const totalCount = liveRecords.length;
    const dupes = AttendanceStore.getDuplicateStudents();
    const dupeCount = Object.keys(dupes).length;

    // Grades count
    const gradeCounts = {};
    AttendanceConfig.GRADES.forEach(g => gradeCounts[g.grade] = 0);
    liveRecords.forEach(r => {
      const g = (r.classRoom || '').split('/')[0];
      if (gradeCounts[g] !== undefined) gradeCounts[g]++;
    });

    // Capacity meters
    const depts = adminSettings.departments || AttendanceConfig.DEPARTMENTS;
    const quotaCardsHtml = depts.map(d => {
      const count = AttendanceStore.countDept(d.name);
      const max = d.maxCapacity;
      const isClosed = d.isClosed;
      const isFull = max && count >= max;
      const pct = max ? Math.min(100, Math.round((count / max) * 100)) : 100;

      let badgeClass = 'open';
      let badgeText = 'เปิดรับ';
      let barColor = '#10b981';

      if (isClosed) {
        badgeClass = 'full';
        badgeText = 'ปิดรับชั่วคราว';
        barColor = '#ef4444';
      } else if (isFull) {
        badgeClass = 'full';
        badgeText = 'เต็มโควตา';
        barColor = '#ef4444';
      } else if (max && pct > 80) {
        barColor = '#f59e0b';
      }

      return `
      <div class="glass-panel meter-card">
        <div class="meter-header">
          <div>
            <div class="meter-title">${d.name}</div>
            <div style="font-size:12px;color:var(--admin-text-muted);">${max ? `โควตา: ${max} คน` : 'ไม่จำกัดโควตา'}</div>
          </div>
          <span class="meter-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="meter-bar-track">
          <div class="meter-bar-fill" style="width:${pct}%;background:${barColor};"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--admin-text-muted);">
          <span>ลงทะเบียนแล้ว: <strong style="color:var(--admin-text-main);">${count} คน</strong></span>
          <span>${max ? `เหลืออีก ${Math.max(0, max - count)} ที่ (${pct}%)` : 'ไม่จำกัด'}</span>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="kpi-grid">
      <div class="glass-panel kpi-card">
        <div class="kpi-label">ผู้ลงทะเบียนทั้งหมด <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.7;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
        <div class="kpi-value">${totalCount} <span style="font-size:16px;font-weight:500;color:var(--admin-text-muted);">คน</span></div>
        <div class="kpi-sub">ซิงก์สดจาก Google Sheets</div>
      </div>
      <div class="glass-panel kpi-card">
        <div class="kpi-label">พบลงทะเบียนซ้ำ <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.7;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
        <div class="kpi-value" style="color:${dupeCount > 0 ? '#f59e0b' : '#10b981'};">${dupeCount} <span style="font-size:16px;font-weight:500;color:var(--admin-text-muted);">คน</span></div>
        <div class="kpi-sub">${dupeCount > 0 ? 'ต้องได้รับการตรวจสอบจากสตาฟ' : 'ข้อมูลเรียบร้อยสมบูรณ์'}</div>
      </div>
      <div class="glass-panel kpi-card">
        <div class="kpi-label">สัดส่วนระดับชั้น</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">
          ${Object.entries(gradeCounts).map(([g, c]) => `<span style="background:var(--admin-surface-subtle);border:1px solid var(--admin-border);padding:3px 6px;font-size:11px;">${g}: <strong>${c}</strong></span>`).join('')}
        </div>
      </div>
    </div>

    <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
      <h3 style="font-size:17px;font-weight:700;">สถานะโควตารายฝ่ายงาน</h3>
      <button class="btn btn-ghost" onclick="PinkAdmin.switchTab('quotas')">ตั้งค่าโควตา</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px;">
      ${quotaCardsHtml}
    </div>`;
  }

  /* -------------------------------------------------------------
     TAB 2: DUPLICATES RESOLUTION
     ------------------------------------------------------------- */
  function renderDuplicates() {
    const dupes = AttendanceStore.getDuplicateStudents();
    const dupeKeys = Object.keys(dupes);

    if (dupeKeys.length === 0) {
      return `
      <div class="glass-panel" style="padding:48px 20px;text-align:center;">
        <div style="width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,0.1);color:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:1px solid rgba(16,185,129,0.2);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h3 style="font-size:18px;margin-bottom:6px;">ไม่พบรายการลงทะเบียนซ้ำซ้อน</h3>
        <p style="font-size:13px;color:var(--admin-text-muted);">นักเรียนทุกคนในระบบลงทะเบียนเพียง 1 สิทธิ์ 1 ฝ่ายงานอย่างถูกต้อง</p>
      </div>`;
    }

    const cardsHtml = dupeKeys.map(key => {
      const records = dupes[key];
      const first = records[0];
      const studentName = `${first.fullName} (${first.nickname || '-'})`;
      const roomAndNumber = `ห้อง ${first.classRoom} · เลขที่ ${first.numberLabel}`;

      const itemsHtml = records.map((rec, idx) => {
        const timeStr = rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString('th-TH') : '-';
        const roleStr = rec.roleCategory === 'central'
          ? rec.position
          : `${rec.department}${rec.sportType ? ` (${rec.sportType})` : ''} - ${rec.position}`;

        return `
        <div class="dupe-role-item">
          <div>
            <div style="font-weight:600;font-size:13.5px;color:var(--admin-text-main);">${roleStr}</div>
            <div style="font-size:11px;color:var(--admin-text-muted);">เวลาลงทะเบียน: ${timeStr} · ID: ${rec.id.substring(0, 8)}...</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary" style="padding:4px 10px;font-size:11.5px;" onclick="PinkAdmin.resolveDuplicateKeep('${key}', '${rec.id}')">คงฝ่ายนี้</button>
          </div>
        </div>`;
      }).join('');

      return `
      <div class="glass-panel dupe-card">
        <div class="dupe-header">
          <div>
            <h4 style="font-size:16px;font-weight:700;color:var(--admin-text-main);">${studentName}</h4>
            <div style="font-size:12.5px;color:var(--admin-text-muted);">${roomAndNumber}</div>
          </div>
          <span style="background:rgba(245,158,11,0.2);color:#f59e0b;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;">ลงซ้ำ ${records.length} ฝ่าย</span>
        </div>
        <div class="dupe-roles-list">
          ${itemsHtml}
        </div>
        <div style="font-size:11.5px;color:var(--admin-text-muted);display:flex;align-items:center;justify-content:space-between;">
          <span>คลิก <strong>"คงฝ่ายนี้"</strong> เพื่อเก็บรายการที่ถูกต้อง และลบรายการอื่นออกจากระบบ</span>
        </div>
      </div>`;
    }).join('');

    return `
    <div style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <h3 style="font-size:18px;font-weight:700;">ศูนย์จัดการนักเรียนลงทะเบียนซ้ำซ้อน</h3>
        <p style="font-size:13px;color:var(--admin-text-muted);">พบรายการที่ลงซ้ำ ${dupeKeys.length} คน สตาฟสามารถตัดสินใจเลือกคงฝ่ายงานที่ถูกต้องได้ทันที</p>
      </div>
      <button class="btn btn-ghost" onclick="PinkAdmin.refreshRecords()">รีเฟรชข้อมูล</button>
    </div>
    ${cardsHtml}`;
  }

  /* -------------------------------------------------------------
     TAB 3: QUOTAS & POLICIES CONTROL
     ------------------------------------------------------------- */
  function renderQuotas() {
    const depts = adminSettings.departments || AttendanceConfig.DEPARTMENTS;

    const deptRowsHtml = depts.map((d, index) => {
      const isClosed = Boolean(d.isClosed);
      const capacityVal = typeof d.maxCapacity === 'number' ? d.maxCapacity : '';

      return `
      <div class="setting-row">
        <div class="setting-info" style="flex:1;">
          <h4>${d.name}</h4>
          <p>${d.isStand ? 'ฝ่ายสแตนเชียร์' : (d.hasSports ? 'ฝ่ายกีฬา (มี 10 ชนิดกีฬา)' : 'ฝ่ายงานทั่วไป')}</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="display:flex;flex-direction:column;align-items:flex-end;">
            <label style="font-size:11px;color:var(--admin-text-muted);margin-bottom:2px;">โควตา (คน)</label>
            <input type="number" min="0" placeholder="ไม่จำกัด" value="${capacityVal}" 
              style="width:90px;background:#fff;border:1px solid var(--admin-border-dark);color:var(--admin-text-main);padding:6px 10px;border-radius:8px;font-size:13px;text-align:center;"
              onchange="PinkAdmin.updateDeptCapacity(${index}, this.value)" />
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;">
            <label style="font-size:11px;color:var(--admin-text-muted);margin-bottom:2px;">เปิดรับสมัคร</label>
            <label class="switch">
              <input type="checkbox" ${!isClosed ? 'checked' : ''} onchange="PinkAdmin.toggleDeptClosed(${index}, !this.checked)" />
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="glass-panel settings-section">
      <div class="settings-section-title">ตั้งค่าโควตาและการเปิด/ปิดรับสมัครรายฝ่าย</div>
      <div class="settings-section-desc">ปรับเปลี่ยนตัวเลขจำนวนคนที่รับ หรือเปิด/ปิดรับสมัครฝ่ายงานได้แบบไดนามิกทันทีโดยไม่ต้องแก้โค้ด</div>
      ${deptRowsHtml}
    </div>

    <div class="glass-panel settings-section">
      <div class="settings-section-title">นโยบายและกฎการลงทะเบียน</div>
      <div class="settings-section-desc">ควบคุมความเข้มงวดของระบบลงทะเบียนสำหรับนักเรียนทุกคน</div>
      
      <div class="setting-row">
        <div class="setting-info">
          <h4>ล็อกสิทธิ์ 1 คนต่อ 1 ฝ่ายงาน (Strict 1-Person Policy)</h4>
          <p>ป้องกันไม่ให้นักเรียนที่มีเลขที่และห้องเดียวกันลงทะเบียนซ้ำข้ามฝ่าย</p>
        </div>
        <label class="switch">
          <input type="checkbox" ${adminSettings.strictOnePerson ? 'checked' : ''} onchange="PinkAdmin.toggleSetting('strictOnePerson', this.checked)" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <h4>ฝ่ายสแตนเชียร์สงวนสิทธิ์เฉพาะ ม.1 เท่านั้น</h4>
          <p>ซ่อนตัวเลือกฝ่ายสแตนเชียร์สำหรับพี่ ม.2 - ม.6</p>
        </div>
        <label class="switch">
          <input type="checkbox" ${adminSettings.m1StandOnly ? 'checked' : ''} onchange="PinkAdmin.toggleSetting('m1StandOnly', this.checked)" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <h4>รหัสผ่าน PIN สำหรับสตาฟ</h4>
          <p>ใช้สำหรับเข้าถึงศูนย์ควบคุมนี้ (ค่าปัจจุบัน: <strong>${adminSettings.adminPin || '2569'}</strong>)</p>
        </div>
        <button class="btn btn-ghost" onclick="PinkAdmin.changePinPrompt()">เปลี่ยนรหัส PIN</button>
      </div>
    </div>`;
  }

  /* -------------------------------------------------------------
     TAB 4: STUDENT DIRECTORY
     ------------------------------------------------------------- */
  function renderDirectory() {
    const records = liveRecords.slice().reverse();

    const rowsHtml = records.map((r, i) => {
      const roleStr = r.roleCategory === 'central'
        ? `<span style="color:#ec4899;font-weight:600;">${r.position}</span>`
        : `<strong>${r.department || '-'}</strong> ${r.sportType ? `(${r.sportType})` : ''} · ${r.position || '-'}`;

      return `
      <tr>
        <td style="color:var(--admin-text-muted);font-size:12px;">${records.length - i}</td>
        <td><strong>${r.fullName}</strong> <span style="color:var(--admin-text-muted);">(${r.nickname || '-'})</span></td>
        <td>${r.classRoom}</td>
        <td>${r.numberLabel}</td>
        <td>${roleStr}</td>
        <td>
          <button class="btn btn-ghost" style="padding:4px 8px;font-size:11px;" onclick="PinkAdmin.openEditModal('${r.id}')">แก้ไข</button>
        </td>
      </tr>`;
    }).join('');

    return `
    <div class="glass-panel" style="padding:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <div>
          <h3 style="font-size:17px;font-weight:700;">รายชื่อผู้ลงทะเบียนทั้งหมด (${records.length} คน)</h3>
          <p style="font-size:12px;color:var(--admin-text-muted);">ตรวจสอบข้อมูลรายคนและแก้ไขบทบาทหน้าที่</p>
        </div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="dirSearchInput" placeholder="พิมพ์ชื่อ, ห้อง หรือเลขที่เพื่อกรอง..." 
            style="background:#fff;border:1px solid var(--admin-border-dark);color:var(--admin-text-main);padding:8px 12px;border-radius:10px;font-size:13px;width:220px;"
            oninput="PinkAdmin.filterDirectory(this.value)" />
          <button class="btn btn-ghost" onclick="PinkAdmin.refreshRecords()">รีเฟรช</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="admin-table" id="directoryTable">
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>ชื่อ-นามสกุล</th>
              <th>ห้อง</th>
              <th>เลขที่</th>
              <th>ฝ่ายงานและตำแหน่ง</th>
              <th style="width:80px;">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  /* -------------------------------------------------------------
     TAB 5: EXPORT & PRINT
     ------------------------------------------------------------- */
  function renderExport() {
    return `
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;">
      <div class="glass-panel" style="padding:24px;">
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px;">ส่งออกข้อมูลเป็น CSV (Excel)</h3>
        <p style="font-size:13px;color:var(--admin-text-muted);margin-bottom:20px;">ดาวน์โหลดข้อมูลนักเรียนทั้งหมดในรูปแบบไฟล์ CSV พร้อมรองรับภาษาไทยสำหรับเปิดใน Microsoft Excel หรือ Google Sheets</p>
        <button class="btn btn-primary" onclick="PinkAdmin.exportCSV()">ดาวน์โหลดไฟล์ CSV</button>
      </div>

      <div class="glass-panel" style="padding:24px;">
        <h3 style="font-size:17px;font-weight:700;margin-bottom:8px;">พิมพ์ใบเช็คชื่อ A4 (Print Ready)</h3>
        <p style="font-size:13px;color:var(--admin-text-muted);margin-bottom:20px;">จัดหน้ารายชื่อนักเรียนแยกตามห้องหรือฝ่ายงาน สำหรับสั่งพิมพ์ลงกระดาษ A4 เพื่อใช้ในการเช็คชื่อหน้างานจริง</p>
        <button class="btn btn-ghost" onclick="window.print()">สั่งพิมพ์หน้านี้ (Print A4)</button>
      </div>
    </div>`;
  }

  /* -------------------------------------------------------------
     ACTIONS & CONTROLLERS
     ------------------------------------------------------------- */
  function setupEventListeners() {
    // PIN Inputs auto-focus
    const digits = document.querySelectorAll('.pin-digit');
    digits.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < digits.length - 1) {
          digits[index + 1].focus();
        }
        checkFullPin();
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          digits[index - 1].focus();
        }
      });
    });
  }

  function checkFullPin() {
    const digits = Array.from(document.querySelectorAll('.pin-digit')).map(d => d.value).join('');
    if (digits.length === 4) {
      const isValid = verifyPin(digits);
      if (!isValid) {
        alert('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        document.querySelectorAll('.pin-digit').forEach(d => d.value = '');
        document.querySelectorAll('.pin-digit')[0].focus();
      }
    }
  }

  window.PinkAdmin = {
    init,
    switchTab,
    refreshRecords: loadLiveRecords,
    logout() {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      location.reload();
    },
    updateDeptCapacity(deptIndex, newCapacity) {
      const num = newCapacity.trim() === '' ? null : parseInt(newCapacity, 10);
      adminSettings.departments[deptIndex].maxCapacity = isNaN(num) ? null : num;
      AttendanceConfig.saveSettings(adminSettings);
      renderActiveTab();
    },
    toggleDeptClosed(deptIndex, isClosed) {
      adminSettings.departments[deptIndex].isClosed = isClosed;
      AttendanceConfig.saveSettings(adminSettings);
      renderActiveTab();
    },
    toggleSetting(key, val) {
      adminSettings[key] = val;
      AttendanceConfig.saveSettings(adminSettings);
      renderActiveTab();
    },
    changePinPrompt() {
      const newPin = prompt('กรุณากรอกรหัส PIN สตาฟ 4 หลักใหม่:', adminSettings.adminPin || '2569');
      if (newPin && newPin.trim().length === 4) {
        adminSettings.adminPin = newPin.trim();
        AttendanceConfig.saveSettings(adminSettings);
        alert('เปลี่ยนรหัส PIN เรียบร้อยแล้ว');
        renderActiveTab();
      }
    },
    resolveDuplicateKeep(studentKey, keepId) {
      const dupes = AttendanceStore.getDuplicateStudents();
      const records = dupes[studentKey];
      if (!records) return;

      const keepRecord = records.find(r => r.id === keepId);
      if (!keepRecord) return;

      const confirmMsg = `ยืนยันการคงรายการ:\n${keepRecord.fullName} -> ${keepRecord.department || keepRecord.position}\n\nระบบจะเก็บรายการนี้ และนำรายการอื่นของคนนี้ออก`;
      if (!confirm(confirmMsg)) return;

      // Filter local liveRecords to remove other records of this student
      liveRecords = liveRecords.filter(r => {
        const isSameStudent = `${r.classRoom}|${r.numberLabel}` === studentKey;
        if (isSameStudent) {
          return r.id === keepId;
        }
        return true;
      });

      AttendanceStore.setRegs(liveRecords);
      AttendanceAPI.setCachedData(liveRecords);
      renderActiveTab();
      alert('ปรับปรุงข้อมูลเรียบร้อยแล้ว รายชื่อถูกอัปเดตทันที');
    },
    filterDirectory(query) {
      const q = query.trim().toLowerCase();
      const rows = document.querySelectorAll('#directoryTable tbody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    },
    exportCSV() {
      if (liveRecords.length === 0) {
        alert('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }
      let csvContent = '\uFEFF'; // UTF-8 BOM for Thai support in Excel
      csvContent += 'ลำดับ,ชื่อ-นามสกุล,ชื่อเล่น,ห้อง,เลขที่,ประเภทบทบาท,ฝ่ายงาน,ตำแหน่ง,กีฬา,เวลาลงทะเบียน\n';

      liveRecords.forEach((r, idx) => {
        const row = [
          idx + 1,
          `"${(r.fullName || '').replace(/"/g, '""')}"`,
          `"${(r.nickname || '').replace(/"/g, '""')}"`,
          `"${r.classRoom || ''}"`,
          `"${r.numberLabel || ''}"`,
          `"${r.roleCategory || ''}"`,
          `"${r.department || ''}"`,
          `"${r.position || ''}"`,
          `"${r.sportType || ''}"`,
          `"${r.timestamp ? new Date(r.timestamp).toLocaleString('th-TH') : ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `pink_attendance_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    openEditModal(recordId) {
      editingRecordId = recordId;
      const rec = liveRecords.find(r => r.id === recordId);
      if (!rec) return;

      const modalHtml = `
      <div class="modal-overlay" id="editModalOverlay">
        <div class="glass-panel modal-content">
          <h3 style="font-size:18px;font-weight:700;margin-bottom:12px;">แก้ไขข้อมูลนักเรียน</h3>
          <div style="margin-bottom:12px;">
            <label style="font-size:12px;color:var(--admin-text-muted);">ชื่อ-นามสกุล</label>
            <input type="text" id="editFullName" value="${rec.fullName}" style="width:100%;padding:8px 12px;background:#fff;border:1px solid var(--admin-border-dark);color:var(--admin-text-main);border-radius:8px;font-size:14px;margin-top:4px;" />
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:12px;color:var(--admin-text-muted);">ชื่อเล่น</label>
            <input type="text" id="editNickname" value="${rec.nickname || ''}" style="width:100%;padding:8px 12px;background:#fff;border:1px solid var(--admin-border-dark);color:var(--admin-text-main);border-radius:8px;font-size:14px;margin-top:4px;" />
          </div>
          <div style="margin-bottom:16px;">
            <label style="font-size:12px;color:var(--admin-text-muted);">ฝ่ายงาน</label>
            <select id="editDepartment" style="width:100%;padding:8px 12px;background:#fff;border:1px solid var(--admin-border-dark);color:var(--admin-text-main);border-radius:8px;font-size:14px;margin-top:4px;">
              ${AttendanceConfig.DEPARTMENTS.map(d => `<option value="${d.name}" ${rec.department === d.name ? 'selected' : ''}>${d.name}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button class="btn btn-danger" onclick="PinkAdmin.deleteRecord('${rec.id}')">ลบรายการนี้</button>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-ghost" onclick="PinkAdmin.closeEditModal()">ยกเลิก</button>
              <button class="btn btn-primary" onclick="PinkAdmin.saveRecordEdit()">บันทึก</button>
            </div>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },
    closeEditModal() {
      const modal = document.getElementById('editModalOverlay');
      if (modal) modal.remove();
      editingRecordId = null;
    },
    saveRecordEdit() {
      const rec = liveRecords.find(r => r.id === editingRecordId);
      if (!rec) return;

      rec.fullName = document.getElementById('editFullName').value.trim();
      rec.nickname = document.getElementById('editNickname').value.trim();
      rec.department = document.getElementById('editDepartment').value;

      AttendanceStore.setRegs(liveRecords);
      AttendanceAPI.setCachedData(liveRecords);
      this.closeEditModal();
      renderActiveTab();
      alert('บันทึกการแก้ไขเรียบร้อยแล้ว');
    },
    deleteRecord(recordId) {
      if (!confirm('ต้องการลบรายการนี้ออกจากระบบหรือไม่?')) return;
      liveRecords = liveRecords.filter(r => r.id !== recordId);
      AttendanceStore.setRegs(liveRecords);
      AttendanceAPI.setCachedData(liveRecords);
      this.closeEditModal();
      renderActiveTab();
      alert('ลบรายการเรียบร้อยแล้ว');
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
