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

  const AUTH_STORAGE_KEY = 'pink_admin_auth_token_v2';
  const AUTH_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 Hours Session Window

  function init() {
    checkAuth();
    setupEventListeners();
    loadLiveRecords();
  }

  function checkAuth() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const authData = JSON.parse(raw);
        const now = Date.now();
        if (authData && authData.authed && (now - Number(authData.loginTime || 0)) < AUTH_EXPIRY_MS) {
          isAuthed = true;
          hidePinScreen();
          renderActiveTab();
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse auth token:', e);
    }
    isAuthed = false;
    showPinScreen();
  }

  function showPinScreen() {
    const loginSection = document.getElementById('loginSection');
    const adminHeader = document.getElementById('adminHeader');
    const adminBottomBar = document.getElementById('adminBottomBar');
    const adminContent = document.getElementById('adminTabContent');

    if (loginSection) loginSection.style.display = 'block';
    if (adminHeader) adminHeader.style.display = 'none';
    if (adminBottomBar) adminBottomBar.style.display = 'none';
    if (adminContent) adminContent.style.display = 'none';
  }

  function hidePinScreen() {
    const loginSection = document.getElementById('loginSection');
    const adminHeader = document.getElementById('adminHeader');
    const adminBottomBar = document.getElementById('adminBottomBar');
    const adminContent = document.getElementById('adminTabContent');

    if (loginSection) loginSection.style.display = 'none';
    if (adminHeader) adminHeader.style.display = 'flex';
    if (adminBottomBar) adminBottomBar.style.display = 'flex';
    if (adminContent) adminContent.style.display = 'block';
  }

  function verifyPin(inputPin) {
    const targetPin = adminSettings.adminPin || AttendanceConfig.DEFAULT_ADMIN_PIN;
    if (inputPin === targetPin) {
      isAuthed = true;
      const authPayload = {
        authed: true,
        loginTime: Date.now()
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authPayload));
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
    const bottomBadge = document.getElementById('bottomDupeBadge');
    if (bottomBadge) {
      bottomBadge.textContent = dupeCount;
      bottomBadge.style.display = dupeCount > 0 ? 'inline-block' : 'none';
    }
  }

  function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    document.querySelectorAll('.drawer-item').forEach(btn => {
      if (btn.getAttribute('data-drawer-tab') === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    renderActiveTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderActiveTab() {
    if (!isAuthed) return;
    const container = document.getElementById('adminTabContent');
    if (!container) return;

    if (currentTab === 'dashboard') container.innerHTML = renderDashboard();
    else if (currentTab === 'duplicates') container.innerHTML = renderDuplicates();
    else if (currentTab === 'quotas') container.innerHTML = renderQuotas();
    else if (currentTab === 'directory') container.innerHTML = renderDirectory();
    

    updateHeaderCounts();
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
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem('pink_admin_authenticated_v1');
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
