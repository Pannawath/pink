/**
 * =========================================================================
 * AYUTTHAYA SARAKHAMPITTAYAKHOM | 2026 - CONFIG UI FILE (configUI.js)
 * ไฟล์ตั้งค่าสำหรับจัดการข้อความ สี ความเบลอ ความใส และ UI ทั้งหมดในหน้าเว็บ
 * =========================================================================
 */

const CONFIG_UI = {
  // =========================================================================
  // หมวดหมู่ที่ 1: การตั้งค่าสไตล์กระจกและความสวยงาม (Glassmorphism & Style Theme)
  // =========================================================================
  glassStyle: {
    // ความเบลอของตัวกรอบกระจก (px) - ค่าน้อยเบลอน้อย ค่ามากเบลอมาก (แนะนำ 20px - 60px)
    backdropBlur: '48px',

    // ความใส/ความโปร่งแสงของพื้นหลังกรอบกระจก (0.0 ถึง 1.0)
    bgOpacity: 0.18,

    // ความชัดของเส้นขอบกระจก (0.0 ถึง 1.0)
    borderOpacity: 0.88,

    // สีเงาและขอบมิติกรอบกระจก
    outlineColor: 'rgba(15, 23, 42, 0.12)',

    // รัศมีมุมมนของกรอบกระจกหลัก (px)
    cardBorderRadius: '30px'
  },

  // =========================================================================
  // หมวดหมู่ที่ 2: ข้อความส่วนหัวและแบรนด์ (Header & Branding Text)
  // =========================================================================
  header: {
    // ข้อความหัวเรื่องหลักตรงกลาง
    mainTitle: 'จองเสื้อกีฬาสี',

    // คำอธิบายรูปภาพโลโก้
    logoAltText: 'ตราโรงเรียนสารคามพิทยาคม',

    // เส้นทางรูปภาพโลโก้
    logoSrc: 'assets/images/school_crest.png'
  },

  // =========================================================================
  // หมวดหมู่ที่ 3: ปุ่มสลับมุมมองเสื้อ (View Switcher Controls Text)
  // =========================================================================
  viewControls: {
    // ปุ่มมุมมองด้านหลัง
    backViewText: 'ด้านหลัง',

    // ปุ่มมุมมองด้านหน้า
    frontViewText: 'ด้านหน้า',

    // ปุ่มมุมมองคู่หน้า-หลัง
    bothViewText: 'คู่หน้า-หลัง'
  },

  // =========================================================================
  // หมวดหมู่ที่ 4: ข้อมูลสินค้าและฟอร์มสั่งจอง (Product Info & Form Labels Text)
  // =========================================================================
  productAndForm: {
    // ชื่อสินค้า
    productTitle: 'เสื้อกีฬาสี สีชมพู',

    // สโลแกน / คำโปรยใต้ชื่อเสื้อ
    productSubtitle: 'ใส่ทีมเดียวกัน สู้ไปด้วยกัน',

    // ราคาสินค้าที่แสดง
    priceText: '฿390',

    // ป้ายกำกับช่องกรอกอีเมล
    emailLabel: 'อีเมลของคุณ *',
    emailPlaceholder: 'กรอกอีเมลก่อน...',
    emailNoticeText: 'กรอกอีเมลเพื่อเริ่มจอง (ถ้ามีข้อมูลเดิมจะดึงมาให้อัตโนมัติ)',

    // ป้ายกำกับช่องกรอกชื่อสกรีนและเบอร์
    screenNameLabel: 'ชื่อสกรีน',
    screenNamePlaceholder: 'ชื่อสกรีน...',
    screenNumberLabel: 'เบอร์',
    screenNumberPlaceholder: '10',

    // ป้ายกำกับหมวดไซส์เสื้อ
    sizeGuideLabel: 'ขนาดเสื้อ (Singha Design Size)',
    sizeGuideButtonText: 'ดูขนาดรอบอก →',

    // ข้อความส่วนแนบสลิป
    slipSectionTitle: 'หลักฐานการโอนเงิน (สลิปชำระเงิน)',
    slipStatusPendingText: 'รอตรวจสอบสลิป',
    slipAmountText: 'ยอดโอน ฿390',

    // ข้อมูลบัญชีธนาคาร
    bankNameText: 'ธนาคารกสิกรไทย (KBank) / พร้อมเพย์',
    bankAccountDetailText: '08X-XXX-XXXX • กีฬาสีทีมสีชมพู 2026',
    scanPayButtonText: 'สแกนจ่าย',

    // ช่องอัปโหลดไฟล์สลิป
    dropzoneTextClick: 'คลิกเพื่อเลือกไฟล์สลิป',
    dropzoneTextDrag: ' หรือ ลากไฟล์มาวางที่นี่',
    dropzoneNoticeText: 'รองรับรูปภาพ JPG, PNG, WEBP',

    // ปุ่มแอ็กชันล้างค่าและยืนยัน
    resetButtonText: 'ล้างค่า',
    submitButtonText: 'ยืนยันการสั่งจองและส่งสลิป'
  },

  // =========================================================================
  // หมวดหมู่ที่ 5: ป๊อปอัปแจ้งเตือนและโมดอล (Modals & Alerts Text)
  // =========================================================================
  modals: {
    // หัวข้อโมดอลตารางไซส์
    sizeGuideModalTitle: 'ตารางขนาดเสื้อกีฬา (Size Chart)',

    // หัวข้อโมดอลสแกน QR Code
    qrModalTitle: 'สแกน QR Code ชำระเงิน',
    qrModalSubtitle: 'ยอดชำระ 390 บาท (กีฬาสีทีมสีชมพู 2026)',

    // ข้อความแจ้งเตือนคำสั่งซื้อถูกยกเลิก
    cancelledAlertTitle: 'คำสั่งซื้อถูกยกเลิก',
    cancelledAlertSubtitle: 'ไม่ต้องตกใจนะครับ!',
    cancelledAlertDetail: 'คำสั่งซื้อของคุณถูกยกเลิกเนื่องจากข้อมูลไม่ครบถ้วนหรือมีปัญหา',
    cancelledAlertFixHeader: 'วิธีแก้ไข:',
    cancelledAlertFixList: [
      'อัปโหลดสลิปการชำระเงินใหม่อีกครั้ง',
      'ตรวจสอบข้อมูลให้ถูกต้องครบถ้วน',
      'หรือติดต่อทีมงานที่ OpenChat'
    ],
    cancelledContactButtonText: 'ติดต่อทีมงาน',
    cancelledCloseButtonText: 'เข้าใจแล้ว'
  }
};

// =========================================================================
// HELPER FUNCTION: สคริปต์ปรับแต่ง UI และข้อความบนหน้าเว็บอัตโนมัติตาม CONFIG_UI
// =========================================================================
(function applyConfigUI() {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG_UI === 'undefined') return;

    // 1. ปรับสไตล์กระจก Blur & Opacity ผ่าน CSS Variables
    if (CONFIG_UI.glassStyle) {
      const root = document.documentElement;
      if (CONFIG_UI.glassStyle.backdropBlur) {
        root.style.setProperty('--glass-blur', CONFIG_UI.glassStyle.backdropBlur);
      }
      if (CONFIG_UI.glassStyle.cardBorderRadius) {
        root.style.setProperty('--glass-radius', CONFIG_UI.glassStyle.cardBorderRadius);
      }
    }

    // 2. ปรับข้อความส่วน Header
    if (CONFIG_UI.header) {
      const brandTitle = document.querySelector('.app-brand-title');
      if (brandTitle && CONFIG_UI.header.mainTitle) {
        brandTitle.textContent = CONFIG_UI.header.mainTitle;
      }
      const logoImg = document.querySelector('.apple-glass-nav img');
      if (logoImg) {
        if (CONFIG_UI.header.logoSrc) logoImg.src = CONFIG_UI.header.logoSrc;
        if (CONFIG_UI.header.logoAltText) logoImg.alt = CONFIG_UI.header.logoAltText;
      }
    }

    // 3. ปรับข้อความปุ่มสลับมุมมอง
    if (CONFIG_UI.viewControls) {
      const btnBack = document.getElementById('btnViewBack');
      const btnFront = document.getElementById('btnViewFront');
      const btnBoth = document.getElementById('btnViewBoth');
      if (btnBack && CONFIG_UI.viewControls.backViewText) btnBack.textContent = CONFIG_UI.viewControls.backViewText;
      if (btnFront && CONFIG_UI.viewControls.frontViewText) btnFront.textContent = CONFIG_UI.viewControls.frontViewText;
      if (btnBoth && CONFIG_UI.viewControls.bothViewText) btnBoth.textContent = CONFIG_UI.viewControls.bothViewText;
    }

    // 4. ปรับข้อความข้อมูลสินค้า
    if (CONFIG_UI.productAndForm) {
      const pTitle = document.querySelector('h1.font-sport-bold');
      if (pTitle && CONFIG_UI.productAndForm.productTitle) pTitle.textContent = CONFIG_UI.productAndForm.productTitle;

      const pSubtitle = document.querySelector('p.text-xs.text-slate-500');
      if (pSubtitle && CONFIG_UI.productAndForm.productSubtitle) pSubtitle.textContent = CONFIG_UI.productAndForm.productSubtitle;
    }
  });
})();
