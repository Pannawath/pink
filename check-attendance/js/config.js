const API_URL = 'https://script.google.com/macros/s/AKfycbx1QT3y_q-xjeO0n24re3G8aEnGHMCtYiUQyWIg6AWqvZdomSg9odjqqj5JnGYWsqJW/exec';

const GRADES = [
  { grade: 'ม.1', rooms: ['ม.1/2', 'ม.1/9', 'ม.1/12'], locked: true, note: 'ม.1 สมาชิกฝ่ายสแตนเชียร์เท่านั้น (ต้องการตำแหน่งอื่นแจ้งพี่สตาฟ)' },
  { grade: 'ม.2', rooms: ['ม.2/3', 'ม.2/6', 'ม.2/13', 'ม.2/16'] },
  { grade: 'ม.3', rooms: ['ม.3/1', 'ม.3/7', 'ม.3/10', 'ม.3/17'] },
  { grade: 'ม.4', rooms: ['ม.4/4', 'ม.4/11', 'ม.4/14', 'ม.4/17'] },
  { grade: 'ม.5', rooms: ['ม.5/3', 'ม.5/10', 'ม.5/13'] },
  { grade: 'ม.6', rooms: ['ม.6/4', 'ม.6/7', 'ม.6/14'] },
];

const ALL_ROOMS = GRADES.flatMap(g => g.rooms);
const LOCKED_ROOMS = GRADES.filter(g => g.locked).flatMap(g => g.rooms);

const CENTRAL_POSITIONS = [
  'ประธานสี',
  'รองประธานสี',
  'เหรัญญิก',
  'ผู้ช่วยเหรัญญิก',
  'เลขานุการ',
  'รองเลขานุการ'
];

const DEFAULT_DEPARTMENTS = [
  { name: 'ฝ่ายอุปกรณ์' },
  { name: 'ฝ่ายผู้นำเชียร์ (หลีด)', maxCapacity: 18 },
  { name: 'ฝ่ายสวัสดิการ', deputyLabel: 'รองประธานฝ่ายสวัสดิการ' },
  { name: 'ฝ่ายกราฟิก' },
  { name: 'ฝ่ายกีฬา', hasSports: true, isClosed: true, closedNote: 'รอประกาศคัดตัวนักกีฬา' },
  { name: 'ฝ่ายสแตนเชียร์', maxCapacity: 25, isStand: true, m1Only: true },
  { name: 'ฝ่ายขบวน' },
  { name: 'ฝ่ายดรัมเมเยอร์', maxCapacity: 12 },
];

const NO_STAFF_DEPARTMENTS = ['ฝ่ายอุปกรณ์', 'ฝ่ายสวัสดิการ', 'ฝ่ายกราฟิก'];

const SPORT_TYPES = [
  'บาสเกตบอล',
  'ฟุตบอล',
  'ตะกร้อ',
  'วอลเลย์บอล',
  'ปิงปอง',
  'แบดมินตัน',
  'กีฬาวิ่ง',
  'E-sports (RoV)',
  'E-sports (Free Fire)',
  'E-sports (eFootball)'
];

const NUMBERS = (() => {
  const arr = [];
  ['ก', 'ข'].forEach(g => {
    for (let n = 1; n <= 20; n++) arr.push(`${n} ${g}`);
  });
  return arr;
})();

const SETTINGS_STORAGE_KEY = 'pink_admin_dynamic_settings_v1';
const DEFAULT_ADMIN_PIN = '2569';

function loadDynamicSettings() {
  const defaults = {
    departments: JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS)),
    strictOnePerson: true,
    m1StandOnly: true,
    lockM1Registration: true,
    adminPin: DEFAULT_ADMIN_PIN,
    updatedAt: Date.now()
  };

  if (typeof localStorage === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      departments: Array.isArray(parsed.departments) ? parsed.departments : defaults.departments,
      strictOnePerson: typeof parsed.strictOnePerson === 'boolean' ? parsed.strictOnePerson : defaults.strictOnePerson,
      m1StandOnly: typeof parsed.m1StandOnly === 'boolean' ? parsed.m1StandOnly : defaults.m1StandOnly,
      lockM1Registration: typeof parsed.lockM1Registration === 'boolean' ? parsed.lockM1Registration : defaults.lockM1Registration,
      adminPin: parsed.adminPin || defaults.adminPin,
      updatedAt: parsed.updatedAt || Date.now()
    };
  } catch (err) {
    console.warn('[AttendanceConfig] Failed to load dynamic settings:', err);
    return defaults;
  }
}

function saveDynamicSettings(settings) {
  if (typeof localStorage === 'undefined') return false;
  try {
    const payload = {
      ...settings,
      updatedAt: Date.now()
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    // Update active in-memory DEPARTMENTS
    if (Array.isArray(payload.departments)) {
      AttendanceConfig.DEPARTMENTS = payload.departments;
    }
    return true;
  } catch (err) {
    console.error('[AttendanceConfig] Failed to save dynamic settings:', err);
    return false;
  }
}

const activeSettings = loadDynamicSettings();

const AttendanceConfig = {
  API_URL,
  GRADES,
  ALL_ROOMS,
  LOCKED_ROOMS,
  CENTRAL_POSITIONS,
  DEFAULT_DEPARTMENTS,
  DEPARTMENTS: activeSettings.departments,
  NO_STAFF_DEPARTMENTS,
  SPORT_TYPES,
  NUMBERS,
  CACHE_KEY: 'pink_attendance_cache_v1',
  CACHE_TIME_KEY: 'pink_attendance_cache_time_v1',
  CACHE_TTL_MS: 30000, // 30 seconds fresh window before bg revalidation
  SETTINGS_STORAGE_KEY,
  DEFAULT_ADMIN_PIN,
  getSettings: loadDynamicSettings,
  saveSettings: saveDynamicSettings,
  refreshSettings() {
    const fresh = loadDynamicSettings();
    this.DEPARTMENTS = fresh.departments;
    return fresh;
  }
};

if (typeof window !== 'undefined') {
  window.AttendanceConfig = AttendanceConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceConfig;
}
