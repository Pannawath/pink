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

const DEPARTMENTS = [
  { name: 'ฝ่ายอุปกรณ์' },
  { name: 'ฝ่ายผู้นำเชียร์ (หลีด)' },
  { name: 'ฝ่ายสวัสดิการ', deputyLabel: 'รองประธานฝ่ายสวัสดิการ' },
  { name: 'ฝ่ายกราฟิก' },
  { name: 'ฝ่ายกีฬา', hasSports: true },
  { name: 'ฝ่ายสแตนเชียร์', isStand: true },
  { name: 'ฝ่ายขบวน' },
  { name: 'ฝ่ายดรัมเมเยอร์' },
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

const AttendanceConfig = {
  API_URL,
  GRADES,
  ALL_ROOMS,
  LOCKED_ROOMS,
  CENTRAL_POSITIONS,
  DEPARTMENTS,
  NO_STAFF_DEPARTMENTS,
  SPORT_TYPES,
  NUMBERS,
  CACHE_KEY: 'pink_attendance_cache_v1',
  CACHE_TIME_KEY: 'pink_attendance_cache_time_v1',
  CACHE_TTL_MS: 30000 // 30 seconds fresh window before bg revalidation
};

if (typeof window !== 'undefined') {
  window.AttendanceConfig = AttendanceConfig;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AttendanceConfig;
}
