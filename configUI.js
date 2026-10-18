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
    backdropBlur: '40px',

    // ความใส/ความโปร่งแสงของพื้นหลังกรอบกระจก (0.0 ถึง 1.0)
    bgOpacity: 0.08,

    // ความชัดของเส้นขอบกระจก (0.0 ถึง 1.0)
    borderOpacity: 0.65,

    // สีเงาและขอบมิติกรอบกระจก
    outlineColor: 'rgba(15, 23, 42, 0.08)',

    // รัศมีมุมมนของกรอบกระจกหลัก (px)
    cardBorderRadius: '32px'
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
    productSubtitle: '',

    // ราคาสินค้าที่แสดง
    priceText: '฿275',

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
    slipAmountText: 'ยอดโอน ฿275',

    // ข้อมูลบัญชีธนาคาร
    bankNameText: 'ธนาคารกสิกรไทย (KBank) / พร้อมเพย์',
    bankAccountDetailText: '09X-XXX-XXXX • กีฬาสีทีมสีชมพู 2026',
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
    qrModalSubtitle: 'ยอดชำระ 275 บาท (กีฬาสีทีมสีชมพู 2026)',

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
// สคริปต์ปรับแต่ง UI และข้อความบนหน้าเว็บอัตโนมัติตาม CONFIG_UI
// =========================================================================
function applyGlassTokens() {
  const styleConfig = CONFIG_UI.glassStyle;
  if (!styleConfig) return;
  const rootElement = document.documentElement;
  if (styleConfig.backdropBlur) {
    rootElement.style.setProperty('--glass-blur', styleConfig.backdropBlur);
  }
  if (styleConfig.cardBorderRadius) {
    rootElement.style.setProperty('--glass-radius', styleConfig.cardBorderRadius);
  }
}

function applyHeaderBranding() {
  const headerConfig = CONFIG_UI.header;
  if (!headerConfig) return;
  const brandTitle = document.querySelector('.app-brand-title');
  if (brandTitle && headerConfig.mainTitle) {
    brandTitle.textContent = headerConfig.mainTitle;
  }
  const logoImage = document.querySelector('.apple-glass-nav img');
  if (logoImage) {
    if (headerConfig.logoSrc) logoImage.src = headerConfig.logoSrc;
    if (headerConfig.logoAltText) logoImage.alt = headerConfig.logoAltText;
  }
}

function applyViewControlLabels() {
  const controlsConfig = CONFIG_UI.viewControls;
  if (!controlsConfig) return;
  const btnBack = document.getElementById('btnViewBack');
  const btnFront = document.getElementById('btnViewFront');
  const btnBoth = document.getElementById('btnViewBoth');
  if (btnBack && controlsConfig.backViewText) btnBack.textContent = controlsConfig.backViewText;
  if (btnFront && controlsConfig.frontViewText) btnFront.textContent = controlsConfig.frontViewText;
  if (btnBoth && controlsConfig.bothViewText) btnBoth.textContent = controlsConfig.bothViewText;
}

function applyProductDetails() {
  const productConfig = CONFIG_UI.productAndForm;
  if (!productConfig) return;
  const productHeading = document.querySelector('h1.font-sport-bold');
  if (productHeading && productConfig.productTitle) productHeading.textContent = productConfig.productTitle;
  const productSubtitle = document.querySelector('p.text-xs.text-slate-500');
  if (productSubtitle && productConfig.productSubtitle) productSubtitle.textContent = productConfig.productSubtitle;
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CONFIG_UI === 'undefined') return;
  applyGlassTokens();
  applyHeaderBranding();
  applyViewControlLabels();
  applyProductDetails();
});
