const AttendanceStore = {
  state: {
    view: 'home',
    regs: [],
    loaded: false,
    isSubmitting: false,
    selectedClassFilter: '',
    selectedDept: '',
    formMsg: null
  },

  listeners: new Set(),

  subscribe(subscriberCallback) {
    this.listeners.add(subscriberCallback);
    return () => this.listeners.delete(subscriberCallback);
  },

  notify() {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (listenerError) {
        console.error('[AttendanceStore] Listener execution failed:', listenerError);
      }
    });
  },

  getState() {
    return this.state;
  },

  setRegs(records) {
    this.state.regs = Array.isArray(records) ? records : [];
    this.state.loaded = true;
    this.notify();
  },

  setView(viewName) {
    this.state.view = viewName;
    this.notify();
  },

  setSelectedDept(deptName) {
    this.state.selectedDept = deptName;
    this.notify();
  },

  setSelectedClassFilter(roomName) {
    this.state.selectedClassFilter = roomName;
    this.notify();
  },

  setSubmitting(submissionStatus) {
    this.state.isSubmitting = submissionStatus;
    this.notify();
  },

  isCentralTaken(targetPosition) {
    return this.state.regs.find(entry => entry.roleCategory === 'central' && entry.centralPosition === targetPosition);
  },

  isDeptPresidentTaken(targetDepartment) {
    return this.state.regs.find(entry => entry.department === targetDepartment && entry.position === 'ประธานฝ่าย');
  },

  isDeputyTaken(targetDepartment, positionLabel) {
    return this.state.regs.find(entry => entry.department === targetDepartment && entry.position === positionLabel);
  },

  isSportCaptainTaken(targetSport) {
    return this.state.regs.find(entry => entry.department === 'ฝ่ายกีฬา' && entry.sportType === targetSport && entry.position === 'หัวหน้ากีฬา');
  },

  isAlreadyRegistered(candidateRecord) {
    return this.state.regs.find(entry =>
      entry.classRoom === candidateRecord.classRoom &&
      entry.numberLabel === candidateRecord.numberLabel
    );
  },

  isSameRoleAlreadyTaken(candidateRecord) {
    return this.isAlreadyRegistered(candidateRecord);
  },

  getDuplicateStudents() {
    const map = {};
    this.state.regs.forEach(entry => {
      const key = `${entry.classRoom}|${entry.numberLabel}`;
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    });
    const dupes = {};
    Object.entries(map).forEach(([key, list]) => {
      if (list.length > 1) {
        dupes[key] = list;
      }
    });
    return dupes;
  },

  countUniqueDept(targetDepartment) {
    const seen = new Set();
    let count = 0;
    this.state.regs.forEach(entry => {
      if (entry.department === targetDepartment) {
        const studentKey = `${entry.classRoom}|${entry.numberLabel}`;
        if (!seen.has(studentKey)) {
          seen.add(studentKey);
          count++;
        }
      }
    });
    return count;
  },

  countDept(targetDepartment) {
    return this.countUniqueDept(targetDepartment);
  },

  getActiveDepartments() {
    if (typeof AttendanceConfig !== 'undefined') {
      if (typeof AttendanceConfig.refreshSettings === 'function') {
        AttendanceConfig.refreshSettings();
      }
      return AttendanceConfig.DEPARTMENTS || [];
    }
    if (typeof require !== 'undefined') {
      const config = require('./config.js');
      return config.DEPARTMENTS || [];
    }
    return [];
  },

  isDeptFull(targetDepartment) {
    const depts = this.getActiveDepartments();
    const deptDef = depts.find(d => d.name === targetDepartment);
    if (!deptDef || typeof deptDef.maxCapacity !== 'number') return false;
    const currentCount = this.countDept(targetDepartment);
    return currentCount >= deptDef.maxCapacity;
  },

  getDeptCapacity(targetDepartment) {
    const depts = this.getActiveDepartments();
    const deptDef = depts.find(d => d.name === targetDepartment);
    const currentCount = this.countDept(targetDepartment);
    const maxCapacity = deptDef && typeof deptDef.maxCapacity === 'number' ? deptDef.maxCapacity : null;
    return {
      currentCount,
      maxCapacity,
      isFull: maxCapacity !== null && currentCount >= maxCapacity,
      remaining: maxCapacity !== null ? Math.max(0, maxCapacity - currentCount) : null
    };
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceStore = AttendanceStore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceStore;
}
