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

  setSubmitting(submissionFlag) {
    this.state.isSubmitting = Boolean(submissionFlag);
    this.notify();
  },

  setFormMsg(messageObject) {
    this.state.formMsg = messageObject;
    this.notify();
  },

  isCentralTaken(targetPosition) {
    return this.state.regs.find(entry => entry.roleCategory === 'central' && entry.centralPosition === targetPosition);
  },

  isDeptPresidentTaken(targetDepartment) {
    return this.state.regs.find(entry => entry.department === targetDepartment && entry.position === 'ประธานฝ่าย');
  },

  isDeputyTaken(targetDepartment, targetTitle) {
    return this.state.regs.find(entry => entry.department === targetDepartment && entry.position === targetTitle);
  },

  isSportCaptainTaken(targetSport) {
    return this.state.regs.find(entry => entry.department === 'ฝ่ายกีฬา' && entry.sportType === targetSport && entry.position === 'หัวหน้ากีฬา');
  },

  isSameRoleAlreadyTaken(candidateRecord) {
    return this.state.regs.find(entry =>
      entry.classRoom === candidateRecord.classRoom &&
      entry.numberLabel === candidateRecord.numberLabel &&
      (entry.roleCategory || '') === (candidateRecord.roleCategory || '') &&
      (entry.centralPosition || '') === (candidateRecord.centralPosition || '') &&
      (entry.department || '') === (candidateRecord.department || '') &&
      (entry.position || '') === (candidateRecord.position || '') &&
      (entry.sportType || '') === (candidateRecord.sportType || '')
    );
  },

  countDept(targetDepartment) {
    return this.state.regs.filter(entry => entry.department === targetDepartment).length;
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceStore = AttendanceStore;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceStore;
}
