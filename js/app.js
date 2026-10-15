// ========================================================
// แผงตั้งค่าพิกัด & ขนาดสกรีนเสื้อ (สามารถปรับค่าที่นี่ได้โดยตรง)
// ========================================================
const JERSEY_CONFIG = {
  // 1. เบอร์ด้านหลัง (Back Number)
  backNumber: {
    x: 390,        // แนวนอน (390 = กึ่งกลางเสื้อพอดี)
    y: 470,        // แนวตั้ง (ความสูงของเบอร์หลัง)
    size: 350      // ขนาดตัวเลขด้านหลัง
  },

  // 2. ชื่อด้านหลัง (Back Name)
  backName: {
    arcCurveY: 235, // ระดับความโค้งของชื่อแนวตั้ง (Y)
    baseSize: 100   // ขนาดตัวอักษรชื่อเริ่มต้น
  },


};

// ==========================================
// 1. APPLICATION STATE
// ==========================================
const AppState = {
  mode: 'new', // 'new' | 'edit'
  viewSide: 'back', // 'back' | 'front' | 'both'
  email: '',
  classroom: '',
  studentNumber: '',
  size: 'L',
  screenName: '',
  screenNumber: '70',
  paymentStatus: 'pending', // legacy
  orderStatus: 'รอชำระเงิน', // ค่าสถานะหลักที่บันทึกลง Sheets
  slipImage: null, // Base64 data URL
  slipFileName: '',
  slipUploadedAt: null,
  slipUrl: null, // URL of uploaded slip on Drive
  slipChanged: false, // Track if slip was changed during edit mode
  isSearchingEmail: false,
  isSubmitting: false,
  gasUrl: (typeof CONFIG !== 'undefined' && CONFIG.backend && CONFIG.backend.gasUrl) 
    ? CONFIG.backend.gasUrl 
    : ((typeof CONFIG !== 'undefined' && CONFIG.gasUrl) ? CONFIG.gasUrl : (localStorage.getItem('PINK_JERSEY_GAS_URL') || 'https://script.google.com/macros/s/AKfycbzW3qFotga96C9HjKxdkI3GFe5dxqJpTQnM4bMgwgJ75kwI7lIYsqGMD7xXpquvaQ-2/exec')),
  spreadsheetId: (typeof CONFIG !== 'undefined' && CONFIG.backend && CONFIG.backend.spreadsheetId)
    ? CONFIG.backend.spreadsheetId
    : '13qV2hAzFf5a9LpVUQPgcDcpWj7GypL5J8jMH8ttGqJ0',
  existingRecord: null,
  orders: []
};

// ==========================================
// 2. DOM ELEMENT REFERENCES
// ==========================================
const DOM = {
  // Form Inputs & Buttons
  configuratorCard: document.getElementById('configuratorCard'),
  inputEmail: document.getElementById('inputEmail'),
  emailLoadingSpinner: document.getElementById('emailLoadingSpinner'),
  emailStatusBadge: document.getElementById('emailStatusBadge'),
  onboardingHintStep1: document.getElementById('onboardingHintStep1'),
  formContentSection: document.getElementById('formContentSection'),
  submitButtonSection: document.getElementById('submitButtonSection'),
  inputStudentNumber: document.getElementById('inputStudentNumber'),
  selectClassroom: document.getElementById('selectClassroom'),
  inputScreenName: document.getElementById('inputScreenName'),
  inputScreenNumber: document.getElementById('inputScreenNumber'),
  btnSubmit: document.getElementById('btnSubmit'),
  btnSubmitText: document.getElementById('btnSubmitText'),
  btnSubmitIcon: document.getElementById('btnSubmitIcon'),
  submitSlipNotice: document.getElementById('submitSlipNotice'),
  btnReset: document.getElementById('btnResetForm'),
  btnRandomNumber: document.getElementById('btnRandomNumber'),
  btnCapsName: document.getElementById('btnCapsName'),
  sizeBtns: document.querySelectorAll('.size-btn'),
  quickSelectSizeBtns: document.querySelectorAll('.btn-quick-select-size'),

  // Mode Banner
  modeStatusBanner: document.getElementById('modeStatusBanner'),
  btnCancelEditMode: document.getElementById('btnCancelEditMode'),
  paymentStatusDisplay: document.getElementById('paymentStatusDisplay'),
  paymentStatusText: document.getElementById('paymentStatusText'),

  // Order Status Display (Read-only)
  paymentStatusSection: document.getElementById('paymentStatusSection'),
  orderStatusBadge: document.getElementById('orderStatusBadge'),
  statusBtns: document.querySelectorAll('.status-btn'),

  // Payment & Slip Upload Elements
  btnCopyAccount: document.getElementById('btnCopyAccount'),
  qrPromptPayModal: document.getElementById('qrPromptPayModal'),
  btnCloseQrModal: document.getElementById('btnCloseQrModal'),
  qrPromptPayImage: document.getElementById('qrPromptPayImage'),
  promptPayNumber: document.getElementById('promptPayNumber'),
  btnCopyPromptPay: document.getElementById('btnCopyPromptPay'),
  slipDropzone: document.getElementById('slipDropzone'),
  inputSlipFile: document.getElementById('inputSlipFile'),
  slipPreviewCard: document.getElementById('slipPreviewCard'),
  slipThumbnailImg: document.getElementById('slipThumbnailImg'),
  slipStatusBadge: document.getElementById('slipStatusBadge'),
  slipFileName: document.getElementById('slipFileName'),
  slipUploadTime: document.getElementById('slipUploadTime'),
  btnViewSlipFullscreen: document.getElementById('btnViewSlipFullscreen'),
  btnChangeSlip: document.getElementById('btnChangeSlip'),
  btnRemoveSlip: document.getElementById('btnRemoveSlip'),

  // Slip Lightbox Modal
  modalSlipLightbox: document.getElementById('modalSlipLightbox'),
  btnCloseSlipLightbox: document.getElementById('btnCloseSlipLightbox'),
  slipFullImg: document.getElementById('slipFullImg'),

  // Preview Elements
  jerseyCardWrapper: document.getElementById('jerseyCardWrapper'),
  jerseyViewBackEl: document.getElementById('jerseyViewBackEl'),
  jerseyViewFrontEl: document.getElementById('jerseyViewFrontEl'),
  jerseyViewBothEl: document.getElementById('jerseyViewBothEl'),

  // SVG Text & Paths
  nameArcPath: document.getElementById('nameArcPath'),
  svgCurvedNameText: document.getElementById('svgCurvedNameText'),
  svgBackNumber: document.getElementById('svgBackNumber'),
  svgFrontNumber: document.getElementById('svgFrontNumber'),
  nameArcPathBoth: document.getElementById('nameArcPathBoth'),
  svgCurvedNameBoth: document.getElementById('svgCurvedNameBoth'),
  svgBothNumber: document.getElementById('svgBothNumber'),
  svgBothFrontNumber: document.getElementById('svgBothFrontNumber'),

  // View Switchers (Dual: Header + Stage)
  headerSegmentedControl: document.getElementById('headerSegmentedControl'),
  headerSegmentedIndicator: document.getElementById('headerSegmentedIndicator'),
  headerBtnViewBack: document.getElementById('headerBtnViewBack'),
  headerBtnViewFront: document.getElementById('headerBtnViewFront'),
  headerBtnViewBoth: document.getElementById('headerBtnViewBoth'),
  stageSegmentedWrapper: document.getElementById('stageSegmentedWrapper'),
  stageSegmentedControl: document.getElementById('stageSegmentedControl'),
  stageSegmentedIndicator: document.getElementById('stageSegmentedIndicator'),
  stageBtnViewBack: document.getElementById('stageBtnViewBack'),
  stageBtnViewFront: document.getElementById('stageBtnViewFront'),
  stageBtnViewBoth: document.getElementById('stageBtnViewBoth'),
  btnToggleRotation: null,
  btnDownloadJersey: document.getElementById('btnDownloadJersey'),

  // Size Guide Modal
  modalSizeGuide: document.getElementById('modalSizeGuide'),
  btnOpenSizeGuideNav: document.getElementById('btnOpenSizeGuideNav'),
  btnOpenSizeGuideLink: document.getElementById('btnOpenSizeGuideLink'),
  btnCloseSizeGuide: document.getElementById('btnCloseSizeGuide'),

  // Google Sheets Config Modal
  btnOpenConfig: document.getElementById('btnOpenConfig'),
  btnCloseConfig: document.getElementById('btnCloseConfig'),
  modalConfig: document.getElementById('modalConfig'),
  inputGasUrl: document.getElementById('inputGasUrl'),
  btnSaveConfig: document.getElementById('btnSaveConfig'),
  btnTestGas: document.getElementById('btnTestGas'),
  gasStatusDot: document.getElementById('gasStatusDot'),
  gasStatusText: document.getElementById('gasStatusText'),

  // Database Modals & Toast
  totalOrdersCount: document.getElementById('totalOrdersCount'),
  modalOrdersCount: document.getElementById('modalOrdersCount'),
  btnOpenDatabase: document.getElementById('btnOpenDatabase'),
  btnCloseDatabase: document.getElementById('btnCloseDatabase'),
  btnCloseDatabaseFooter: document.getElementById('btnCloseDatabaseFooter'),
  modalDatabase: document.getElementById('modalDatabase'),
  ordersListContainer: document.getElementById('ordersListContainer'),
  btnExportCSV: document.getElementById('btnExportCSV'),
  btnBottomOrders: document.getElementById('btnBottomOrders'),
  btnBottomSize: document.getElementById('btnBottomSize'),
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// 3. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  updateLivePreview();
  setJerseyView(AppState.viewSide);
  checkGasConnection();
  preloadHighResImages();
});

// ==========================================
// 4. EVENT BINDINGS
// ==========================================
function bindEmailSyncEvents() {
  let emailDebounceTimer;
  let lastSearchedEmail = '';

  DOM.inputEmail.addEventListener('input', (event) => {
    AppState.email = event.target.value.trim();
    clearTimeout(emailDebounceTimer);

    if (!isValidEmail(AppState.email)) {
      lastSearchedEmail = '';
      resetToNewMode();
      hideFormContent();
      if (AppState.email.length > 0) {
        DOM.emailStatusBadge.className = 'text-[11px] font-semibold text-amber-700';
        DOM.emailStatusBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation text-amber-500 mr-1"></i>รูปแบบอีเมลไม่ถูกต้อง';
        DOM.emailStatusBadge.classList.remove('hidden');
      } else {
        DOM.emailStatusBadge.classList.add('hidden');
      }
      return;
    }

    if (AppState.email === lastSearchedEmail) return;

    emailDebounceTimer = setTimeout(() => {
      lastSearchedEmail = AppState.email;
      lookupEmailAndShowForm(AppState.email);
    }, 500);
  });
}

function bindPersonalizationEvents() {
  DOM.inputScreenName.addEventListener('input', (event) => {
    AppState.screenName = event.target.value;
    updateLivePreview();
  });

  DOM.inputScreenNumber.addEventListener('input', (event) => {
    let numericDigits = event.target.value.replace(/\D/g, '');
    if (numericDigits.length > 2) numericDigits = numericDigits.slice(0, 2);
    AppState.screenNumber = numericDigits;
    event.target.value = numericDigits;
    updateLivePreview();
  });

  if (DOM.btnCapsName) {
    DOM.btnCapsName.addEventListener('click', () => {
      AppState.screenName = AppState.screenName.toUpperCase();
      DOM.inputScreenName.value = AppState.screenName;
      updateLivePreview();
    });
  }

  if (DOM.btnRandomNumber) {
    DOM.btnRandomNumber.addEventListener('click', () => {
      const luckyList = ['07', '09', '10', '11', '14', '20', '23', '26', '77', '99'];
      const chosenNumber = luckyList[Math.floor(Math.random() * luckyList.length)];
      AppState.screenNumber = chosenNumber;
      DOM.inputScreenNumber.value = chosenNumber;
      updateLivePreview();
    });
  }

  if (DOM.selectClassroom) {
    DOM.selectClassroom.addEventListener('change', (event) => {
      AppState.classroom = event.target.value;
    });
  }
}

function bindSizeAndStatusEvents() {
  DOM.sizeBtns.forEach(sizeElement => {
    sizeElement.addEventListener('click', () => {
      DOM.sizeBtns.forEach(btnItem => btnItem.classList.remove('active'));
      sizeElement.classList.add('active');
      AppState.size = sizeElement.getAttribute('data-size');
    });
  });

  DOM.quickSelectSizeBtns.forEach(quickElement => {
    quickElement.addEventListener('click', () => {
      const targetSize = quickElement.getAttribute('data-select-size');
      AppState.size = targetSize;
      DOM.sizeBtns.forEach(btnItem => {
        btnItem.classList.toggle('active', btnItem.getAttribute('data-size') === targetSize);
      });
      if (DOM.modalSizeGuide) DOM.modalSizeGuide.classList.add('hidden');
      showToast(`เลือกไซส์ ${targetSize} เรียบร้อยแล้ว`, 'success');
    });
  });

  document.querySelectorAll('.status-btn').forEach(statusElement => {
    statusElement.addEventListener('click', () => {
      document.querySelectorAll('.status-btn').forEach(btnItem => btnItem.classList.remove('active'));
      statusElement.classList.add('active');
      AppState.orderStatus = statusElement.getAttribute('data-status');
      updateSlipUploadAccess();
    });
  });
}

function bindViewSwitcherEvents() {
  const pairs = [
    { btn: DOM.headerBtnViewBack, side: 'back' },
    { btn: DOM.headerBtnViewFront, side: 'front' },
    { btn: DOM.headerBtnViewBoth, side: 'both' },
    { btn: DOM.stageBtnViewBack, side: 'back' },
    { btn: DOM.stageBtnViewFront, side: 'front' },
    { btn: DOM.stageBtnViewBoth, side: 'both' }
  ];
  pairs.forEach(({ btn, side }) => {
    if (btn) btn.addEventListener('click', () => setJerseyView(side));
  });

  if (DOM.btnOpenSizeGuideNav) {
    DOM.btnOpenSizeGuideNav.addEventListener('click', () => DOM.modalSizeGuide.classList.remove('hidden'));
  }
  if (DOM.btnOpenSizeGuideLink) {
    DOM.btnOpenSizeGuideLink.addEventListener('click', () => DOM.modalSizeGuide.classList.remove('hidden'));
  }
  if (DOM.btnCloseSizeGuide) {
    DOM.btnCloseSizeGuide.addEventListener('click', () => DOM.modalSizeGuide.classList.add('hidden'));
  }
}

function bindOrderActionEvents() {
  DOM.btnReset.addEventListener('click', () => {
    if (confirm('คุณต้องการล้างข้อมูลในแบบฟอร์มใช่หรือไม่?')) resetForm();
  });

  DOM.btnSubmit.addEventListener('click', handleFormSubmit);

  if (DOM.btnDownloadJersey) {
    DOM.btnDownloadJersey.addEventListener('click', downloadJerseyMockup);
  }
  if (DOM.btnCancelEditMode) {
    DOM.btnCancelEditMode.addEventListener('click', resetToNewMode);
  }
}

function bindDatabaseModalEvents() {
  if (DOM.btnOpenDatabase) DOM.btnOpenDatabase.addEventListener('click', openDatabaseModal);
  if (DOM.btnCloseDatabase) DOM.btnCloseDatabase.addEventListener('click', closeDatabaseModal);
  if (DOM.btnCloseDatabaseFooter) DOM.btnCloseDatabaseFooter.addEventListener('click', closeDatabaseModal);
  if (DOM.btnExportCSV) DOM.btnExportCSV.addEventListener('click', exportOrdersToCSV);
}

function bindConfigModalEvents() {
  if (DOM.btnOpenConfig) DOM.btnOpenConfig.addEventListener('click', openConfigModal);
  if (DOM.btnCloseConfig) DOM.btnCloseConfig.addEventListener('click', closeConfigModal);
  if (DOM.btnSaveConfig) DOM.btnSaveConfig.addEventListener('click', saveGasConfig);
  if (DOM.btnTestGas) DOM.btnTestGas.addEventListener('click', testGasConnection);
}

function bindActionModalEvents() {
  bindOrderActionEvents();
  bindDatabaseModalEvents();
  bindConfigModalEvents();
}

function bindEvents() {
  bindEmailSyncEvents();
  bindPersonalizationEvents();
  bindSizeAndStatusEvents();
  bindViewSwitcherEvents();
  bindActionModalEvents();
  initSlipUploadEvents();
  bindMobileScrollCollapse();
  bindModalAccessibilityEvents();
}

// ==========================================
// 5. SLIP UPLOAD & PROCESSING
// ==========================================
function bindSlipDropzoneEvents() {
  if (DOM.inputSlipFile) {
    DOM.inputSlipFile.addEventListener('change', (event) => {
      const selectedFiles = event.target.files;
      if (selectedFiles && selectedFiles.length > 0) processSlipFile(selectedFiles[0]);
    });
  }

  if (!DOM.slipDropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    DOM.slipDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      DOM.slipDropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    DOM.slipDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      DOM.slipDropzone.classList.remove('dragover');
    });
  });

  DOM.slipDropzone.addEventListener('drop', (event) => {
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) processSlipFile(droppedFiles[0]);
  });
}

function bindSlipActionButtons() {
  if (DOM.btnChangeSlip) {
    DOM.btnChangeSlip.addEventListener('click', () => DOM.inputSlipFile.click());
  }

  if (DOM.btnRemoveSlip) {
    DOM.btnRemoveSlip.addEventListener('click', () => {
      AppState.slipImage = null;
      AppState.slipFileName = '';
      AppState.slipUploadedAt = null;
      renderSlipPreview();
      showToast('ลบไฟล์สลิปแล้ว', 'info');
    });
  }
}

function bindSlipLightboxModalEvents() {
  if (DOM.btnViewSlipFullscreen) {
    DOM.btnViewSlipFullscreen.addEventListener('click', () => {
      if (!AppState.slipImage) return;
      DOM.slipFullImg.src = AppState.slipImage;
      DOM.modalSlipLightbox.classList.remove('hidden');
    });
  }

  if (DOM.btnCloseSlipLightbox) {
    DOM.btnCloseSlipLightbox.addEventListener('click', () => {
      DOM.modalSlipLightbox.classList.add('hidden');
    });
  }

  if (DOM.modalSlipLightbox) {
    DOM.modalSlipLightbox.addEventListener('click', (event) => {
      if (event.target === DOM.modalSlipLightbox) DOM.modalSlipLightbox.classList.add('hidden');
    });
  }
}

function bindSlipLightboxEvents() {
  bindSlipActionButtons();
  bindSlipLightboxModalEvents();
}

function initSlipUploadEvents() {
  if (DOM.btnCopyAccount) {
    DOM.btnCopyAccount.addEventListener('click', openQrPromptPayModal);
  }
  bindSlipDropzoneEvents();
  bindSlipLightboxEvents();
}

// ==========================================
// QR PROMPTPAY MODAL
// ==========================================
function getPromptPayDetails() {
  const number = (typeof CONFIG !== 'undefined' && CONFIG.promptPayNumber)
    ? CONFIG.promptPayNumber
    : '09X-XXX-XXXX';
  const name = (typeof CONFIG !== 'undefined' && CONFIG.accountName)
    ? CONFIG.accountName
    : 'คณะสีชมพู สารคามพิทยาคม';
  return { number, name };
}

function openQrPromptPayModal() {
  const account = getPromptPayDetails();
  const cleanNumber = (account.number || '').replace(/[^0-9]/g, '');
  const isNumeric = cleanNumber.length >= 10;
  
  if (DOM.qrPromptPayImage) {
    if (isNumeric) {
      DOM.qrPromptPayImage.src = `https://promptpay.io/${cleanNumber}/275.png`;
    } else {
      DOM.qrPromptPayImage.src = 'assets/images/qr-code.png';
    }
  }
  if (DOM.promptPayNumber) {
    DOM.promptPayNumber.textContent = account.number;
  }
  
  if (DOM.qrPromptPayModal) {
    DOM.qrPromptPayModal.classList.remove('hidden');
  }
}

function closeQrPromptPayModal() {
  if (DOM.qrPromptPayModal) {
    DOM.qrPromptPayModal.classList.add('hidden');
  }
}

// Event listeners for QR modal
if (DOM.btnCloseQrModal) {
  DOM.btnCloseQrModal.addEventListener('click', closeQrPromptPayModal);
}

if (DOM.qrPromptPayModal) {
  DOM.qrPromptPayModal.addEventListener('click', (e) => {
    if (e.target === DOM.qrPromptPayModal) {
      closeQrPromptPayModal();
    }
  });
}

if (DOM.btnCopyPromptPay) {
  DOM.btnCopyPromptPay.addEventListener('click', () => {
    const account = getPromptPayDetails();
    navigator.clipboard.writeText(account.number).then(() => {
      showToast(`คัดลอกเลขพร้อมเพย์ ${account.number} แล้ว`, 'success');
    }).catch(() => {
      showToast(`เลขพร้อมเพย์: ${account.number}`, 'info');
    });
  });
}

function processSlipFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)', 'error');
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    showToast('ขนาดไฟล์ใหญ่เกิน 15MB กรุณาเลือกไฟล์ที่เล็กลง', 'error');
    return;
  }

  showToast('กำลังประมวลผลรูปภาพสลิป...', 'info');

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target.result;
    compressSlipImage(rawDataUrl, (compressedDataUrl) => {
      AppState.slipImage = compressedDataUrl;
      AppState.slipFileName = file.name;
      AppState.slipUploadedAt = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      AppState.slipChanged = true; // Mark that slip was changed
      renderSlipPreview();
      showToast('แนบสลิปเรียบร้อยแล้ว!', 'success');
    });
  };
  reader.readAsDataURL(file);
}

function compressSlipImage(dataUrl, callback) {
  const img = new Image();
  img.onload = () => {
    const maxWidth = 900;
    const maxHeight = 1200;
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      if (width / height > maxWidth / maxHeight) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', 0.85);
    callback(compressed);
  };
  img.src = dataUrl;
}

// ==========================================
// ORDER STATUS DISPLAY (READ-ONLY from Sheets)
// ==========================================
function getOrCreatePaymentNotice(parentContainer) {
  let noticeElement = document.getElementById('paymentCompleteInfo');
  if (noticeElement) return noticeElement;

  noticeElement = document.createElement('div');
  noticeElement.id = 'paymentCompleteInfo';
  noticeElement.className = 'p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-sm mt-3';
  noticeElement.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
        <i class="fa-solid fa-circle-check text-lg"></i>
      </div>
      <div>
        <p class="font-bold text-green-800 mb-1">ชำระเงินเรียบร้อยแล้ว</p>
        <p class="text-xs text-green-700">รอรับของได้เลย หากจะแก้ข้อมูล ชื่อ หมายเลข หรือ ไซส์ ก็แก้ไปเลย</p>
      </div>
    </div>
  `;

  if (parentContainer && parentContainer.parentNode) {
    parentContainer.parentNode.insertBefore(noticeElement, parentContainer.nextSibling);
  }
  return noticeElement;
}

function updateSlipUploadAccess() {
  const lockedStatuses = ['ชำระเงินแล้ว', 'กำลังผลิต', 'จัดส่งแล้ว', 'เสร็จสิ้น'];
  const isLocked = lockedStatuses.includes(AppState.orderStatus);
  const slipSection = document.getElementById('slipUploadSection');

  if (!slipSection) return;

  if (isLocked) {
    slipSection.style.display = 'none';
    const noticeElement = getOrCreatePaymentNotice(slipSection);
    noticeElement.style.display = 'block';
    return;
  }

  slipSection.style.display = '';
  const existingNotice = document.getElementById('paymentCompleteInfo');
  if (existingNotice) existingNotice.style.display = 'none';
}

function renderOrderStatus(statusText) {
  console.log('[RENDER STATUS] Called with:', statusText);

  if (!statusText || statusText.trim() === '') {
    // Show default status
    statusText = 'รอชำระเงิน';
  }

  // Show alert for cancelled status
  if (statusText === 'ยกเลิก') {
    setTimeout(() => {
      showCancelledOrderAlert();
    }, 500);
  }

  // Update active status button
  const statusBtns = document.querySelectorAll('.status-btn');
  statusBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-status') === statusText);
  });
  
  // Update slip upload access based on status
  AppState.orderStatus = statusText;
  updateSlipUploadAccess();
}

function normalizeSlipImageUrl(sourceUrl) {
  if (!sourceUrl || sourceUrl.indexOf('http') !== 0) return sourceUrl;
  if (sourceUrl.indexOf('drive.google.com') === -1) return sourceUrl;
  const fileIdMatch = sourceUrl.match(/[?&]id=([^&]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`;
  }
  return sourceUrl;
}

function updateSlipStatusBadge(isExternalUrl) {
  if (!DOM.slipStatusBadge) return;
  if (AppState.mode === 'edit' && isExternalUrl) {
    DOM.slipStatusBadge.className = 'text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md inline-block mb-0.5';
    DOM.slipStatusBadge.innerHTML = '<i class="fa-solid fa-receipt mr-1"></i>สลิปเดิมที่เคยแนบไว้';
  } else {
    DOM.slipStatusBadge.className = 'text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block mb-0.5';
    DOM.slipStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i>แนบสลิปเรียบร้อยแล้ว';
  }
}

function updateSubmitButtonAvailability() {
  if (!DOM.btnSubmit) return;
  const isEligible = AppState.mode === 'edit' || Boolean(AppState.slipImage);
  DOM.btnSubmit.disabled = !isEligible;
  if (!isEligible) {
    DOM.btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
    DOM.btnSubmit.title = 'กรุณาแนบสลิปการโอนเงินก่อนยืนยันการสั่งจอง';
    if (DOM.submitSlipNotice) DOM.submitSlipNotice.classList.remove('hidden');
  } else {
    DOM.btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');
    DOM.btnSubmit.removeAttribute('title');
    if (DOM.submitSlipNotice) DOM.submitSlipNotice.classList.add('hidden');
  }
}

function clearSlipPreview() {
  if (DOM.slipDropzone) DOM.slipDropzone.classList.remove('hidden');
  if (DOM.slipPreviewCard) DOM.slipPreviewCard.classList.add('hidden');
  if (DOM.slipThumbnailImg) DOM.slipThumbnailImg.src = '';
  if (DOM.slipFullImg) DOM.slipFullImg.src = '';
  if (DOM.inputSlipFile) DOM.inputSlipFile.value = '';
  updateSubmitButtonAvailability();
}

function renderSlipPreview() {
  if (!AppState.slipImage) {
    clearSlipPreview();
    return;
  }

  if (DOM.slipDropzone) DOM.slipDropzone.classList.add('hidden');
  if (DOM.slipPreviewCard) DOM.slipPreviewCard.classList.remove('hidden');

  const isExternalUrl = AppState.slipImage.indexOf('http') === 0;
  const imageUrl = normalizeSlipImageUrl(AppState.slipImage);

  if (DOM.slipThumbnailImg) {
    DOM.slipThumbnailImg.src = imageUrl;
    DOM.slipThumbnailImg.onerror = function() {
      this.src = AppState.slipImage;
    };
  }
  if (DOM.slipFullImg) DOM.slipFullImg.src = imageUrl;
  if (DOM.slipFileName) DOM.slipFileName.textContent = AppState.slipFileName || 'slip_payment.jpg';
  if (DOM.slipUploadTime) DOM.slipUploadTime.textContent = AppState.slipUploadedAt ? `อัปโหลดเมื่อ ${AppState.slipUploadedAt}` : 'มีสลิปในระบบ';

  updateSlipStatusBadge(isExternalUrl);
  updateSubmitButtonAvailability();
}

// ==========================================
// 6. LIVE PREVIEW ENGINE (CLEAN - NO SHADOWS)
// ==========================================
function calculateDynamicNameTypography(nameText, baseSize) {
  const len = nameText ? nameText.trim().length : 0;
  let dynamicSize = baseSize;
  let letterSpacing = '4';

  if (len === 0) {
    dynamicSize = baseSize;
    letterSpacing = '4';
  } else if (len <= 4) {
    dynamicSize = Math.max(baseSize, Math.round(baseSize * 1.08));
    letterSpacing = '9';
  } else if (len <= 6) {
    dynamicSize = baseSize;
    letterSpacing = '6';
  } else if (len <= 8) {
    dynamicSize = Math.round(baseSize * 0.90);
    letterSpacing = '4';
  } else if (len <= 10) {
    dynamicSize = Math.round(baseSize * 0.78);
    letterSpacing = '2.5';
  } else if (len <= 12) {
    dynamicSize = Math.round(baseSize * 0.68);
    letterSpacing = '1.8';
  } else {
    dynamicSize = Math.round(baseSize * 0.58);
    letterSpacing = '1';
  }

  return { dynamicSize, letterSpacing };
}

function syncCurvedSvgName(targetTextEl, targetPathEl, displayName, typographyConfig) {
  if (targetPathEl) {
    targetPathEl.setAttribute('d', `M 140 270 Q 390 ${JERSEY_CONFIG.backName.arcCurveY} 640 270`);
  }
  if (targetTextEl) {
    targetTextEl.textContent = displayName;
    const parentText = targetTextEl.parentElement;
    if (parentText) {
      parentText.setAttribute('font-size', typographyConfig.dynamicSize.toString());
      parentText.setAttribute('letter-spacing', typographyConfig.letterSpacing);
      parentText.setAttribute('font-family', "'Computer Modern Serif', 'CMU Serif', serif");
      parentText.setAttribute('font-weight', '900');
      parentText.style.fill = '#5C3C2B';
      parentText.removeAttribute('filter');
    }
  }
}

function syncJerseySvgNumber(targetNumberEl, displayNumber, sizeConfig) {
  if (!targetNumberEl) return;
  targetNumberEl.style.fontFamily = "'Lobster', 'BebasNeue', cursive";
  targetNumberEl.style.fill = '#5C3C2B';
  targetNumberEl.setAttribute('font-size', sizeConfig.size.toString());
  targetNumberEl.setAttribute('x', sizeConfig.x.toString());
  targetNumberEl.setAttribute('y', sizeConfig.y.toString());
  targetNumberEl.textContent = displayNumber;
}

function updateLivePreview() {
  const nameText = (AppState.screenName || '').toString().trim();
  const numberText = (AppState.screenNumber || '10').toString().trim();
  const displayName = nameText || 'NAME';
  const displayNumber = numberText || '10';

  const typographyConfig = calculateDynamicNameTypography(nameText, JERSEY_CONFIG.backName.baseSize);

  syncCurvedSvgName(DOM.svgCurvedNameText, DOM.nameArcPath, displayName, typographyConfig);
  syncCurvedSvgName(DOM.svgCurvedNameBoth, DOM.nameArcPathBoth, displayName, typographyConfig);

  syncJerseySvgNumber(DOM.svgBackNumber, displayNumber, JERSEY_CONFIG.backNumber);
  syncJerseySvgNumber(DOM.svgBothNumber, displayNumber, JERSEY_CONFIG.backNumber);

  applyNumberStyle();
}

function applyNumberStyle() {
  const cls = 'number-style-clean';
  if (DOM.svgBackNumber) DOM.svgBackNumber.setAttribute('class', cls);
  if (DOM.svgBothNumber) DOM.svgBothNumber.setAttribute('class', cls);
}

function updateSegmentedIndicator(side) {
  const configs = [
    {
      indicator: DOM.headerSegmentedIndicator,
      map: {
        back: DOM.headerBtnViewBack,
        front: DOM.headerBtnViewFront,
        both: DOM.headerBtnViewBoth
      }
    },
    {
      indicator: DOM.stageSegmentedIndicator,
      map: {
        back: DOM.stageBtnViewBack,
        front: DOM.stageBtnViewFront,
        both: DOM.stageBtnViewBoth
      }
    }
  ];

  configs.forEach(({ indicator, map }) => {
    if (!indicator) return;
    const activeBtn = map[side];
    if (activeBtn) {
      indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
      indicator.style.width = `${activeBtn.offsetWidth}px`;
    }
  });
}

function transitionJerseyView(targetSide) {
  const viewMap = {
    back: { activeEl: DOM.jerseyViewBackEl, maxWidth: '440px' },
    front: { activeEl: DOM.jerseyViewFrontEl, maxWidth: '440px' },
    both: { activeEl: DOM.jerseyViewBothEl, maxWidth: '600px' }
  };
  const config = viewMap[targetSide];
  if (!config) return;

  [DOM.jerseyViewBackEl, DOM.jerseyViewFrontEl, DOM.jerseyViewBothEl].forEach(element => {
    if (element) element.classList.add('hidden');
  });

  if (DOM.jerseyCardWrapper) DOM.jerseyCardWrapper.style.maxWidth = config.maxWidth;
  if (config.activeEl) {
    config.activeEl.classList.remove('hidden');
    requestAnimationFrame(() => {
      config.activeEl.style.opacity = '1';
      config.activeEl.style.transform = 'scale(1)';
    });
  }
}

function updateJerseyViewButtons(selectedSide) {
  const allButtons = [
    DOM.headerBtnViewBack,
    DOM.headerBtnViewFront,
    DOM.headerBtnViewBoth,
    DOM.stageBtnViewBack,
    DOM.stageBtnViewFront,
    DOM.stageBtnViewBoth
  ];
  allButtons.forEach(buttonElement => {
    if (buttonElement) {
      buttonElement.classList.remove('active');
      buttonElement.setAttribute('aria-pressed', 'false');
    }
  });

  const activeButtons = {
    back: [DOM.headerBtnViewBack, DOM.stageBtnViewBack],
    front: [DOM.headerBtnViewFront, DOM.stageBtnViewFront],
    both: [DOM.headerBtnViewBoth, DOM.stageBtnViewBoth]
  };

  (activeButtons[selectedSide] || []).forEach(buttonElement => {
    if (buttonElement) {
      buttonElement.classList.add('active');
      buttonElement.setAttribute('aria-pressed', 'true');
    }
  });
}

function transferSwitcherFocus(targetHeaderActive) {
  const activeFocusElement = document.activeElement;
  if (!activeFocusElement) return;

  const switcherPairs = [
    { headerBtn: DOM.headerBtnViewBack, stageBtn: DOM.stageBtnViewBack },
    { headerBtn: DOM.headerBtnViewFront, stageBtn: DOM.stageBtnViewFront },
    { headerBtn: DOM.headerBtnViewBoth, stageBtn: DOM.stageBtnViewBoth }
  ];

  switcherPairs.forEach(({ headerBtn, stageBtn }) => {
    if (targetHeaderActive && activeFocusElement === stageBtn && headerBtn) {
      setTimeout(() => headerBtn.focus(), 100);
    } else if (!targetHeaderActive && activeFocusElement === headerBtn && stageBtn) {
      setTimeout(() => stageBtn.focus(), 100);
    }
  });
}

function syncSwitcherAccessibility(isCollapsedState) {
  const isDesktopViewport = window.innerWidth >= 1024;
  const isHeaderActive = !isDesktopViewport && isCollapsedState;
  const isStageActive = isDesktopViewport || !isCollapsedState;

  if (DOM.headerSegmentedControl) {
    DOM.headerSegmentedControl.setAttribute('aria-hidden', String(!isHeaderActive));
    const headerButtons = [DOM.headerBtnViewBack, DOM.headerBtnViewFront, DOM.headerBtnViewBoth];
    headerButtons.forEach(buttonElement => {
      if (buttonElement) buttonElement.tabIndex = isHeaderActive ? 0 : -1;
    });
  }

  if (DOM.stageSegmentedWrapper) {
    DOM.stageSegmentedWrapper.setAttribute('aria-hidden', String(!isStageActive));
    const stageButtons = [DOM.stageBtnViewBack, DOM.stageBtnViewFront, DOM.stageBtnViewBoth];
    stageButtons.forEach(buttonElement => {
      if (buttonElement) buttonElement.tabIndex = isStageActive ? 0 : -1;
    });
  }

  transferSwitcherFocus(isHeaderActive);
}

function setJerseyView(side) {
  AppState.viewSide = side;
  if (DOM.jerseyCardWrapper) DOM.jerseyCardWrapper.setAttribute('data-view', side);

  updateJerseyViewButtons(side);
  updateSegmentedIndicator(side);

  [DOM.jerseyViewBackEl, DOM.jerseyViewFrontEl, DOM.jerseyViewBothEl].forEach(view => {
    if (view && !view.classList.contains('hidden')) {
      view.style.opacity = '0';
      view.style.transform = 'scale(0.95)';
    }
  });

  setTimeout(() => transitionJerseyView(side), 150);
}

window.addEventListener('resize', () => {
  if (AppState && AppState.viewSide) {
    updateSegmentedIndicator(AppState.viewSide);
  }
});

let isMobileCollapsedState = false;
let scrollEvaluationFrameId = null;

function getActiveScrollOffset(mainElement) {
  const cardElement = DOM.configuratorCard || document.getElementById('configuratorCard');
  const mainOffset = mainElement.scrollTop;
  const cardOffset = cardElement ? cardElement.scrollTop : 0;
  return Math.max(mainOffset, cardOffset);
}

function applyCollapsedState(shouldCollapse) {
  if (isMobileCollapsedState === shouldCollapse) return;

  isMobileCollapsedState = shouldCollapse;
  syncSwitcherAccessibility(shouldCollapse);
  document.body.classList.toggle('mobile-scrolled-collapsed', shouldCollapse);

  if (AppState && AppState.viewSide) {
    updateSegmentedIndicator(AppState.viewSide);
  }
}

function evaluateMobileScroll(mainElement) {
  scrollEvaluationFrameId = null;

  if (window.innerWidth >= 1024) {
    applyCollapsedState(false);
    return;
  }

  const combinedOffset = getActiveScrollOffset(mainElement);
  const ENTER_THRESHOLD = 40;
  const EXIT_THRESHOLD = 15;

  if (!isMobileCollapsedState && combinedOffset > ENTER_THRESHOLD) {
    applyCollapsedState(true);
  } else if (isMobileCollapsedState && combinedOffset <= EXIT_THRESHOLD) {
    applyCollapsedState(false);
  }
}

function scheduleScrollEvaluation(mainElement) {
  if (scrollEvaluationFrameId !== null) return;
  scrollEvaluationFrameId = window.requestAnimationFrame(() => {
    evaluateMobileScroll(mainElement);
  });
}

function bindMobileScrollCollapse() {
  const mainElement = document.querySelector('main');
  if (!mainElement) return;

  const handleScroll = () => scheduleScrollEvaluation(mainElement);

  mainElement.addEventListener('scroll', handleScroll, { passive: true });
  const cardElement = DOM.configuratorCard || document.getElementById('configuratorCard');
  if (cardElement) {
    cardElement.addEventListener('scroll', handleScroll, { passive: true });
  }

  window.addEventListener('resize', handleScroll, { passive: true });

  syncSwitcherAccessibility(false);
  bindGlobalTouchScroll(mainElement);
}

function shouldBypassTouchDrag(touchEvent) {
  if (window.innerWidth >= 1024 || touchEvent.touches.length > 1) return true;
  if (document.body.classList.contains('overflow-hidden')) return true;

  const targetElement = touchEvent.target;
  return Boolean(targetElement.closest('button, a, input, textarea, select, canvas, label'));
}

function bindGlobalTouchScroll(mainElement) {
  const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, canvas, label';
  let touchStartClientY = 0;
  let touchStartScrollTop = 0;
  let isDraggingActive = false;

  document.addEventListener('touchstart', (touchStartEvent) => {
    if (shouldBypassTouchDrag(touchStartEvent)) return;

    touchStartClientY = touchStartEvent.touches[0].clientY;
    touchStartScrollTop = mainElement.scrollTop;
    isDraggingActive = true;
  }, { passive: true });

  document.addEventListener('touchmove', (touchMoveEvent) => {
    if (!isDraggingActive || touchMoveEvent.touches.length > 1) {
      isDraggingActive = false;
      return;
    }

    const targetElement = touchMoveEvent.target;
    if (targetElement.closest(INTERACTIVE_SELECTOR)) return;

    const dragDistance = touchStartClientY - touchMoveEvent.touches[0].clientY;
    mainElement.scrollTop = touchStartScrollTop + dragDistance;
  }, { passive: true });

  const stopActiveDrag = () => {
    isDraggingActive = false;
  };

  document.addEventListener('touchend', stopActiveDrag, { passive: true });
  document.addEventListener('touchcancel', stopActiveDrag, { passive: true });
}

function getActiveModalElements() {
  return [
    DOM.modalSizeGuide,
    DOM.qrPromptPayModal,
    DOM.modalSlipLightbox,
    DOM.modalConfig,
    DOM.modalDatabase
  ].filter(Boolean);
}

function syncModalScrollLock() {
  const isAnyModalOpen = getActiveModalElements().some(el => !el.classList.contains('hidden'));
  document.body.classList.toggle('overflow-hidden', isAnyModalOpen);
}

function closeAllActiveModals() {
  getActiveModalElements().forEach(el => el.classList.add('hidden'));
  document.body.classList.remove('overflow-hidden');
}

function bindModalAccessibilityEvents() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllActiveModals();
    }
  });

  getActiveModalElements().forEach(modalElement => {
    const observer = new MutationObserver(() => syncModalScrollLock());
    observer.observe(modalElement, { attributes: true, attributeFilter: ['class'] });
  });
}

// ==========================================
// 7. SMART EMAIL LOOKUP & DATABASE
// ==========================================
function hideFormContent() {
  if (DOM.formContentSection) DOM.formContentSection.classList.add('hidden');
  if (DOM.submitButtonSection) DOM.submitButtonSection.classList.add('hidden');
  if (DOM.onboardingHintStep1) DOM.onboardingHintStep1.classList.remove('hidden');
}

function showFormContent() {
  if (DOM.formContentSection) DOM.formContentSection.classList.remove('hidden');
  if (DOM.paymentStatusSection) DOM.paymentStatusSection.classList.remove('hidden');
  if (DOM.submitButtonSection) DOM.submitButtonSection.classList.remove('hidden');
  if (DOM.onboardingHintStep1) DOM.onboardingHintStep1.classList.add('hidden');
  updateSubmitButtonAvailability();
}

async function lookupEmailAndShowForm(email) {
  // Clear previous data first
  DOM.emailLoadingSpinner.classList.remove('hidden');
  DOM.emailStatusBadge.classList.add('hidden');

  console.log('Looking up email:', email);
  console.log('GAS URL:', AppState.gasUrl);

  // Check Google Sheets only
  if (AppState.gasUrl) {
    try {
      const searchUrl = `${AppState.gasUrl}?action=search&email=${encodeURIComponent(email)}`;
      console.log('Fetching:', searchUrl);
      
      const resp = await fetch(searchUrl);
      console.log('Response status:', resp.status);
      console.log('Response type:', resp.headers.get('content-type'));
      
      const text = await resp.text();
      console.log('Response text (first 200 chars):', text.substring(0, 200));
      
      let result;
      try {
        result = JSON.parse(text);
        console.log('Parsed JSON:', result);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        console.error('Response is not JSON, probably HTML error page');
        
        // FIX: แสดงฟอร์มแม้ว่า API ล้มเหลว
        DOM.emailLoadingSpinner.classList.add('hidden');
        resetToNewMode();
        showFormContent();
        DOM.emailStatusBadge.classList.remove('hidden');
        DOM.emailStatusBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation text-amber-500 mr-1"></i>ไม่สามารถตรวจสอบประวัติได้';
        showToast('ไม่สามารถเชื่อมต่อระบบได้ กรุณากรอกข้อมูลใหม่', 'warning');
        return;
      }
      
      DOM.emailLoadingSpinner.classList.add('hidden');

      if (result && result.found && result.data) {
        // Found existing record - load it
        const gasRecord = {
          email: result.data.email || email,
          fullName: result.data.fullName || '',
          studentNumber: result.data.studentNumber || '',
          name: result.data.name || '',
          classroom: result.data.classroom || '',
          number: (result.data.number || '10').toString(),
          size: result.data.size || 'L',
          price: 275,
          timestamp: result.data.timestamp || '',
          status: result.data.status || 'Confirmed',
          slipUrl: result.data.slipUrl || null,
          slipImage: result.data.slipUrl || null,
          slipFileName: 'สลิปการโอนเงินเดิม.jpg'
        };
        
        console.log('Found record, loading data...');
        switchToEditMode(gasRecord);
        showFormContent();
        showToast('พบข้อมูลเดิม ดึงข้อมูลมาให้เรียบร้อยแล้ว', 'success');
        return;
      } else {
        console.log('Email not found in Sheets');
        // FIX: แสดงฟอร์มเสมอแม้ไม่พบข้อมูลเดิม
        resetToNewMode();
        showFormContent();
        DOM.emailStatusBadge.classList.remove('hidden');
        DOM.emailStatusBadge.innerHTML = '<i class="fa-solid fa-check text-emerald-500 mr-1"></i>อีเมลใหม่ พร้อมสั่งจอง';
        showToast('ไม่พบประวัติการจองเดิม กรุณากรอกข้อมูลใหม่', 'info');
        return;
      }
    } catch (err) {
      console.error('GAS lookup error:', err);
      DOM.emailLoadingSpinner.classList.add('hidden');
      
      // FIX: แสดงฟอร์มแม้เกิด error และแจ้งเตือนชัดเจน
      resetToNewMode();
      showFormContent();
      DOM.emailStatusBadge.classList.remove('hidden');
      DOM.emailStatusBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation text-red-500 mr-1"></i>เกิดข้อผิดพลาด';
      showToast('ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง', 'error');
      return;
    }
  } else {
    console.warn('No GAS URL configured');
    DOM.emailLoadingSpinner.classList.add('hidden');
    
    // FIX: แสดงฟอร์มแม้ไม่มี GAS URL
    resetToNewMode();
    showFormContent();
    DOM.emailStatusBadge.classList.remove('hidden');
    DOM.emailStatusBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation text-amber-500 mr-1"></i>ระบบยังไม่พร้อม';
    showToast('ระบบยังไม่ได้ตั้งค่า กรุณากรอกข้อมูลใหม่', 'warning');
  }
}
function loadOrdersDatabase() {
  // Removed LocalStorage - using Google Sheets only
  AppState.orders = [];
}

function saveOrdersToLocal() {
  // Removed LocalStorage - using Google Sheets only
}

function updateOrdersCountBadge() {
  // Removed - no longer tracking local count
}

async function lookupEmail(email) {
  // This function is now replaced by lookupEmailAndShowForm
  await lookupEmailAndShowForm(email);
}

function populateEditModeFields(orderRecord) {
  AppState.mode = 'edit';
  AppState.existingRecord = orderRecord;
  AppState.slipChanged = false;
  AppState.slipUrl = orderRecord.slipUrl || null;
  AppState.studentNumber = orderRecord.studentNumber || '';
  AppState.screenName = orderRecord.name || '';
  AppState.classroom = orderRecord.classroom || '';
  AppState.screenNumber = orderRecord.number || '10';
  AppState.size = orderRecord.size || 'L';
  AppState.orderStatus = orderRecord.status || 'รอชำระเงิน';

  if (DOM.inputStudentNumber) DOM.inputStudentNumber.value = orderRecord.studentNumber || '';
  DOM.inputScreenName.value = orderRecord.name || '';
  if (DOM.selectClassroom) DOM.selectClassroom.value = orderRecord.classroom || '';
  DOM.inputScreenNumber.value = orderRecord.number || '10';

  DOM.sizeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-size') === AppState.size);
  });

  const statusBtns = document.querySelectorAll('.status-btn');
  statusBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-status') === AppState.orderStatus);
  });

  renderOrderStatus(AppState.orderStatus);
}

function syncEditModeSlip(orderRecord) {
  if (orderRecord.slipImage || orderRecord.slipUrl) {
    AppState.slipImage = orderRecord.slipImage || orderRecord.slipUrl;
    AppState.slipUrl = orderRecord.slipUrl;
    AppState.slipFileName = orderRecord.slipFileName || 'สลิปการโอนเงินเดิม.jpg';
    AppState.slipUploadedAt = orderRecord.slipUploadedAt || orderRecord.timestamp || 'มีสลิปในระบบ';

    if (AppState.slipUrl && AppState.slipUrl.indexOf('drive.google.com') > 0) {
      const fileIdMatch = AppState.slipUrl.match(/[?&]id=([^&]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        fetchDriveImageViaGAS(fileIdMatch[1]);
        return;
      }
    }
    renderSlipPreview();
    return;
  }

  AppState.slipImage = null;
  AppState.slipFileName = '';
  AppState.slipUploadedAt = null;
  renderSlipPreview();
}

function updateEditModeBanners(orderRecord) {
  DOM.modeStatusBanner.classList.remove('hidden');
  DOM.btnSubmitText.textContent = 'บันทึกการแก้ไขข้อมูล';
  DOM.btnSubmitIcon.className = 'fa-solid fa-floppy-disk mr-1.5';

  if (!orderRecord.status) {
    DOM.paymentStatusDisplay.classList.add('hidden');
    return;
  }

  DOM.paymentStatusDisplay.classList.remove('hidden');
  DOM.paymentStatusText.textContent = orderRecord.status;

  if (orderRecord.status.indexOf('ชำระเงินสำเร็จ') >= 0 || orderRecord.status.indexOf('ตรวจสอบแล้ว') >= 0) {
    DOM.paymentStatusText.className = 'text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900';
  } else if (orderRecord.status.indexOf('รอตรวจสอบ') >= 0) {
    DOM.paymentStatusText.className = 'text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900';
  } else {
    DOM.paymentStatusText.className = 'text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700';
  }
}

function switchToEditMode(orderRecord) {
  populateEditModeFields(orderRecord);
  syncEditModeSlip(orderRecord);
  updateEditModeBanners(orderRecord);
  updateLivePreview();
}

function resetToNewMode() {
  AppState.mode = 'new';
  AppState.existingRecord = null;
  AppState.slipChanged = false;
  AppState.slipUrl = null;
  AppState.slipImage = null;
  AppState.slipFileName = '';
  AppState.slipUploadedAt = null;
  AppState.orderStatus = 'รอชำระเงิน';
  
  // Clear form fields
  AppState.studentNumber = '';
  AppState.screenName = '';
  AppState.classroom = '';
  AppState.screenNumber = '10';
  AppState.size = 'L';
  
  if (DOM.inputStudentNumber) DOM.inputStudentNumber.value = '';
  DOM.inputScreenName.value = '';
  if (DOM.selectClassroom) DOM.selectClassroom.value = '';
  DOM.inputScreenNumber.value = '10';
  
  // Reset size buttons
  DOM.sizeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-size') === 'L');
  });

  // Hide order status display on reset
  if (DOM.orderStatusSection) DOM.orderStatusSection.classList.add('hidden');
  AppState.orderStatus = 'รอชำระเงิน';
  
  // Clear slip preview
  renderSlipPreview();
  
  // Update button text
  DOM.modeStatusBanner.classList.add('hidden');
  DOM.paymentStatusDisplay.classList.add('hidden');
  DOM.btnSubmitText.textContent = 'ยืนยันการสั่งจองและส่งสลิป';
  DOM.btnSubmitIcon.className = 'fa-solid fa-check mr-1.5';
  if (DOM.onboardingHintStep1) DOM.onboardingHintStep1.classList.remove('hidden');
  if (DOM.configuratorCard) {
    DOM.configuratorCard.scrollTop = 0;
  }

  // Update live preview
  updateLivePreview();
}

function resetForm() {
  AppState.studentNumber = '';
  AppState.screenName = '';
  AppState.classroom = '';
  AppState.screenNumber = '10';
  AppState.size = 'L';
  AppState.email = '';
  AppState.slipImage = null;
  AppState.slipFileName = '';
  AppState.slipUploadedAt = null;

  DOM.inputEmail.value = '';
  if (DOM.inputStudentNumber) DOM.inputStudentNumber.value = '';
  DOM.inputScreenName.value = '';
  if (DOM.selectClassroom) DOM.selectClassroom.value = '';
  DOM.inputScreenNumber.value = '10';
  DOM.emailStatusBadge.classList.add('hidden');

  DOM.sizeBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-size') === 'L'));

  renderSlipPreview();
  resetToNewMode();
  hideFormContent(); // Hide form when reset
  updateLivePreview();
}

// ==========================================
// FORM VALIDATION (NEW)
// ==========================================
function validateForm() {
  let isValid = true;
  let firstErrorField = null;

  // Clear previous error messages
  document.querySelectorAll('.field-error-message').forEach(el => el.remove());
  document.querySelectorAll('.apple-glass-input').forEach(el => {
    el.style.borderColor = '';
  });

  // 1. Validate Email
  const email = DOM.inputEmail.value.trim();
  if (!email) {
    showFieldError(DOM.inputEmail, 'กรุณากรอกอีเมล');
    isValid = false;
    if (!firstErrorField) firstErrorField = DOM.inputEmail;
  } else if (!isValidEmail(email)) {
    showFieldError(DOM.inputEmail, 'รูปแบบอีเมลไม่ถูกต้อง (ตัวอย่าง: name@example.com)');
    isValid = false;
    if (!firstErrorField) firstErrorField = DOM.inputEmail;
  }

  // 2. Validate Classroom
  const classroom = DOM.selectClassroom ? DOM.selectClassroom.value : '';
  if (!classroom) {
    if (DOM.selectClassroom) showFieldError(DOM.selectClassroom, 'กรุณาเลือกระดับชั้น / ห้องเรียน');
    isValid = false;
    if (!firstErrorField && DOM.selectClassroom) firstErrorField = DOM.selectClassroom;
  }

  // 3. Validate Student Number (เลขที่ - บังคับ 1-60 ตามด้วย ก หรือ ข)
  const studentNumber = DOM.inputStudentNumber ? DOM.inputStudentNumber.value.trim() : '';
  const studentNumPattern = /^[0-9]{1,2}[กข]$/;
  if (!studentNumber) {
    if (DOM.inputStudentNumber) showFieldError(DOM.inputStudentNumber, 'กรุณากรอกเลขที่ตามด้วย ก หรือ ข (เช่น 15ก หรือ 22ข)');
    isValid = false;
    if (!firstErrorField && DOM.inputStudentNumber) firstErrorField = DOM.inputStudentNumber;
  } else if (!studentNumPattern.test(studentNumber)) {
    if (DOM.inputStudentNumber) showFieldError(DOM.inputStudentNumber, 'ต้องระบุเลขที่ตามด้วย ก หรือ ข เท่านั้น (เช่น 15ก หรือ 22ข)');
    isValid = false;
    if (!firstErrorField && DOM.inputStudentNumber) firstErrorField = DOM.inputStudentNumber;
  }

  // 4. Validate Screen Name
  const name = DOM.inputScreenName.value.trim();
  if (!name) {
    showFieldError(DOM.inputScreenName, 'กรุณากรอกชื่อที่ต้องการสกรีน (A-Z)');
    isValid = false;
    if (!firstErrorField) firstErrorField = DOM.inputScreenName;
  } else if (name.length > 16) {
    showFieldError(DOM.inputScreenName, 'ชื่อยาวเกิน 16 ตัวอักษร');
    isValid = false;
    if (!firstErrorField) firstErrorField = DOM.inputScreenName;
  }

  // 5. Validate Number
  const number = DOM.inputScreenNumber.value.trim();
  if (!number) {
    showFieldError(DOM.inputScreenNumber, 'กรุณากรอกเบอร์เสื้อ (0-99)');
    isValid = false;
    if (!firstErrorField) firstErrorField = DOM.inputScreenNumber;
  } else {
    const numValue = parseInt(number, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 99) {
      showFieldError(DOM.inputScreenNumber, 'เบอร์ต้องอยู่ระหว่าง 0-99 เท่านั้น');
      isValid = false;
      if (!firstErrorField) firstErrorField = DOM.inputScreenNumber;
    }
  }

  // 6. Check if size is selected
  if (!AppState.size) {
    showToast('กรุณาเลือกไซส์เสื้อ', 'warning');
    isValid = false;
  }

  // 7. Require Slip for New Orders
  if (AppState.mode === 'new' && !AppState.slipImage) {
    if (DOM.slipDropzone) {
      DOM.slipDropzone.style.borderColor = '#dc2626';
      DOM.slipDropzone.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.15)';
    }
    showToast('กรุณาแนบสลิปการโอนเงินเพื่อยืนยันการสั่งจอง', 'warning');
    isValid = false;
    if (!firstErrorField && DOM.slipDropzone) firstErrorField = DOM.slipDropzone;
  }

  // Focus on first error field
  if (!isValid && firstErrorField) {
    firstErrorField.focus();
    showToast('กรุณากรอกข้อมูลและแนบสลิปให้ครบถ้วน', 'error');
  }

  return isValid;
}

function showFieldError(inputElement, message) {
  // Add red border
  inputElement.style.borderColor = '#dc2626';
  inputElement.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';

  // Create error message element
  const errorEl = document.createElement('p');
  errorEl.className = 'field-error-message text-xs text-red-600 mt-1 flex items-center gap-1';
  errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;

  // Insert after input's parent
  const parent = inputElement.parentElement;
  if (parent) {
    parent.appendChild(errorEl);
  }
}

// ==========================================
// 8. FETCH DRIVE IMAGE VIA GAS PROXY
// ==========================================
async function fetchDriveImageViaGAS(fileId) {
  try {
    console.log('[GAS PROXY] Fetching image for fileId:', fileId);
    const url = `${AppState.gasUrl}?action=getImage&fileId=${encodeURIComponent(fileId)}`;
    
    const response = await fetch(url);
    const driveResponse = await response.json();
    
    if (driveResponse.status === 'success' && driveResponse.image) {
      console.log('[GAS PROXY] Image fetched successfully, size:', driveResponse.image.length);
      AppState.slipImage = driveResponse.image; // base64 data URL
      renderSlipPreview();
    } else {
      console.error('[GAS PROXY] Failed:', driveResponse.message);
      showToast('ไม่สามารถโหลดสลิปจาก Google Drive ได้', 'error');
    }
  } catch (err) {
    console.error('[GAS PROXY] Error:', err);
    showToast('เกิดข้อผิดพลาดในการโหลดสลิป', 'error');
  }
}

// ==========================================
// 8. FORM SUBMISSION & GOOGLE SHEETS
// ==========================================
function buildOrderSubmissionRecord(email, studentNumber, name, number, classroom, nowTimestamp) {
  const shouldSendSlip = (AppState.mode === 'new' || AppState.slipChanged) && AppState.slipImage;
  return {
    email: email,
    productTitle: 'เสื้อแข่งขันทีมสีชมพู 2026',
    studentNumber: studentNumber,
    name: name.toUpperCase(),
    number: number,
    classroom: classroom,
    size: AppState.size,
    price: 275,
    timestamp: nowTimestamp,
    status: AppState.orderStatus || 'รอชำระเงิน',
    slipImage: shouldSendSlip ? AppState.slipImage : null,
    slipUrl: (!shouldSendSlip && AppState.slipUrl) ? AppState.slipUrl : null,
    slipFileName: AppState.slipFileName || null,
    slipUploadedAt: AppState.slipUploadedAt || (AppState.slipImage ? nowTimestamp : null)
  };
}

function updateFormSubmissionUI(isSubmitting) {
  AppState.isSubmitting = isSubmitting;
  if (isSubmitting) {
    DOM.btnSubmit.disabled = true;
    DOM.btnSubmitText.textContent = 'กำลังบันทึกข้อมูล...';
    return;
  }
  DOM.btnSubmitText.textContent = AppState.mode === 'edit' ? 'บันทึกการแก้ไขข้อมูล' : 'ยืนยันการสั่งจองและส่งสลิป';
  updateSubmitButtonAvailability();
}

async function sendOrderToGoogleSheets(submissionRecord) {
  if (!AppState.gasUrl) return true;
  try {
    await fetch(AppState.gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionRecord)
    });
    return true;
  } catch (syncError) {
    showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง', 'error');
    return false;
  }
}

async function handleFormSubmit() {
  if (!validateForm()) return;

  const email = DOM.inputEmail.value.trim();
  const studentNumber = DOM.inputStudentNumber ? DOM.inputStudentNumber.value.trim() : '';
  const name = DOM.inputScreenName.value.trim();
  const number = DOM.inputScreenNumber.value.trim();
  const classroom = DOM.selectClassroom ? DOM.selectClassroom.value : '';
  const nowTimestamp = new Date().toLocaleString('th-TH');

  updateFormSubmissionUI(true);

  const submissionRecord = buildOrderSubmissionRecord(email, studentNumber, name, number, classroom, nowTimestamp);
  const syncSuccess = await sendOrderToGoogleSheets(submissionRecord);

  updateFormSubmissionUI(false);
  if (!syncSuccess) return;

  AppState.slipChanged = false;
  triggerConfetti();
  showToast(AppState.mode === 'edit' ? 'บันทึกการแก้ไขเรียบร้อยแล้ว!' : 'สั่งจองเสื้อและแนบสลิปสำเร็จ!', 'success');
}

// ==========================================
// 9. MODALS & EXPORT
// ==========================================
function openDatabaseModal() {
  renderOrdersList();
  DOM.modalDatabase.classList.remove('hidden');
}

function closeDatabaseModal() {
  DOM.modalDatabase.classList.add('hidden');
}

function renderOrdersList() {
  if (AppState.orders.length === 0) {
    DOM.ordersListContainer.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <i class="fa-solid fa-box-open text-3xl mb-2"></i>
        <p class="text-xs">ยังไม่มีรายการสั่งจอง</p>
      </div>`;
    return;
  }

  DOM.ordersListContainer.innerHTML = AppState.orders.map((o, idx) => `
    <div class="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between gap-3">
      <div class="flex items-center space-x-3">
        ${o.slipImage ? `
          <div class="w-10 h-12 rounded-lg bg-slate-100 border border-pink-100 overflow-hidden shrink-0 cursor-pointer" onclick="viewOrderSlipFull(${idx})" title="คลิกเพื่อดูสลิป">
            <img src="${o.slipImage}" alt="Slip" class="w-full h-full object-cover">
          </div>
        ` : `
          <div class="w-10 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 text-xs shrink-0" title="ไม่มีสลิป">
            <i class="fa-solid fa-image"></i>
          </div>
        `}
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-black text-slate-900 text-sm font-sport-bold">${o.name}</span>
            <span class="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-mono font-bold text-xs">#${o.number}</span>
            <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">Size ${o.size}</span>
            ${o.classroom ? `<span class="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-xs">ห้อง ${o.classroom}</span>` : ''}
          </div>
          <p class="text-[11px] text-slate-500 font-mono">${o.email} &bull; ฿${o.price}</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="editOrderFromList(${idx})" class="p-2 rounded-lg text-pink-600 hover:bg-pink-50 text-xs font-bold transition cursor-pointer" title="แก้ไข">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="deleteOrderFromList(${idx})" class="p-2 rounded-lg text-rose-500 hover:bg-rose-50 text-xs font-bold transition cursor-pointer" title="ลบ">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

window.viewOrderSlipFull = function (idx) {
  const order = AppState.orders[idx];
  if (order && order.slipImage) {
    DOM.slipFullImg.src = order.slipImage;
    DOM.modalSlipLightbox.classList.remove('hidden');
  }
};

window.editOrderFromList = function (idx) {
  const order = AppState.orders[idx];
  if (!order) return;
  closeDatabaseModal();
  DOM.inputEmail.value = order.email;
  lookupEmail(order.email);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteOrderFromList = function (idx) {
  if (confirm('คุณต้องการลบรายการสั่งจองนี้ใช่หรือไม่?')) {
    AppState.orders.splice(idx, 1);
    saveOrdersToLocal();
    renderOrdersList();
    showToast('ลบรายการเรียบร้อยแล้ว', 'info');
  }
};

function exportOrdersToCSV() {
  if (AppState.orders.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับส่งออก', 'error');
    return;
  }

  let csv = 'Timestamp,Email,Name,Classroom,Number,Size,Style,Price,Status,HasSlip\n';
  AppState.orders.forEach(o => {
    csv += `"${o.timestamp}","${o.email}","${o.name}","${o.classroom || ''}","${o.number}","${o.size}","${o.style}","${o.price}","${o.status || 'Confirmed'}","${o.slipImage ? 'YES' : 'NO'}"\n`;
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ayutthaya_pink_orders_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('ส่งออกไฟล์ CSV สำเร็จ', 'success');
}

// Google Sheets Config Modal Handlers
function openConfigModal() {
  if (DOM.inputGasUrl) DOM.inputGasUrl.value = AppState.gasUrl;
  if (DOM.modalConfig) DOM.modalConfig.classList.remove('hidden');
}

function closeConfigModal() {
  if (DOM.modalConfig) DOM.modalConfig.classList.add('hidden');
}

function saveGasConfig() {
  const url = DOM.inputGasUrl ? DOM.inputGasUrl.value.trim() : '';
  AppState.gasUrl = url;
  localStorage.setItem('PINK_JERSEY_GAS_URL', url);
  checkGasConnection();
  closeConfigModal();
  showToast('บันทึกการตั้งค่า Google Sheets แล้ว', 'success');
}

function testGasConnection() {
  const url = DOM.inputGasUrl ? DOM.inputGasUrl.value.trim() : '';
  if (!url) {
    showToast('กรุณากรอก Web App URL ก่อนทดสอบ', 'error');
    return;
  }
  showToast('กำลังทดสอบการเชื่อมต่อ...', 'info');
  fetch(`${url}?action=ping`, { mode: 'no-cors' })
    .then(() => {
      showToast('เชื่อมต่อกับ Google Apps Script สำเร็จ!', 'success');
    })
    .catch(() => {
      showToast('การส่งข้อมูลพร้อมใช้งาน (โหมด no-cors)', 'info');
    });
}

function checkGasConnection() {
  const isConnected = Boolean(AppState.gasUrl);
  if (DOM.gasStatusDot) {
    DOM.gasStatusDot.className = isConnected
      ? 'w-2 h-2 rounded-full bg-emerald-500 shadow-xs'
      : 'w-2 h-2 rounded-full bg-slate-300';
  }
  if (DOM.gasStatusText) {
    DOM.gasStatusText.textContent = isConnected ? 'Sheets (เชื่อมแล้ว)' : 'Google Sheets';
  }
}

// ==========================================
// 10. UTILITIES
// ==========================================
function downloadJerseyMockup() {
  showToast('กำลังประมวลผลรูปภาพเสื้อ HD...', 'info');
  html2canvas(DOM.jerseyCardWrapper, {
    backgroundColor: null,
    scale: 2,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `Ayutthaya_Pink_Jersey_${AppState.screenName || 'Custom'}_${AppState.screenNumber || '10'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('ดาวน์โหลดรูปภาพเสื้อเรียบร้อยแล้ว!', 'success');
  }).catch(err => {
    showToast('เกิดข้อผิดพลาดในการดาวน์โหลด', 'error');
  });
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#a78bfa', '#8b5cf6', '#c4b5fd', '#fbcfe8']
    });
  }
}

function createCancelledModalElement() {
  const modal = document.createElement('div');
  modal.id = 'cancelledOrderModal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
      <div class="flex justify-center">
        <div class="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
          <i class="fa-solid fa-circle-exclamation text-3xl text-rose-600"></i>
        </div>
      </div>
      <h3 class="text-xl font-bold text-center text-slate-900">
        คำสั่งซื้อถูกยกเลิก
      </h3>
      <div class="space-y-2 text-sm text-slate-700">
        <p class="text-center font-semibold text-rose-700">
          <i class="fa-solid fa-hand-holding-heart mr-1"></i>
          ไม่ต้องตกใจนะครับ!
        </p>
        <p class="text-center">
          คำสั่งซื้อของคุณถูกยกเลิกเนื่องจากข้อมูลไม่ครบถ้วนหรือมีปัญหา
        </p>
        <div class="p-3 rounded-xl bg-pink-50 border border-pink-200 text-xs space-y-1">
          <p class="font-semibold text-pink-900">
            <i class="fa-solid fa-lightbulb mr-1"></i>
            วิธีแก้ไข:
          </p>
          <ul class="list-disc list-inside text-pink-800 space-y-0.5 ml-1">
            <li>อัปโหลดสลิปการชำระเงินใหม่อีกครั้ง</li>
            <li>ตรวจสอบข้อมูลให้ถูกต้องครบถ้วน</li>
            <li>หรือติดต่อทีมงานที่ <strong>OpenChat</strong></li>
          </ul>
        </div>
      </div>
      <div class="flex gap-2">
        <button type="button" id="btnContactSupport" 
          class="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-lg transition">
          <i class="fa-solid fa-comments mr-1.5"></i>
          ติดต่อทีมงาน
        </button>
        <button type="button" id="btnCloseModal" 
          class="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition">
          <i class="fa-solid fa-check mr-1.5"></i>
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  `;
  return modal;
}

function bindCancelledModalEvents(modal) {
  const closeModal = () => {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 200);
  };

  const btnClose = modal.querySelector('#btnCloseModal');
  const btnSupport = modal.querySelector('#btnContactSupport');

  if (btnClose) btnClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  if (btnSupport) {
    btnSupport.addEventListener('click', () => {
      const rawUrl = (typeof CONFIG !== 'undefined' && CONFIG.openChatUrl) ? CONFIG.openChatUrl : '';
      const isConfigured = rawUrl && rawUrl.indexOf('your-openchat-url') === -1;
      if (isConfigured) {
        window.open(rawUrl, '_blank');
      } else {
        showToast('กรุณาติดต่อคณะกรรมการสีชมพู หรือครูที่ปรึกษาประจำสี', 'info');
      }
      closeModal();
    });
  }
}

function showCancelledOrderAlert() {
  const modal = createCancelledModalElement();
  document.body.appendChild(modal);
  bindCancelledModalEvents(modal);

  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-pink-700 text-white'
  };

  toast.className = `px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 pointer-events-auto transition transform translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i><span>${msg}</span>`;

  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// PROGRESSIVE HIGH-RES IMAGE PRELOADER
// ==========================================
function preloadHighResImages() {
  const highResList = [
    { url: 'assets/images/jersey_clean_front.png?v=20261014_1522', selectors: ['.jersey-hd-front', '.jersey-hd-front-inner'] },
    { url: 'assets/images/jersey_clean_back.png?v=20261014_1522', selectors: ['.jersey-hd-back', '.jersey-hd-back-inner'] },
    { url: 'assets/images/jersey_clean_both_clene.png?v=20261014_1522', selectors: ['.jersey-hd-both'] }
  ];

  const schedulePreload = () => {
    highResList.forEach(entry => {
      const img = new Image();
      img.src = entry.url;
      img.onload = () => {
        entry.selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => {
            el.classList.add('jersey-highres-loaded');
          });
        });
      };
    });

    const guideImg = document.getElementById('imgSizeGuideDiagram');
    if (guideImg && guideImg.dataset.highres) {
      const gImg = new Image();
      gImg.src = guideImg.dataset.highres;
      gImg.onload = () => {
        guideImg.src = guideImg.dataset.highres;
      };
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(schedulePreload, { timeout: 1500 });
  } else {
    setTimeout(schedulePreload, 600);
  }
}


