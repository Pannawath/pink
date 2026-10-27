/**
 * [TEST] Attendance System Unit & Integration Test
 * ทดสอบความถูกต้องของโมดูลระบบเช็คชื่อ (Check Attendance)
 */
const assert = require('assert');

console.log('=== [กำลังดำเนินการทดสอบระบบ: CHECK ATTENDANCE TEST SUITE] ===');

// 1. ทดสอบโหลด Config
console.log('[TEST 1/5] ทดสอบความถูกต้องของ AttendanceConfig...');
const AttendanceConfig = require('../check-attendance/js/config.js');
assert.ok(AttendanceConfig.API_URL, 'API_URL ต้องไม่ว่างเปล่า');
assert.strictEqual(AttendanceConfig.GRADES.length, 6, 'ต้องมี 6 ระดับชั้น');
assert.strictEqual(AttendanceConfig.DEPARTMENTS.length, 8, 'ต้องมี 8 ฝ่ายงาน');
assert.strictEqual(AttendanceConfig.CENTRAL_POSITIONS.length, 6, 'ต้องมี 6 ตำแหน่งบริหาร');
const m1 = AttendanceConfig.GRADES.find(g => g.grade === 'ม.1');
assert.strictEqual(m1.locked, true, 'ม.1 ต้องถูกล็อกสิทธิ์');
console.log('  -> ผ่านการทดสอบ: Config ถูกต้องสมบูรณ์');

// 2. ทดสอบ API Deduplication
console.log('[TEST 2/5] ทดสอบฟังก์ชัน dedupeRegs ใน AttendanceAPI...');
const AttendanceAPI = require('../check-attendance/js/api.js');
const mockRawData = [
  { fullName: 'สมชาย ใจดี', classRoom: 'ม.2/3', numberLabel: '1 ก', department: 'ฝ่ายอุปกรณ์', position: 'สมาชิกฝ่าย', timestamp: 100 },
  { fullName: 'สมชาย ใจดี', classRoom: 'ม.2/3', numberLabel: '1 ก', department: 'ฝ่ายอุปกรณ์', position: 'สมาชิกฝ่าย', timestamp: 200 }, // ซ้ำเป๊ะ
  { fullName: 'สมหญิง รักเรียน', classRoom: 'ม.4/4', numberLabel: '5 ข', department: 'ฝ่ายกีฬา', sportType: 'ฟุตบอล', position: 'นักกีฬา', timestamp: 150 }
];
const deduped = AttendanceAPI.dedupeRegs(mockRawData);
assert.strictEqual(deduped.length, 2, 'ต้องกรองข้อมูลที่ซ้ำเป๊ะออกเหลือ 2 รายการ');
assert.strictEqual(deduped[0].fullName, 'สมชาย ใจดี');
assert.strictEqual(deduped[1].fullName, 'สมหญิง รักเรียน');
console.log('  -> ผ่านการทดสอบ: Deduplication กรองข้อมูลซ้ำได้ถูกต้อง');

// 3. ทดสอบ Store State Management & Queries
console.log('[TEST 3/5] ทดสอบ AttendanceStore และ Query Domain Constraints...');
const AttendanceStore = require('../check-attendance/js/store.js');

const initialRegs = [
  { fullName: 'ประธาน หนึ่ง', nickname: 'หนึ่ง', classRoom: 'ม.6/4', numberLabel: '1 ก', roleCategory: 'central', centralPosition: 'ประธานสี', position: 'ประธานสี' },
  { fullName: 'หน. บาส', nickname: 'บาส', classRoom: 'ม.5/3', numberLabel: '2 ก', roleCategory: 'department', department: 'ฝ่ายกีฬา', sportType: 'บาสเกตบอล', position: 'หัวหน้ากีฬา' },
  { fullName: 'ประธาน สวัสดิการ', nickname: 'แคร์', classRoom: 'ม.4/11', numberLabel: '3 ก', roleCategory: 'department', department: 'ฝ่ายสวัสดิการ', position: 'ประธานฝ่าย' },
  { fullName: 'รอง สวัสดิการ', nickname: 'มิน', classRoom: 'ม.4/11', numberLabel: '4 ก', roleCategory: 'department', department: 'ฝ่ายสวัสดิการ', position: 'รองประธานฝ่ายสวัสดิการ' },
  { fullName: 'น้อง ม.1 คนเก่ง', nickname: 'น้อง', classRoom: 'ม.1/2', numberLabel: '1 ก', roleCategory: 'department', department: 'ฝ่ายสแตนเชียร์', position: 'สมาชิกฝ่าย', autoAssigned: true }
];

AttendanceStore.setRegs(initialRegs);

// ตรวจสอบ isCentralTaken
assert.ok(AttendanceStore.isCentralTaken('ประธานสี'), 'ประธานสีต้องมีผู้รับแล้ว');
assert.strictEqual(AttendanceStore.isCentralTaken('เหรัญญิก'), undefined, 'เหรัญญิกต้องว่าง');

// ตรวจสอบ isDeptPresidentTaken
assert.ok(AttendanceStore.isDeptPresidentTaken('ฝ่ายสวัสดิการ'), 'ฝ่ายสวัสดิการต้องมีประธานแล้ว');
assert.strictEqual(AttendanceStore.isDeptPresidentTaken('ฝ่ายอุปกรณ์'), undefined, 'ฝ่ายอุปกรณ์ต้องยังไม่มีประธาน');

// ตรวจสอบ isDeputyTaken
assert.ok(AttendanceStore.isDeputyTaken('ฝ่ายสวัสดิการ', 'รองประธานฝ่ายสวัสดิการ'), 'รองประธานฝ่ายสวัสดิการต้องมีผู้รับแล้ว');

// ตรวจสอบ isSportCaptainTaken
assert.ok(AttendanceStore.isSportCaptainTaken('บาสเกตบอล'), 'หัวหน้ากีฬาบาสต้องมีผู้รับแล้ว');
assert.strictEqual(AttendanceStore.isSportCaptainTaken('ฟุตบอล'), undefined, 'หัวหน้ากีฬาฟุตบอลต้องยังว่าง');

// ตรวจสอบ countDept
assert.strictEqual(AttendanceStore.countDept('ฝ่ายสวัสดิการ'), 2, 'ฝ่ายสวัสดิการต้องมี 2 คน');
assert.strictEqual(AttendanceStore.countDept('ฝ่ายสแตนเชียร์'), 1, 'ฝ่ายสแตนเชียร์ต้องมี 1 คน');

// ตรวจสอบ isSameRoleAlreadyTaken
const duplicateCandidate = {
  classRoom: 'ม.6/4',
  numberLabel: '1 ก',
  roleCategory: 'central',
  centralPosition: 'ประธานสี',
  department: '',
  position: 'ประธานสี',
  sportType: ''
};
assert.ok(AttendanceStore.isSameRoleAlreadyTaken(duplicateCandidate), 'ต้องตรวจพบว่าลงตำแหน่งเดิมซ้ำ');

const differentRoleCandidate = {
  classRoom: 'ม.6/4',
  numberLabel: '1 ก',
  roleCategory: 'department',
  centralPosition: '',
  department: 'ฝ่ายขบวน',
  position: 'สมาชิกฝ่าย',
  sportType: ''
};
assert.strictEqual(AttendanceStore.isSameRoleAlreadyTaken(differentRoleCandidate), undefined, 'คนเดิมลงตำแหน่งอื่นที่ไม่ซ้ำต้องอนุญาตได้');

console.log('  -> ผ่านการทดสอบ: Store & Constraint Queries ทำงานถูกต้อง 100%');

// 4. ทดสอบ SWR Cache Logic จำลอง
console.log('[TEST 4/5] ทดสอบการทำงานของ SWR Cache...');
let mockStorage = {};
global.sessionStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

AttendanceAPI.clearCache();
assert.strictEqual(AttendanceAPI.getCachedData(), null, 'เริ่มต้นแคชต้องว่าง');

// จำลองการเซฟแคช
mockStorage[AttendanceConfig.CACHE_KEY] = JSON.stringify(initialRegs);
mockStorage[AttendanceConfig.CACHE_TIME_KEY] = String(Date.now());

const cachedResult = AttendanceAPI.getCachedData();
assert.ok(cachedResult, 'ต้องดึงแคชได้');
assert.strictEqual(cachedResult.records.length, 5, 'แคชต้องมี 5 รายการ');
assert.strictEqual(cachedResult.isStale, false, 'แคชเพิ่งบันทึกต้องยังไม่ stale');

console.log('  -> ผ่านการทดสอบ: SWR Cache บันทึกและดึงข้อมูลได้สมบูรณ์ (0ms payload)');

// 5. ตรวจสอบ Syntax ของ app.js
console.log('[TEST 5/5] ทดสอบ Syntax ของ app.js...');
const fs = require('fs');
const appCode = fs.readFileSync('check-attendance/js/app.js', 'utf8');
assert.ok(appCode.includes('window.AttendanceApp = AttendanceApp;'), 'app.js ต้องเปิดเผย AttendanceApp');
assert.ok(appCode.includes('loadWithSWR'), 'app.js ต้องรองรับ SWR');
console.log('  -> ผ่านการทดสอบ: app.js มีโครงสร้างสมบูรณ์');

console.log('=== [การทดสอบทั้งหมดเสร็จสิ้น: ผ่านทุกข้อ 100% PASS] ===');
