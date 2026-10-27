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

function renderHero(registeredCount) {
  return `
  <section class="hero"><div class="wrap">
    <div class="hero-grid">
      <div>
        <div class="eyebrow"><span class="line"></span>คณะสีชมพู · ปีการศึกษา 2569</div>
        <h1>อยุธยาสีชมพู<span class="accent">ปี 2569</span></h1>
        <div class="lede">รวมพลังสีชมพู รู้หน้าที่ พร้อมไปด้วยกัน</div>
        <p>พื้นที่รวมข้อมูลนักเรียน ตำแหน่ง และฝ่ายงานของคณะสีชมพู เพื่อให้ทุกคนเห็นบทบาทของตัวเองอย่างชัดเจน</p>
        <div class="hero-actions">
          <button class="btn btn-primary" onclick="AttendanceApp.navigate('register')">กรอกข้อมูลนักเรียน</button>
          <button class="btn btn-outline" onclick="AttendanceApp.navigate('departments')">ดูฝ่ายงาน</button>
        </div>
      </div>
      <div class="hero-art">
        <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">
          <circle cx="330" cy="60" r="120" fill="#ffffff" opacity="0.22"/>
          <circle cx="60" cy="260" r="150" fill="#ffffff" opacity="0.18"/>
          <circle cx="230" cy="200" r="90" fill="#ffffff" opacity="0.15"/>
        </svg>
        <div class="hero-badge">ต่างหน้าที่ ใจเดียวกัน<span class="dot"></span></div>
      </div>
    </div>
    <div class="stats-bar">
      <div class="stat"><span class="num">${AttendanceConfig.GRADES.length}</span><span class="lbl">ระดับชั้น</span></div>
      <div class="stat"><span class="num">${AttendanceConfig.ALL_ROOMS.length}</span><span class="lbl">ห้องเรียน</span></div>
      <div class="stat"><span class="num">${AttendanceConfig.DEPARTMENTS.length}</span><span class="lbl">ฝ่ายงาน</span></div>
      <div class="stat"><span class="num">${registeredCount}</span><span class="lbl">ผู้ลงทะเบียน</span></div>
    </div>
  </div></section>`;
}

function renderGradeOverview() {
  const cardsHtml = AttendanceConfig.GRADES.map(gradeGroup => `
    <div class="grade-card">
      <h3>${gradeGroup.grade}</h3>
      <div class="room-chips">${gradeGroup.rooms.map(roomName => `<span class="chip">${roomName}</span>`).join('')}</div>
      ${gradeGroup.locked ? `<div class="grade-note">${gradeGroup.note}</div>` : ''}
    </div>`).join('');

  return `
  <section class="section"><div class="wrap">
    <div class="section-head"><h2>กลุ่มนักเรียนที่เข้าร่วม</h2><p>เลือกห้องเรียนของคุณจากรายชื่อที่กำหนด</p></div>
    <div class="grade-grid">${cardsHtml}</div>
  </div></section>`;
}

function renderDeptOverview() {
  const deptCardsHtml = AttendanceConfig.DEPARTMENTS.map((deptDefinition, deptIndex) => `
    <div class="dept-card">
      <div class="dept-num">${String(deptIndex + 1).padStart(2, '0')}</div>
      <h4>${deptDefinition.name}</h4>
      <div class="desc">${AttendanceConfig.NO_STAFF_DEPARTMENTS.includes(deptDefinition.name) ? 'ประธานฝ่าย 1 คน · สมาชิกฝ่าย' : 'ประธานฝ่าย 1 คน · สตาฟฝ่าย · สมาชิกฝ่าย'}</div>
      ${deptDefinition.deputyLabel ? `<div class="extra">${deptDefinition.deputyLabel} 1 คน</div>` : ''}
      ${deptDefinition.isStand ? `<div class="extra">ม.1 เข้าร่วมในบทบาทสมาชิกฝ่าย</div>` : ''}
    </div>`).join('');

  return `
  <section class="section"><div class="wrap">
    <div class="section-head"><h2>ภาระงานและฝ่ายงาน</h2><p>แบ่งบทบาทให้ชัด เพื่อทำงานร่วมกันได้อย่างเป็นระบบ</p></div>
    <div class="exec-band">
      <div style="flex:1;min-width:240px;">
        <h3>ตำแหน่งบริหารคณะสี</h3>
        <div class="pill-row">${AttendanceConfig.CENTRAL_POSITIONS.map(positionTitle => `<span class="pill">${positionTitle}</span>`).join('')}</div>
      </div>
      <div class="cap">ตำแหน่งละ 1 คน</div>
    </div>
    <div class="dept-grid">${deptCardsHtml}</div>
    <div class="sport-band">
      <h3>ประเภทกีฬา</h3>
      <p>แต่ละประเภทมีหัวหน้ากีฬา 1 คน พร้อมสตาฟกีฬาและนักกีฬา</p>
      <div class="pill-row">${AttendanceConfig.SPORT_TYPES.map(sportName => `<span class="pill">${sportName}</span>`).join('')}</div>
    </div>
  </div></section>`;
}

function renderLiveSummary(appState) {
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
  <section class="section"><div class="wrap">
    <div class="section-head"><h2>สรุปข้อมูลล่าสุด</h2><p>อัปเดตตามข้อมูลที่มีการลงทะเบียนจริง</p></div>
    <div class="live-grid">
      <div class="live-card">
        <h4>จำนวนสมาชิกแยกตามฝ่าย</h4>
        ${deptRowsHtml}
      </div>
      <div>
        <div class="live-card" style="margin-bottom:20px;">
          <div class="big-total"><div class="n">${appState.regs.length}</div><div class="l">ผู้ลงทะเบียนทั้งหมด</div></div>
        </div>
        <div class="live-card">
          <h4>คณะกรรมการส่วนกลาง</h4>
          ${committeeRowsHtml}
        </div>
      </div>
    </div>
  </div></section>`;
}

function renderHome(appState) {
  return renderHero(appState.regs.length) + renderGradeOverview() + renderDeptOverview() + renderLiveSummary(appState);
}

function renderSideNote(selectedRoom) {
  const isLockedRoom = AttendanceConfig.LOCKED_ROOMS.includes(selectedRoom);
  if (isLockedRoom) {
    return `<div class="info-box lock"><div class="t">ห้อง ม.1 ถูกล็อกสิทธิ์อัตโนมัติ</div>
      <p>นักเรียน ม.1 จะได้รับมอบหมายให้เป็นสมาชิกฝ่ายสแตนเชียร์โดยอัตโนมัติ และไม่สามารถเลือกตำแหน่งส่วนกลางหรือฝ่ายอื่นได้ด้วยตัวเองผ่านเว็บนี้</p>
      <p>หากน้อง ม.1 คนไหนต้องการตำแหน่งอื่น ให้แจ้งกับพี่สตาฟโดยตรง พี่สตาฟจะเป็นผู้แก้ไขข้อมูลในระบบให้เอง</p></div>`;
  }
  return `<div class="info-box"><div class="t">เกี่ยวกับการลงทะเบียน</div>
    <p>นักเรียน ม.1 จะได้รับมอบหมายให้เป็นสมาชิกฝ่ายสแตนเชียร์โดยอัตโนมัติ และไม่สามารถเลือกตำแหน่งส่วนกลางหรือฝ่ายอื่นได้ด้วยตัวเอง หากต้องการตำแหน่งอื่นต้องแจ้งพี่สตาฟเพื่อแก้ไขในระบบให้</p></div>`;
}

function buildCentralPositionField() {
  const chosenPosition = getVal('centralPosition');
  const optionsHtml = AttendanceConfig.CENTRAL_POSITIONS.map(positionTitle => {
    const isOccupied = AttendanceStore.isCentralTaken(positionTitle);
    const isCurrentChoice = chosenPosition === positionTitle;
    return `<option value="${positionTitle}" ${isOccupied && !isCurrentChoice ? 'disabled' : ''} ${isCurrentChoice ? 'selected' : ''}>${positionTitle}${isOccupied ? ' (มีผู้รับแล้ว)' : ''}</option>`;
  }).join('');

  return `<div class="field"><label>ตำแหน่ง <span class="req">*</span></label>
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

  return `<div class="field"><label>ตำแหน่ง <span class="req">*</span></label><select id="deptPosition">
    <option value="">เลือกตำแหน่ง</option>${optionsHtml}</select></div>`;
}

function buildSportsFields() {
  const selectedMode = getVal('sportsMode') || 'team';
  const isPresidentOccupied = AttendanceStore.isDeptPresidentTaken('ฝ่ายกีฬา');

  if (selectedMode === 'president') {
    return `
    <div class="field-grid">
      <div class="field"><label>บทบาทในฝ่ายกีฬา <span class="req">*</span></label>
        <select id="sportsMode" onchange="AttendanceApp.onRoleChange()">
          <option value="team">เข้าร่วมทีมกีฬา</option>
          <option value="president" selected>ประธานฝ่ายกีฬา (ภาพรวม)</option>
        </select>
      </div>
      <div class="field"><label>&nbsp;</label><div class="hint" style="margin-top:12px;">ดูแลภาพรวมฝ่ายกีฬาทั้งหมด</div></div>
    </div>`;
  }

  const selectedSport = getVal('sportType');
  const roleDropdownHtml = selectedSport ? buildSportRoleDropdown(selectedSport) : '';

  return `
  <div class="field-grid">
    <div class="field"><label>บทบาทในฝ่ายกีฬา <span class="req">*</span></label>
      <select id="sportsMode" onchange="AttendanceApp.onRoleChange()">
        <option value="team" selected>เข้าร่วมทีมกีฬา</option>
        <option value="president" ${isPresidentOccupied ? 'disabled' : ''}>ประธานฝ่ายกีฬา (ภาพรวม)${isPresidentOccupied ? ' (มีผู้รับแล้ว)' : ''}</option>
      </select>
    </div>
    <div class="field"><label>ประเภทกีฬา <span class="req">*</span></label>
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

  return `<div class="field"><label>ตำแหน่งในทีม <span class="req">*</span></label><select id="sportRole">
    <option value="">เลือกตำแหน่ง</option>${optionsHtml}</select></div>`;
}

function buildDepartmentFields() {
  const selectedDeptName = getVal('department');
  if (!selectedDeptName) {
    return `
    <div class="field-grid">
      <div class="field"><label>ฝ่ายงาน <span class="req">*</span></label>
        <select id="department" onchange="AttendanceApp.onRoleChange()">
          <option value="">เลือกฝ่ายงาน</option>
          ${AttendanceConfig.DEPARTMENTS.map(deptItem => `<option value="${deptItem.name}">${deptItem.name}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label>ตำแหน่ง <span class="req">*</span></label><select disabled><option>เลือกฝ่ายงานก่อน</option></select></div>
    </div>`;
  }

  const deptMetadata = AttendanceConfig.DEPARTMENTS.find(deptItem => deptItem.name === selectedDeptName);
  if (deptMetadata && deptMetadata.hasSports) {
    return `
    <div class="field-grid">
      <div class="field"><label>ฝ่ายงาน <span class="req">*</span></label>
        <select id="department" onchange="AttendanceApp.onRoleChange()">
          <option value="">เลือกฝ่ายงาน</option>
          ${AttendanceConfig.DEPARTMENTS.map(deptItem => `<option value="${deptItem.name}" ${selectedDeptName === deptItem.name ? 'selected' : ''}>${deptItem.name}</option>`).join('')}
        </select>
      </div>
    </div>
    ${buildSportsFields()}`;
  }

  return `
  <div class="field-grid">
    <div class="field"><label>ฝ่ายงาน <span class="req">*</span></label>
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
    return `<div class="note-bar" style="margin-top:0;">ระบบล็อกคำตอบให้เข้า <strong>ฝ่ายสแตนเชียร์</strong> ในสถานะ <strong>สมาชิกฝ่าย</strong> โดยอัตโนมัติ หากต้องการตำแหน่งอื่น กรุณาแจ้งพี่สตาฟโดยตรง พี่สตาฟจะเป็นผู้แก้ไขข้อมูลในระบบให้</div>`;
  }

  const selectedCategory = getVal('roleCategory') || 'department';
  const categoryFieldHtml = `
    <div class="field" style="margin-bottom:18px;">
      <label>ประเภทบทบาท <span class="req">*</span></label>
      <select id="roleCategory" onchange="AttendanceApp.onRoleChange()">
        <option value="department" ${selectedCategory === 'department' ? 'selected' : ''}>ฝ่ายงาน</option>
        <option value="central" ${selectedCategory === 'central' ? 'selected' : ''}>ตำแหน่งบริหารคณะสี</option>
      </select>
    </div>`;

  return selectedCategory === 'central'
    ? categoryFieldHtml + buildCentralPositionField()
    : categoryFieldHtml + buildDepartmentFields();
}

function renderRegister() {
  return `
  <div class="form-page"><div class="wrap">
    <div class="form-grid">
      <div class="form-side">
        <div class="eyebrow"><span class="line"></span>ลงทะเบียน</div>
        <h2>ข้อมูลนักเรียนและภาระงาน</h2>
        <p>กรอกข้อมูลส่วนตัว แล้วเลือกบทบาทที่เหมาะกับคุณ</p>
        <div id="sideNote">${renderSideNote('')}</div>
      </div>
      <div class="form-card">
        <div id="formMsgBox"></div>
        <div class="form-sec-title">01 ข้อมูลส่วนตัว</div>
        <div class="field-grid">
          <div class="field"><label>ชื่อ-นามสกุล <span class="req">*</span></label><input id="fullName" type="text" placeholder="กรอกชื่อ-นามสกุล" /></div>
          <div class="field"><label>ชื่อเล่น <span class="req">*</span></label><input id="nickname" type="text" placeholder="กรอกชื่อเล่น" /></div>
        </div>
        <div class="field-grid">
          <div class="field">
            <label>ชั้น / ห้อง <span class="req">*</span></label>
            <select id="classRoom" onchange="AttendanceApp.onClassRoomChange()">
              <option value="">เลือกชั้น / ห้อง</option>
              ${AttendanceConfig.GRADES.map(gradeGroup => `<optgroup label="${gradeGroup.grade}">${gradeGroup.rooms.map(roomName => `<option value="${roomName}">${roomName}</option>`).join('')}</optgroup>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>เลขที่ <span class="req">*</span></label>
            <select id="number"><option value="">เลือกเลขที่และกลุ่ม</option>${AttendanceConfig.NUMBERS.map(numberName => `<option value="${numberName}">${numberName}</option>`).join('')}</select>
            <div class="hint">เลขที่ 1–20 กลุ่ม ก และ 1–20 กลุ่ม ข</div>
          </div>
        </div>
        <div class="form-sec-title">02 ตำแหน่งและฝ่ายงาน</div>
        <div id="roleSection">${buildRoleSectionHTML('')}</div>
        <div class="note-bar">ตำแหน่งสำคัญรับได้ตำแหน่งละ 1 คน ระบบตรวจสอบตำแหน่งว่างแบบเรียลไทม์จากข้อมูลที่มีผู้ลงทะเบียนจริง</div>
        <button class="submit-btn" id="submitBtn" onclick="AttendanceApp.submitRegistration()">บันทึกข้อมูล</button>
      </div>
    </div>
  </div></div>`;
}

function buildClassResultsHTML(targetRoom) {
  if (!targetRoom) return `<div class="empty-state">เลือกห้องเรียนด้านบนเพื่อดูรายชื่อนักเรียน</div>`;
  const appState = AttendanceStore.getState();
  const roomMembers = appState.regs.filter(entry => entry.classRoom === targetRoom).sort((alpha, beta) => alpha.numberLabel.localeCompare(beta.numberLabel, 'th'));
  if (roomMembers.length === 0) return `<div class="empty-state">ยังไม่มีนักเรียนลงทะเบียนในห้อง ${targetRoom}</div>`;

  const studentGroups = [];
  const groupRegistry = {};

  roomMembers.forEach(entry => {
    const studentHash = `${entry.numberLabel}|${entry.fullName}`;
    if (!groupRegistry[studentHash]) {
      groupRegistry[studentHash] = { numberLabel: entry.numberLabel, fullName: entry.fullName, nickname: entry.nickname, roles: [] };
      studentGroups.push(groupRegistry[studentHash]);
    }
    const roleTitle = entry.roleCategory === 'central' ? entry.position : (entry.department + (entry.sportType ? ` · ${entry.sportType}` : '') + ` · ${entry.position}`);
    const isLeader = entry.position === 'ประธานฝ่าย' || entry.roleCategory === 'central' || entry.position === 'หัวหน้ากีฬา';
    groupRegistry[studentHash].roles.push({ text: roleTitle, isLeader });
  });

  return studentGroups.map(studentItem => {
    const badgesHtml = studentItem.roles.map(roleItem => `<span class="badge ${roleItem.isLeader ? 'lead' : ''}">${esc(roleItem.text)}</span>`).join('');
    return `
    <div class="result-card">
      <div><div class="who">${esc(studentItem.fullName)} <span style="color:var(--text-muted);font-weight:400;">(${esc(studentItem.nickname)})</span></div>
      <div class="sub">เลขที่ ${studentItem.numberLabel}${studentItem.roles.length > 1 ? ` · ลงทะเบียน ${studentItem.roles.length} ตำแหน่ง` : ''}</div></div>
      <div class="badge-group">${badgesHtml}</div>
    </div>`;
  }).join('');
}

function renderClasses(appState) {
  return `
  <div class="view-page"><div class="wrap">
    <div class="view-head"><h2>ดูข้อมูลแยกตามห้อง</h2><p>เลือกห้องเพื่อดูรายชื่อนักเรียนและบทบาทหน้าที่</p></div>
    <div class="filter-row"><select id="classFilter" onchange="AttendanceApp.onClassFilterChange()">
      <option value="">เลือกห้องเรียน</option>
      ${AttendanceConfig.GRADES.map(gradeGroup => `<optgroup label="${gradeGroup.grade}">${gradeGroup.rooms.map(roomName => `<option value="${roomName}" ${appState.selectedClassFilter === roomName ? 'selected' : ''}>${roomName}</option>`).join('')}</optgroup>`).join('')}
    </select></div>
    <div id="classResults">${buildClassResultsHTML(appState.selectedClassFilter)}</div>
  </div></div>`;
}

function buildDeptDetailHTML(targetDeptName) {
  if (!targetDeptName) return `<div class="empty-state">เลือกฝ่ายงานด้านบนเพื่อดูรายชื่อสมาชิก</div>`;
  const appState = AttendanceStore.getState();
  const deptMetadata = AttendanceConfig.DEPARTMENTS.find(deptItem => deptItem.name === targetDeptName);
  const deptMembers = appState.regs.filter(entry => entry.department === targetDeptName);

  if (deptMetadata && deptMetadata.hasSports) {
    return buildSportsDeptDetail(deptMembers);
  }
  if (deptMetadata && deptMetadata.isStand) {
    return buildStandDeptDetail(deptMembers);
  }
  return buildGeneralDeptDetail(deptMetadata, deptMembers);
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
        ${captainRecord ? `<span class="badge lead">หัวหน้า: ${esc(captainRecord.fullName)}</span>` : `<span class="badge">หัวหน้า: ว่าง</span>`}
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

function renderDepartments(appState) {
  return `
  <div class="view-page"><div class="wrap">
    <div class="view-head"><h2>ดูข้อมูลแยกตามฝ่ายงาน</h2><p>เลือกฝ่ายงานเพื่อดูรายชื่อสมาชิกและบทบาทหน้าที่</p></div>
    <div class="dept-select-grid">
      ${AttendanceConfig.DEPARTMENTS.map(deptItem => `<button class="dept-select-card ${appState.selectedDept === deptItem.name ? 'active' : ''}" onclick="AttendanceApp.onDeptSelect('${deptItem.name}')">
        <div class="name">${deptItem.name}</div><div class="cnt">${AttendanceStore.countDept(deptItem.name)} คน</div></button>`).join('')}
    </div>
    <div id="deptDetail">${buildDeptDetailHTML(appState.selectedDept)}</div>
  </div></div>`;
}

function renderCurrentView() {
  const appState = AttendanceStore.getState();
  const mainContainer = document.getElementById('view-container');
  if (!mainContainer) return;

  document.querySelectorAll('.tab').forEach(tabButton => {
    const tabRoute = tabButton.getAttribute('data-view');
    if (tabRoute === appState.view) tabButton.classList.add('active');
    else tabButton.classList.remove('active');
  });

  if (appState.view === 'home') mainContainer.innerHTML = renderHome(appState);
  else if (appState.view === 'register') mainContainer.innerHTML = renderRegister();
  else if (appState.view === 'classes') mainContainer.innerHTML = renderClasses(appState);
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

  onClassRoomChange() {
    const selectedRoom = getVal('classRoom');
    const sideNote = document.getElementById('sideNote');
    const roleSection = document.getElementById('roleSection');
    if (sideNote) sideNote.innerHTML = renderSideNote(selectedRoom);
    if (roleSection) roleSection.innerHTML = buildRoleSectionHTML(selectedRoom);
  },

  onRoleChange() {
    const selectedRoom = getVal('classRoom');
    const roleSection = document.getElementById('roleSection');
    if (roleSection) roleSection.innerHTML = buildRoleSectionHTML(selectedRoom);
  },

  onClassFilterChange() {
    const selectedRoom = getVal('classFilter');
    AttendanceStore.setSelectedClassFilter(selectedRoom);
    const resultsContainer = document.getElementById('classResults');
    if (resultsContainer) resultsContainer.innerHTML = buildClassResultsHTML(selectedRoom);
  },

  onDeptSelect(targetDeptName) {
    AttendanceStore.setSelectedDept(targetDeptName);
    document.querySelectorAll('.dept-select-card').forEach(cardElement => {
      const titleElement = cardElement.querySelector('.name');
      if (titleElement && titleElement.textContent === targetDeptName) cardElement.classList.add('active');
      else cardElement.classList.remove('active');
    });
    const detailContainer = document.getElementById('deptDetail');
    if (detailContainer) detailContainer.innerHTML = buildDeptDetailHTML(targetDeptName);
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
