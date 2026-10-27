let activeHomeSubTab = 'overview';
let activeRoleCategory = 'department';
let studentSearchQuery = '';
let activeGradeFilter = 'ALL';
let activeRoomFilter = '';
let activeAccordionDept = 'ฝ่ายอุปกรณ์';

function esc(sourceString) {
  return String(sourceString == null ? '' : sourceString).replace(/[&<>"']/g, matchChar => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[matchChar]));
}

function getVal(elementIdentifier) {
  const targetElement = document.getElementById(elementIdentifier);
  return targetElement ? targetElement.value : '';
}

function updateDockGlider(targetViewName) {
  const dockGliderElement = document.getElementById('dockGlider');
  if (!dockGliderElement) return;

  const viewIndices = { home: 0, register: 1, classes: 2, departments: 3 };
  const targetIndex = viewIndices[targetViewName] != null ? viewIndices[targetViewName] : 0;
  dockGliderElement.style.transform = `translateX(${targetIndex * 100}%)`;
}

function updateRoleGlider(categoryKey) {
  const glider = document.getElementById('roleCategoryGlider');
  if (!glider) return;
  const isCentral = categoryKey === 'central';
  glider.style.transform = isCentral ? 'translateX(100%)' : 'translateX(0%)';
}

function updateGradeGlider(gradeKey) {
  const track = document.getElementById('gradeTrack');
  const glider = document.getElementById('gradeGlider');
  if (!track || !glider) return;
  const targetBtn = track.querySelector('[data-grade="' + gradeKey + '"]');
  if (!targetBtn) return;
  glider.style.width = targetBtn.offsetWidth + 'px';
  glider.style.transform = 'translateX(' + targetBtn.offsetLeft + 'px)';
}

function updateSegmentedGlider(subTabIdentifier) {
  const gliderElement = document.getElementById('segmentedGlider');
  if (!gliderElement) return;

  const subTabIndices = { overview: 0, structure: 1, stats: 2 };
  const targetIndex = subTabIndices[subTabIdentifier] != null ? subTabIndices[subTabIdentifier] : 0;
  gliderElement.style.transform = `translateX(${targetIndex * 100}%)`;
}

function renderHeroBanner(registeredCount) {
  return `
  <section><div class="wrap">
    <div class="ios-hero-card">
      <div class="status-pill-badge">
        <span class="brand-orb" style="width:7px;height:7px;"></span>
        <span>ระบบลงทะเบียนปีการศึกษา 2569</span>
      </div>
      <h1>อยุธยาสีชมพู <span class="accent">ปี 2569</span></h1>
      <p>จัดสรรบทบาทหน้าที่และตรวจสอบฝ่ายงาน คณะสีชมพู โรงเรียนสารคามพิทยาคม</p>
      <div class="ios-hero-cta">
        <button class="btn btn-primary" onclick="AttendanceApp.navigate('register')">ลงทะเบียนบทบาท</button>
        <button class="btn btn-outline" onclick="AttendanceApp.navigate('classes')">ค้นหารายชื่อ</button>
      </div>
    </div>
    <div class="ios-stats-grid">
      <div class="ios-stat-pill"><span class="num">${AttendanceConfig.GRADES.length}</span><span class="lbl">ระดับชั้น</span></div>
      <div class="ios-stat-pill"><span class="num">${AttendanceConfig.ALL_ROOMS.length}</span><span class="lbl">ห้องเรียน</span></div>
      <div class="ios-stat-pill"><span class="num">${AttendanceConfig.DEPARTMENTS.length}</span><span class="lbl">ฝ่ายงาน</span></div>
      <div class="ios-stat-pill"><span class="num">${registeredCount}</span><span class="lbl">ผู้ลงทะเบียน</span></div>
    </div>
  </div></section>`;
}

function renderHomeSegmentedTabs() {
  const subTabIndices = { overview: 0, structure: 1, stats: 2 };
  const currentIndex = subTabIndices[activeHomeSubTab] != null ? subTabIndices[activeHomeSubTab] : 0;

  return `
  <div class="wrap">
    <div class="ios-segmented-wrap">
      <div class="ios-segmented-glider" id="segmentedGlider" style="transform: translateX(${currentIndex * 100}%);"></div>
      <button class="ios-segmented-btn ${activeHomeSubTab === 'overview' ? 'active' : ''}" onclick="AttendanceApp.switchHomeTab('overview')">ภาพรวมระดับชั้น</button>
      <button class="ios-segmented-btn ${activeHomeSubTab === 'structure' ? 'active' : ''}" onclick="AttendanceApp.switchHomeTab('structure')">โครงสร้างฝ่ายงาน</button>
      <button class="ios-segmented-btn ${activeHomeSubTab === 'stats' ? 'active' : ''}" onclick="AttendanceApp.switchHomeTab('stats')">สถิติล่าสุด</button>
    </div>
  </div>`;
}

function renderGradeOverview() {
  const cardsHtml = AttendanceConfig.GRADES.map(gradeGroup => `
    <div class="ios-grade-card">
      <h3>${gradeGroup.grade}</h3>
      <div class="room-chips">${gradeGroup.rooms.map(roomName => `<span class="chip">${roomName}</span>`).join('')}</div>
      ${gradeGroup.locked ? `<div class="grade-note">${gradeGroup.note}</div>` : ''}
    </div>`).join('');

  return `
  <section class="view-enter-anim"><div class="wrap">
    <div class="ios-section-head"><h2>กลุ่มห้องเรียนที่เข้าร่วม</h2><p>เลือกดูห้องเรียนและสิทธิ์การลงทะเบียนของแต่ละระดับชั้น</p></div>
    <div class="ios-grade-grid">${cardsHtml}</div>
  </div></section>`;
}

function renderDeptStructure() {
  const deptCardsHtml = AttendanceConfig.DEPARTMENTS.map((deptDefinition, deptIndex) => `
    <div class="ios-grade-card">
      <div class="accordion-num" style="margin-bottom:8px;">${String(deptIndex + 1).padStart(2, '0')}</div>
      <h4 style="margin:0 0 4px;font-size:15px;color:var(--ios-primary-deep);">${deptDefinition.name}</h4>
      <div style="font-size:12px;color:var(--ios-muted);">${AttendanceConfig.NO_STAFF_DEPARTMENTS.includes(deptDefinition.name) ? 'ประธานฝ่าย · สมาชิกฝ่าย' : 'ประธานฝ่าย · สตาฟ · สมาชิก'}</div>
      ${deptDefinition.deputyLabel ? `<div style="font-size:11.5px;color:var(--ios-primary);margin-top:6px;">${deptDefinition.deputyLabel} 1 คน</div>` : ''}
      ${deptDefinition.isStand ? `<div style="font-size:11.5px;color:var(--ios-primary);margin-top:6px;">ม.1 เข้าเป็นสมาชิกฝ่าย</div>` : ''}
    </div>`).join('');

  return `
  <section class="view-enter-anim"><div class="wrap">
    <div class="ios-section-head"><h2>โครงสร้างตำแหน่งคณะสี</h2><p>การจัดสรรและอัตรากำลังคนของแต่ละฝ่าย</p></div>
    <div class="ios-grade-card" style="margin-bottom:12px;">
      <h3 style="font-size:15px;margin:0 0 8px;color:var(--ios-primary-deep);">ตำแหน่งบริหารคณะสี (ตำแหน่งละ 1 คน)</h3>
      <div class="name-list">${AttendanceConfig.CENTRAL_POSITIONS.map(positionTitle => `<span class="name-tag">${positionTitle}</span>`).join('')}</div>
    </div>
    <div class="ios-grade-grid">${deptCardsHtml}</div>
    <div class="ios-grade-card" style="margin-top:12px;">
      <h3 style="font-size:15px;margin:0 0 6px;color:var(--ios-primary-deep);">ประเภทกีฬา (10 ชนิดกีฬา)</h3>
      <p style="font-size:12px;color:var(--ios-muted);margin:0 0 10px;">แต่ละประเภทมีหัวหน้ากีฬา 1 คน พร้อมสตาฟและนักกีฬา</p>
      <div class="name-list">${AttendanceConfig.SPORT_TYPES.map(sportName => `<span class="name-tag">${sportName}</span>`).join('')}</div>
    </div>
  </div></section>`;
}

function renderLiveStats(appState) {
  const deptRowsHtml = AttendanceConfig.DEPARTMENTS.map(deptItem => {
    const memberCount = AttendanceStore.countDept(deptItem.name);
    return `<div class="dept-count-row"><span>${deptItem.name}</span><span class="n">${memberCount} คน</span></div>`;
  }).join('');

  const committeeRowsHtml = AttendanceConfig.CENTRAL_POSITIONS.map(positionTitle => {
    const leaderRecord = AttendanceStore.isCentralTaken(positionTitle);
    const occupantText = leaderRecord ? `${leaderRecord.fullName} (${leaderRecord.nickname})` : '<span class="empty">ว่าง</span>';
    return `<div class="committee-row"><span class="role">${positionTitle}</span><span class="who">${occupantText}</span></div>`;
  }).join('');

  return `
  <section class="view-enter-anim"><div class="wrap">
    <div class="ios-section-head"><h2>รายงานจำนวนสมาชิกล่าสุด</h2><p>อัปเดตแบบเรียลไทม์จากข้อมูลจริง</p></div>
    <div class="live-grid">
      <div class="live-card">
        <h4>สรุปจำนวนคนตามฝ่ายงาน</h4>
        ${deptRowsHtml}
      </div>
      <div class="live-card">
        <h4>คณะกรรมการส่วนกลาง</h4>
        ${committeeRowsHtml}
      </div>
    </div>
  </div></section>`;
}

function renderHome(appState) {
  let subContentHtml = '';
  if (activeHomeSubTab === 'overview') subContentHtml = renderGradeOverview();
  else if (activeHomeSubTab === 'structure') subContentHtml = renderDeptStructure();
  else if (activeHomeSubTab === 'stats') subContentHtml = renderLiveStats(appState);

  return renderHeroBanner(appState.regs.length) + renderHomeSegmentedTabs() + subContentHtml;
}

function renderClassFilters() {
  const gradeButtonsHtml = [
    `<button class="ios-chip-btn ${activeGradeFilter === 'ALL' ? 'active' : ''}" data-grade="ALL" onclick="AttendanceApp.setGradeFilter('ALL')">ทั้งหมด</button>`,
    ...AttendanceConfig.GRADES.map(gradeGroup => `
      <button class="ios-chip-btn ${activeGradeFilter === gradeGroup.grade ? 'active' : ''}" data-grade="${gradeGroup.grade}" onclick="AttendanceApp.setGradeFilter('${gradeGroup.grade}')">${gradeGroup.grade}</button>
    `)
  ].join('');

  let roomChipsHtml = '';
  if (activeGradeFilter !== 'ALL') {
    const matchedGrade = AttendanceConfig.GRADES.find(gradeGroup => gradeGroup.grade === activeGradeFilter);
    if (matchedGrade) {
      roomChipsHtml = `
      <div class="ios-thumb-scroll" style="padding-top:0;">
        <button class="ios-chip-btn ${activeRoomFilter === '' ? 'active' : ''}" onclick="AttendanceApp.setRoomFilter('')">ทุกห้องใน ${matchedGrade.grade}</button>
        ${matchedGrade.rooms.map(roomName => `
          <button class="ios-chip-btn ${activeRoomFilter === roomName ? 'active' : ''}" onclick="AttendanceApp.setRoomFilter('${roomName}')">${roomName}</button>
        `).join('')}
      </div>`;
    }
  }

  return `
  <div class="ios-search-wrap">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <input type="text" class="ios-search-input" id="studentSearchInput" placeholder="พิมพ์ชื่อ, ชื่อเล่น, หรือเลขที่เพื่อค้นหา..." value="${esc(studentSearchQuery)}" oninput="AttendanceApp.onSearchInput(this.value)" />
  </div>
  <div class="ios-thumb-scroll"><div class="ios-grade-track" id="gradeTrack"><div class="ios-grade-glider" id="gradeGlider"></div>${gradeButtonsHtml}</div></div>
  ${roomChipsHtml}`;
}

function filterStudents(records) {
  const normalizedQuery = studentSearchQuery.trim().toLowerCase();

  return records.filter(recordItem => {
    if (activeGradeFilter !== 'ALL') {
      const roomMatchesGrade = recordItem.classRoom && recordItem.classRoom.startsWith(activeGradeFilter);
      if (!roomMatchesGrade) return false;
    }
    if (activeRoomFilter && recordItem.classRoom !== activeRoomFilter) {
      return false;
    }
    if (!normalizedQuery) return true;

    const nameMatch = (recordItem.fullName || '').toLowerCase().includes(normalizedQuery);
    const nicknameMatch = (recordItem.nickname || '').toLowerCase().includes(normalizedQuery);
    const numberMatch = (recordItem.numberLabel || '').toLowerCase().includes(normalizedQuery);
    const roomMatch = (recordItem.classRoom || '').toLowerCase().includes(normalizedQuery);
    const deptMatch = (recordItem.department || '').toLowerCase().includes(normalizedQuery);

    return nameMatch || nicknameMatch || numberMatch || roomMatch || deptMatch;
  });
}

function groupAndRenderStudents(studentRecords) {
  const studentGroups = [];
  const groupRegistry = {};

  studentRecords.forEach(entry => {
    const studentHash = `${entry.classRoom}|${entry.numberLabel}|${entry.fullName}`;
    if (!groupRegistry[studentHash]) {
      groupRegistry[studentHash] = {
        classRoom: entry.classRoom,
        numberLabel: entry.numberLabel,
        fullName: entry.fullName,
        nickname: entry.nickname,
        roles: []
      };
      studentGroups.push(groupRegistry[studentHash]);
    }
    const roleTitle = entry.roleCategory === 'central' ? entry.position : (entry.department + (entry.sportType ? ` · ${entry.sportType}` : '') + ` · ${entry.position}`);
    const isLeader = entry.position === 'ประธานฝ่าย' || entry.roleCategory === 'central' || entry.position === 'หัวหน้ากีฬา';
    groupRegistry[studentHash].roles.push({ text: roleTitle, isLeader });
  });

  return studentGroups.map(studentItem => {
    const badgesHtml = studentItem.roles.map(roleItem => `<span class="ios-badge ${roleItem.isLeader ? 'lead' : ''}">${esc(roleItem.text)}</span>`).join('');
    return `
    <div class="ios-result-card">
      <div>
        <div class="who">${esc(studentItem.fullName)} <span style="color:var(--ios-muted);font-weight:400;">(${esc(studentItem.nickname)})</span></div>
        <div class="sub">ห้อง ${studentItem.classRoom} · เลขที่ ${studentItem.numberLabel}${studentItem.roles.length > 1 ? ` · ลงทะเบียน ${studentItem.roles.length} บทบาท` : ''}</div>
      </div>
      <div class="badge-group">${badgesHtml}</div>
    </div>`;
  }).join('');
}

function renderClasses(appState) {
  const filteredList = filterStudents(appState.regs).sort((alpha, beta) => (alpha.classRoom || '').localeCompare(beta.classRoom || '', 'th') || (alpha.numberLabel || '').localeCompare(beta.numberLabel || '', 'th'));

  let resultsHtml = '';
  if (filteredList.length === 0) {
    resultsHtml = `<div class="empty-state">ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข</div>`;
  } else {
    resultsHtml = groupAndRenderStudents(filteredList);
  }

  return `
  <div class="wrap view-enter-anim" style="padding-top:6px;">
    <div class="ios-section-head">
      <h2>ค้นหาและดูข้อมูลตามห้อง</h2>
      <p>พบรายชื่อนักเรียน ${filteredList.length} รายการ</p>
    </div>
    ${renderClassFilters()}
    <div id="classResultsList" style="margin-top:6px;">${resultsHtml}</div>
  </div>`;
}

function renderDepartments(appState) {
  const accordionItemsHtml = AttendanceConfig.DEPARTMENTS.map((deptMetadata, deptIndex) => {
    const isOpen = activeAccordionDept === deptMetadata.name;
    const memberCount = AttendanceStore.countDept(deptMetadata.name);
    const deptMembers = appState.regs.filter(entry => entry.department === deptMetadata.name);

    let detailContentHtml = '';
    if (deptMetadata.hasSports) detailContentHtml = buildSportsDeptDetail(deptMembers);
    else if (deptMetadata.isStand) detailContentHtml = buildStandDeptDetail(deptMembers);
    else detailContentHtml = buildGeneralDeptDetail(deptMetadata, deptMembers);

    return `
    <div class="ios-accordion-card ${isOpen ? 'open' : ''}">
      <button class="ios-accordion-header" onclick="AttendanceApp.toggleDeptAccordion('${deptMetadata.name}')">
        <div class="accordion-title-block">
          <div class="accordion-num">${String(deptIndex + 1).padStart(2, '0')}</div>
          <div>
            <h3 class="accordion-title">${deptMetadata.name}</h3>
            <div class="accordion-sub">${AttendanceConfig.NO_STAFF_DEPARTMENTS.includes(deptMetadata.name) ? 'ประธานฝ่าย · สมาชิก' : 'ประธานฝ่าย · สตาฟ · สมาชิก'}</div>
          </div>
        </div>
        <div class="accordion-meta-block">
          <span class="ios-count-badge">${memberCount} คน</span>
          <svg class="ios-chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </button>
      <div class="ios-accordion-collapse">
        <div class="ios-accordion-inner">
          <div class="ios-accordion-body">${detailContentHtml}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="wrap view-enter-anim" style="padding-top:6px;">
    <div class="ios-section-head">
      <h2>รายชื่อสมาชิกแยกตามฝ่ายงาน</h2>
      <p>แตะเพื่อเปิดดูรายชื่อประธาน สตาฟ และสมาชิกในแต่ละฝ่าย</p>
    </div>
    <div class="ios-accordion-list">${accordionItemsHtml}</div>
  </div>`;
}

function buildSportsDeptDetail(deptMembers) {
  const presidentRecord = deptMembers.find(entry => entry.position === 'ประธานฝ่าย');
  let contentHtml = `<div class="detail-block"><h4>ประธานฝ่ายกีฬา (ภาพรวม)</h4>
    <div class="name-list">${presidentRecord ? `<span class="name-tag">${esc(presidentRecord.fullName)} (${esc(presidentRecord.nickname)})</span>` : `<span class="name-tag">ยังไม่มีผู้ดำรงตำแหน่ง</span>`}</div></div>`;

  AttendanceConfig.SPORT_TYPES.forEach(sportTitle => {
    const captainRecord = deptMembers.find(entry => entry.sportType === sportTitle && entry.position === 'หัวหน้ากีฬา');
    const staffMembers = deptMembers.filter(entry => entry.sportType === sportTitle && entry.position === 'สตาฟกีฬา');
    const athleteMembers = deptMembers.filter(entry => entry.sportType === sportTitle && entry.position === 'นักกีฬา');

    contentHtml += `<div class="sport-group"><div class="sname">${sportTitle}</div>
      <div class="name-list">
        ${captainRecord ? `<span class="ios-badge lead">หัวหน้า: ${esc(captainRecord.fullName)}</span>` : `<span class="ios-badge">หัวหน้า: ว่าง</span>`}
        ${staffMembers.map(entry => `<span class="name-tag">${esc(entry.fullName)} (สตาฟ)</span>`).join('')}
        ${athleteMembers.map(entry => `<span class="name-tag">${esc(entry.fullName)} (นักกีฬา)</span>`).join('')}
      </div></div>`;
  });
  return contentHtml;
}

function buildStandDeptDetail(deptMembers) {
  const mentors = deptMembers.filter(entry => !entry.autoAssigned);
  const m1Students = deptMembers.filter(entry => entry.autoAssigned);

  return `
  <div class="detail-block"><h4>สตาฟพี่เลี้ยง (ประธาน / สตาฟฝ่าย)</h4>
    <div class="name-list">${mentors.length ? mentors.map(entry => `<span class="name-tag">${esc(entry.fullName)} · ${esc(entry.position)}</span>`).join('') : '<span class="name-tag">ยังไม่มีข้อมูล</span>'}</div></div>
  <div class="detail-block"><h4>น้อง ม.1 (${m1Students.length} คน)</h4>
    <div class="name-list">${m1Students.length ? m1Students.map(entry => `<span class="name-tag">${esc(entry.fullName)} · ${esc(entry.classRoom)}</span>`).join('') : '<span class="name-tag">ยังไม่มีข้อมูล</span>'}</div></div>`;
}

function buildGeneralDeptDetail(deptMetadata, deptMembers) {
  const presidentRecord = deptMembers.find(entry => entry.position === 'ประธานฝ่าย');
  const deputyRecord = deptMetadata.deputyLabel ? deptMembers.find(entry => entry.position === deptMetadata.deputyLabel) : null;
  const staffMembers = deptMembers.filter(entry => entry.position === 'สตาฟฝ่าย');
  const regularMembers = deptMembers.filter(entry => entry.position === 'สมาชิกฝ่าย');

  let resultHtml = `<div class="detail-block"><h4>ประธานฝ่าย</h4><div class="name-list">${presidentRecord ? `<span class="name-tag">${esc(presidentRecord.fullName)} (${esc(presidentRecord.nickname)})</span>` : '<span class="name-tag">ยังไม่มีผู้ดำรงตำแหน่ง</span>'}</div></div>`;

  if (deptMetadata.deputyLabel) {
    resultHtml += `<div class="detail-block"><h4>${deptMetadata.deputyLabel}</h4><div class="name-list">${deputyRecord ? `<span class="name-tag">${esc(deputyRecord.fullName)} (${esc(deputyRecord.nickname)})</span>` : '<span class="name-tag">ยังไม่มีผู้ดำรงตำแหน่ง</span>'}</div></div>`;
  }
  if (!AttendanceConfig.NO_STAFF_DEPARTMENTS.includes(deptMetadata.name)) {
    resultHtml += `<div class="detail-block"><h4>สตาฟฝ่าย (${staffMembers.length} คน)</h4><div class="name-list">${staffMembers.length ? staffMembers.map(entry => `<span class="name-tag">${esc(entry.fullName)}</span>`).join('') : '<span class="name-tag">ยังไม่มีข้อมูล</span>'}</div></div>`;
  }
  resultHtml += `<div class="detail-block"><h4>สมาชิกฝ่าย (${regularMembers.length} คน)</h4><div class="name-list">${regularMembers.length ? regularMembers.map(entry => `<span class="name-tag">${esc(entry.fullName)}</span>`).join('') : '<span class="name-tag">ยังไม่มีข้อมูล</span>'}</div></div>`;
  return resultHtml;
}

function renderRegister() {
  return `
  <div class="wrap view-enter-anim" style="padding-top:6px;">
    <div class="ios-form-card">
      <div class="ios-section-head" style="margin-bottom:14px;">
        <h2>ลงทะเบียนข้อมูลและฝ่ายงาน</h2>
        <p>กรอกข้อมูลส่วนตัว และเลือกบทบาทหน้าที่ในคณะสีชมพู</p>
      </div>
      <div id="formMsgBox"></div>
      <div class="ios-form-title">01 ข้อมูลส่วนตัว</div>
      <div class="ios-field-grid">
        <div class="ios-field"><label>ชื่อ-นามสกุล <span class="req">*</span></label><input id="fullName" type="text" placeholder="กรอกชื่อ-นามสกุล" /></div>
        <div class="ios-field"><label>ชื่อเล่น <span class="req">*</span></label><input id="nickname" type="text" placeholder="กรอกชื่อเล่น" /></div>
      </div>
      <div class="ios-field-grid">
        <div class="ios-field">
          <label>ชั้น / ห้อง <span class="req">*</span></label>
          <select id="classRoom" onchange="AttendanceApp.onClassRoomChange()">
            <option value="">เลือกชั้น / ห้อง</option>
            ${AttendanceConfig.GRADES.map(gradeGroup => `<optgroup label="${gradeGroup.grade}">${gradeGroup.rooms.map(roomName => `<option value="${roomName}">${roomName}</option>`).join('')}</optgroup>`).join('')}
          </select>
        </div>
        <div class="ios-field">
          <label>เลขที่ <span class="req">*</span></label>
          <select id="number"><option value="">เลือกเลขที่และกลุ่ม</option>${AttendanceConfig.NUMBERS.map(numberName => `<option value="${numberName}">${numberName}</option>`).join('')}</select>
          <div class="hint">เลขที่ 1–20 กลุ่ม ก และ 1–20 กลุ่ม ข</div>
        </div>
      </div>
      <div class="ios-form-title">02 ตำแหน่งและฝ่ายงาน</div>
      <div id="roleSection">${buildRoleSectionHTML('')}</div>
      <div class="ios-note-box">ตำแหน่งสำคัญรับได้ตำแหน่งละ 1 คน ระบบตรวจสอบตำแหน่งว่างแบบเรียลไทม์จากข้อมูลจริง</div>
      <button class="ios-submit-btn" id="submitBtn" onclick="AttendanceApp.submitRegistration()">บันทึกข้อมูล</button>
    </div>
  </div>`;
}

function buildCentralPositionField() {
  const chosenPosition = getVal('centralPosition');
  const optionsHtml = AttendanceConfig.CENTRAL_POSITIONS.map(positionTitle => {
    const isOccupied = AttendanceStore.isCentralTaken(positionTitle);
    const isCurrentChoice = chosenPosition === positionTitle;
    return `<option value="${positionTitle}" ${isOccupied && !isCurrentChoice ? 'disabled' : ''} ${isCurrentChoice ? 'selected' : ''}>${positionTitle}${isOccupied ? ' (มีผู้รับแล้ว)' : ''}</option>`;
  }).join('');

  return `<div class="ios-field"><label>ตำแหน่ง <span class="req">*</span></label>
    <select id="centralPosition"><option value="">เลือกตำแหน่ง</option>${optionsHtml}</select></div>`;
}

function buildDeptPositionField(deptMetadata) {
  const chosenPosition = getVal('deptPosition');
  const availablePositions = ['ประธานฝ่าย', 'สตาฟฝ่าย', 'สมาชิกฝ่าย'];

  if (AttendanceConfig.NO_STAFF_DEPARTMENTS.includes(deptMetadata.name)) {
    const staffIndex = availablePositions.indexOf('สตาฟฝ่าย');
    if (staffIndex > -1) availablePositions.splice(staffIndex, 1);
  }
  if (deptMetadata.deputyLabel) availablePositions.splice(1, 0, deptMetadata.deputyLabel);

  const optionsHtml = availablePositions.map(positionTitle => {
    let isOccupied = false;
    if (positionTitle === 'ประธานฝ่าย') isOccupied = AttendanceStore.isDeptPresidentTaken(deptMetadata.name);
    else if (positionTitle === deptMetadata.deputyLabel) isOccupied = AttendanceStore.isDeputyTaken(deptMetadata.name, deptMetadata.deputyLabel);

    const isCurrentChoice = chosenPosition === positionTitle;
    return `<option value="${positionTitle}" ${isOccupied && !isCurrentChoice ? 'disabled' : ''} ${isCurrentChoice ? 'selected' : ''}>${positionTitle}${isOccupied ? ' (มีผู้รับแล้ว)' : ''}</option>`;
  }).join('');

  return `<div class="ios-field"><label>ตำแหน่ง <span class="req">*</span></label><select id="deptPosition">
    <option value="">เลือกตำแหน่ง</option>${optionsHtml}</select></div>`;
}

function buildSportsFields() {
  const selectedMode = getVal('sportsMode') || 'team';
  const isPresidentOccupied = AttendanceStore.isDeptPresidentTaken('ฝ่ายกีฬา');

  if (selectedMode === 'president') {
    return `
    <div class="ios-field-grid">
      <div class="ios-field"><label>บทบาทในฝ่ายกีฬา <span class="req">*</span></label>
        <select id="sportsMode" onchange="AttendanceApp.onRoleChange()">
          <option value="team">เข้าร่วมทีมกีฬา</option>
          <option value="president" selected>ประธานฝ่ายกีฬา (ภาพรวม)</option>
        </select>
      </div>
      <div class="ios-field"><label>&nbsp;</label><div class="hint" style="margin-top:12px;">ดูแลภาพรวมฝ่ายกีฬาทั้งหมด</div></div>
    </div>`;
  }

  const selectedSport = getVal('sportType');
  const roleDropdownHtml = selectedSport ? buildSportRoleDropdown(selectedSport) : '';

  return `
  <div class="ios-field-grid">
    <div class="ios-field"><label>บทบาทในฝ่ายกีฬา <span class="req">*</span></label>
      <select id="sportsMode" onchange="AttendanceApp.onRoleChange()">
        <option value="team" selected>เข้าร่วมทีมกีฬา</option>
        <option value="president" ${isPresidentOccupied ? 'disabled' : ''}>ประธานฝ่ายกีฬา (ภาพรวม)${isPresidentOccupied ? ' (มีผู้รับแล้ว)' : ''}</option>
      </select>
    </div>
    <div class="ios-field"><label>ประเภทกีฬา <span class="req">*</span></label>
      <select id="sportType" onchange="AttendanceApp.onRoleChange()">
        <option value="">เลือกประเภทกีฬา</option>
        ${AttendanceConfig.SPORT_TYPES.map(sportTitle => `<option value="${sportTitle}" ${selectedSport === sportTitle ? 'selected' : ''}>${sportTitle}</option>`).join('')}
      </select>
    </div>
  </div>
  ${roleDropdownHtml}`;
}

function buildSportRoleDropdown(sportTitle) {
  const chosenSportRole = getVal('sportRole');
  const teamRoles = ['หัวหน้ากีฬา', 'สตาฟกีฬา', 'นักกีฬา'];

  const optionsHtml = teamRoles.map(roleTitle => {
    const isOccupied = roleTitle === 'หัวหน้ากีฬา' ? AttendanceStore.isSportCaptainTaken(sportTitle) : false;
    const isCurrentChoice = chosenSportRole === roleTitle;
    return `<option value="${roleTitle}" ${isOccupied && !isCurrentChoice ? 'disabled' : ''} ${isCurrentChoice ? 'selected' : ''}>${roleTitle}${isOccupied ? ' (มีผู้รับแล้ว)' : ''}</option>`;
  }).join('');

  return `<div class="ios-field"><label>ตำแหน่งในทีม <span class="req">*</span></label><select id="sportRole">
    <option value="">เลือกตำแหน่ง</option>${optionsHtml}</select></div>`;
}

function buildDepartmentFields() {
  const selectedDeptName = getVal('department');
  if (!selectedDeptName) {
    return `
    <div class="ios-field-grid">
      <div class="ios-field"><label>ฝ่ายงาน <span class="req">*</span></label>
        <select id="department" onchange="AttendanceApp.onRoleChange()">
          <option value="">เลือกฝ่ายงาน</option>
          ${AttendanceConfig.DEPARTMENTS.map(deptItem => `<option value="${deptItem.name}">${deptItem.name}</option>`).join('')}
        </select>
      </div>
      <div class="ios-field"><label>ตำแหน่ง <span class="req">*</span></label><select disabled><option>เลือกฝ่ายงานก่อน</option></select></div>
    </div>`;
  }

  const deptMetadata = AttendanceConfig.DEPARTMENTS.find(deptItem => deptItem.name === selectedDeptName);
  if (deptMetadata && deptMetadata.hasSports) {
    return `
    <div class="ios-field-grid">
      <div class="ios-field"><label>ฝ่ายงาน <span class="req">*</span></label>
        <select id="department" onchange="AttendanceApp.onRoleChange()">
          <option value="">เลือกฝ่ายงาน</option>
          ${AttendanceConfig.DEPARTMENTS.map(deptItem => `<option value="${deptItem.name}" ${selectedDeptName === deptItem.name ? 'selected' : ''}>${deptItem.name}</option>`).join('')}
        </select>
      </div>
    </div>
    ${buildSportsFields()}`;
  }

  return `
  <div class="ios-field-grid">
    <div class="ios-field"><label>ฝ่ายงาน <span class="req">*</span></label>
      <select id="department" onchange="AttendanceApp.onRoleChange()">
        <option value="">เลือกฝ่ายงาน</option>
        ${AttendanceConfig.DEPARTMENTS.map(deptItem => `<option value="${deptItem.name}" ${selectedDeptName === deptItem.name ? 'selected' : ''}>${deptItem.name}</option>`).join('')}
      </select>
    </div>
    ${buildDeptPositionField(deptMetadata)}
  </div>`;
}

function buildRoleSectionHTML(selectedRoom) {
  const isLockedRoom = AttendanceConfig.LOCKED_ROOMS.includes(selectedRoom);
  if (isLockedRoom) {
    return `<div class="ios-note-box" style="margin-top:0;">ระบบล็อกคำตอบให้เข้า <strong>ฝ่ายสแตนเชียร์</strong> ในสถานะ <strong>สมาชิกฝ่าย</strong> โดยอัตโนมัติ หากต้องการตำแหน่งอื่น กรุณาแจ้งพี่สตาฟโดยตรง พี่สตาฟจะเป็นผู้แก้ไขข้อมูลในระบบให้</div>`;
  }

  const selectedCategory = activeRoleCategory || 'department';
  const isCentral = selectedCategory === 'central';
  const categoryFieldHtml = `
    <div class="ios-field" style="margin-bottom:14px;">
      <label>ประเภทบทบาท <span class="req">*</span></label>
      <input type="hidden" id="roleCategory" value="${selectedCategory}" />
      <div class="ios-segmented-wrap two-slots" style="margin: 6px 0 14px;">
        <div class="ios-segmented-glider" id="roleCategoryGlider" style="transform: translateX(${isCentral ? '100%' : '0%'});"></div>
        <button type="button" class="ios-segmented-btn ${!isCentral ? 'active' : ''}" onclick="AttendanceApp.setRoleCategory('department')">ฝ่ายงาน</button>
        <button type="button" class="ios-segmented-btn ${isCentral ? 'active' : ''}" onclick="AttendanceApp.setRoleCategory('central')">ตำแหน่งบริหารคณะสี</button>
      </div>
    </div>`;

  return selectedCategory === 'central'
    ? categoryFieldHtml + buildCentralPositionField()
    : categoryFieldHtml + buildDepartmentFields();
}

function renderCurrentView() {
  const appState = AttendanceStore.getState();
  const mainContainer = document.getElementById('view-container');
  if (!mainContainer) return;

  // Sync Desktop Top Capsule Tabs
  document.querySelectorAll('.desktop-capsule-tabs .capsule-tab-btn').forEach(tabButton => {
    const tabRoute = tabButton.getAttribute('data-view');
    if (tabRoute === appState.view) tabButton.classList.add('active');
    else tabButton.classList.remove('active');
  });

  // Sync Floating iOS 27 Glass Dock Items & Animate Glider
  document.querySelectorAll('.floating-glass-dock .dock-item').forEach(dockItem => {
    const dockRoute = dockItem.getAttribute('data-dock-view');
    if (dockRoute === appState.view) dockItem.classList.add('active');
    else dockItem.classList.remove('active');
  });
  updateDockGlider(appState.view);

  if (appState.view === 'home') mainContainer.innerHTML = renderHome(appState);
  else if (appState.view === 'register') mainContainer.innerHTML = renderRegister();
  else if (appState.view === 'classes') {
    mainContainer.innerHTML = renderClasses(appState);
    requestAnimationFrame(() => updateGradeGlider(activeGradeFilter));
  }
  else if (appState.view === 'departments') mainContainer.innerHTML = renderDepartments(appState);
}

function showFormMsg(statusLevel, messageContent) {
  const messageBox = document.getElementById('formMsgBox');
  if (messageBox) messageBox.innerHTML = `<div class="form-msg ${statusLevel}">${esc(messageContent)}</div>`;
}

function assembleRecord(fullName, nickname, classRoom, numberLabel) {
  const isLockedRoom = AttendanceConfig.LOCKED_ROOMS.includes(classRoom);
  if (isLockedRoom) {
    return { fullName, nickname, classRoom, numberLabel, roleCategory: 'department', centralPosition: null, department: 'ฝ่ายสแตนเชียร์', position: 'สมาชิกฝ่าย', sportType: null, autoAssigned: true };
  }

  const selectedCategory = getVal('roleCategory') || 'department';
  if (selectedCategory === 'central') {
    const chosenCentralPosition = getVal('centralPosition');
    return { fullName, nickname, classRoom, numberLabel, roleCategory: 'central', centralPosition: chosenCentralPosition, department: null, position: chosenCentralPosition, sportType: null, autoAssigned: false };
  }

  const chosenDept = getVal('department');
  const deptMetadata = AttendanceConfig.DEPARTMENTS.find(deptItem => deptItem.name === chosenDept);

  if (deptMetadata && deptMetadata.hasSports) {
    const sportsModeChoice = getVal('sportsMode') || 'team';
    if (sportsModeChoice === 'president') {
      return { fullName, nickname, classRoom, numberLabel, roleCategory: 'department', centralPosition: null, department: chosenDept, position: 'ประธานฝ่าย', sportType: null, autoAssigned: false };
    }
    const chosenSport = getVal('sportType');
    const chosenSportRole = getVal('sportRole');
    return { fullName, nickname, classRoom, numberLabel, roleCategory: 'department', centralPosition: null, department: chosenDept, position: chosenSportRole, sportType: chosenSport, autoAssigned: false };
  }

  const chosenDeptPosition = getVal('deptPosition');
  return { fullName, nickname, classRoom, numberLabel, roleCategory: 'department', centralPosition: null, department: chosenDept, position: chosenDeptPosition, sportType: null, autoAssigned: false };
}

function validateConflict(candidateRecord) {
  if (AttendanceStore.isSameRoleAlreadyTaken(candidateRecord)) return `เลขที่ ${candidateRecord.numberLabel} ห้อง ${candidateRecord.classRoom} ได้ลงทะเบียนตำแหน่งนี้ไปแล้ว กรุณาเลือกตำแหน่งอื่น`;
  if (candidateRecord.roleCategory === 'central' && AttendanceStore.isCentralTaken(candidateRecord.centralPosition)) return 'ตำแหน่งนี้มีผู้รับแล้ว กรุณาเลือกตำแหน่งอื่น';
  if (candidateRecord.position === 'ประธานฝ่าย' && AttendanceStore.isDeptPresidentTaken(candidateRecord.department)) return 'ตำแหน่งประธานฝ่ายนี้มีผู้รับแล้ว';
  if (candidateRecord.department === 'ฝ่ายสวัสดิการ' && candidateRecord.position === 'รองประธานฝ่ายสวัสดิการ' && AttendanceStore.isDeputyTaken(candidateRecord.department, 'รองประธานฝ่ายสวัสดิการ')) return 'ตำแหน่งนี้มีผู้รับแล้ว';
  if (candidateRecord.position === 'หัวหน้ากีฬา' && AttendanceStore.isSportCaptainTaken(candidateRecord.sportType)) return 'ตำแหน่งหัวหน้ากีฬาประเภทนี้มีผู้รับแล้ว';
  return null;
}

function setButtonState(submitButton, isDisabled, buttonText) {
  if (!submitButton) return;
  submitButton.disabled = isDisabled;
  submitButton.textContent = buttonText;
}

async function executeRecordPersistence(candidateRecord, submitButton) {
  setButtonState(submitButton, true, 'กำลังส่งข้อมูล...');
  candidateRecord.id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
  candidateRecord.timestamp = Date.now();

  const isSuccess = await AttendanceAPI.appendRecord(candidateRecord);
  if (!isSuccess) {
    showFormMsg('error', 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    AttendanceStore.setSubmitting(false);
    setButtonState(submitButton, false, 'บันทึกข้อมูล');
    return;
  }

  const updatedRecords = await AttendanceAPI.fetchFromNetwork();
  AttendanceStore.setRegs(updatedRecords);
  showFormMsg('success', `บันทึกข้อมูลของ ${candidateRecord.fullName} เรียบร้อยแล้ว`);
  AttendanceStore.setSubmitting(false);
  setButtonState(submitButton, false, 'บันทึกข้อมูล');
}

const AttendanceApp = {
  navigate(targetViewName) {
    AttendanceStore.setView(targetViewName);
    window.scrollTo(0, 0);
  },

  switchHomeTab(subTabIdentifier) {
    activeHomeSubTab = subTabIdentifier;
    updateSegmentedGlider(subTabIdentifier);
    renderCurrentView();
  },

  setRoleCategory(chosenCategory) {
    activeRoleCategory = chosenCategory;
    const roleSection = document.getElementById('roleSection');
    const selectedRoom = getVal('classRoom');
    if (roleSection) roleSection.innerHTML = buildRoleSectionHTML(selectedRoom);
    updateRoleGlider(chosenCategory);
  },

  setGradeFilter(selectedGrade) {
    activeGradeFilter = selectedGrade;
    activeRoomFilter = '';
    renderCurrentView();
  },

  setRoomFilter(selectedRoom) {
    activeRoomFilter = selectedRoom;
    renderCurrentView();
  },

  onSearchInput(searchInputValue) {
    studentSearchQuery = searchInputValue;
    const resultsContainer = document.getElementById('classResultsList');
    if (resultsContainer) {
      const appState = AttendanceStore.getState();
      const filteredList = filterStudents(appState.regs).sort((alpha, beta) => (alpha.classRoom || '').localeCompare(beta.classRoom || '', 'th') || (alpha.numberLabel || '').localeCompare(beta.numberLabel || '', 'th'));
      resultsContainer.innerHTML = filteredList.length > 0
        ? groupAndRenderStudents(filteredList)
        : `<div class="empty-state">ไม่พบข้อมูลนักเรียนที่ตรงกับคำค้นหา</div>`;
    }
  },

  toggleDeptAccordion(departmentName) {
    activeAccordionDept = (activeAccordionDept === departmentName) ? null : departmentName;
    renderCurrentView();
  },

  onClassRoomChange() {
    const selectedRoom = getVal('classRoom');
    const roleSection = document.getElementById('roleSection');
    if (roleSection) roleSection.innerHTML = buildRoleSectionHTML(selectedRoom);
  },

  onRoleChange() {
    const selectedRoom = getVal('classRoom');
    const roleSection = document.getElementById('roleSection');
    if (roleSection) roleSection.innerHTML = buildRoleSectionHTML(selectedRoom);
  },

  async refreshData() {
    const refreshButton = document.getElementById('refreshBtn');
    if (refreshButton) refreshButton.classList.add('spinning');
    try {
      const freshRecords = await AttendanceAPI.fetchFromNetwork();
      AttendanceStore.setRegs(freshRecords);
    } finally {
      if (refreshButton) refreshButton.classList.remove('spinning');
    }
  },

  async submitRegistration() {
    const appState = AttendanceStore.getState();
    if (appState.isSubmitting) return;

    const fullName = getVal('fullName').trim();
    const nickname = getVal('nickname').trim();
    const classRoom = getVal('classRoom');
    const numberLabel = getVal('number');

    if (!fullName || !nickname || !classRoom || !numberLabel) {
      showFormMsg('error', 'กรุณากรอกข้อมูลส่วนตัวให้ครบทุกช่อง');
      return;
    }

    const candidateRecord = assembleRecord(fullName, nickname, classRoom, numberLabel);
    if (!candidateRecord.position) {
      showFormMsg('error', 'กรุณาเลือกตำแหน่งหรือบทบาทให้ครบถ้วน');
      return;
    }

    AttendanceStore.setSubmitting(true);
    const submitButton = document.getElementById('submitBtn');
    setButtonState(submitButton, true, 'กำลังตรวจสอบข้อมูล...');
    showFormMsg('success', 'กำลังตรวจสอบตำแหน่งว่าง...');

    const freshRecords = await AttendanceAPI.fetchFromNetwork();
    AttendanceStore.setRegs(freshRecords);

    const conflictError = validateConflict(candidateRecord);
    if (conflictError) {
      showFormMsg('error', `${conflictError} ระบบได้อัปเดตตัวเลือกให้แล้ว`);
      const roleSection = document.getElementById('roleSection');
      if (roleSection) roleSection.innerHTML = buildRoleSectionHTML(classRoom);
      AttendanceStore.setSubmitting(false);
      setButtonState(submitButton, false, 'บันทึกข้อมูล');
      return;
    }

    await executeRecordPersistence(candidateRecord, submitButton);
  },

  async init() {
    AttendanceStore.subscribe(() => {
      renderCurrentView();
    });

    const cacheResult = await AttendanceAPI.loadWithSWR(freshRecords => {
      AttendanceStore.setRegs(freshRecords);
    });
    AttendanceStore.setRegs(cacheResult.records);
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceApp = AttendanceApp;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AttendanceApp.init());
  } else {
    AttendanceApp.init();
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceApp;
}
