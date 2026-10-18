/**
 * =========================================================================
 * DEVTOOLS PROTECTION WITH PASSWORD
 * เมื่อกด F12 หรือ Ctrl+Shift+I จะขึ้น password prompt
 * ถ้าใส่รหัสถูก = ปปลดล็อก DevTools
 * ถ้าใส่รหัสผิด = บล็อก DevTools และ freeze หน้าเว็บ
 * =========================================================================
 */

function isMobileOrTabletDevice() {
  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
  const isTouchScreen = navigator.maxTouchPoints > 1;
  const isMobileUa = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isMacintoshWithTouch = ua.includes('macintosh') && isTouchScreen;
  return isMobileUa || isMacintoshWithTouch;
}

const DEVTOOLS_PASSWORD = '1212312121';
let isDevToolsUnlocked = false;
let isFreezing = false;

function buildPasswordModalContentHtml() {
  const cardStyle = 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: 20px; padding: 40px 32px; width: 90%; max-width: 400px; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85); text-align: center;';
  const inputStyle = 'width: 100%; padding: 14px 16px; border: 1.5px solid #334155; border-radius: 12px; background: #0b1120; color: #ffffff; font-size: 15px; margin-bottom: 16px; box-sizing: border-box; outline: none; text-align: center; letter-spacing: 2px;';
  const buttonStyle = 'width: 100%; padding: 13px; background: linear-gradient(135deg, #f43f5e 0%, #db2777 100%); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(244, 63, 94, 0.35);';

  return `
    <div style="${cardStyle}">
      <div style="font-size: 40px; margin-bottom: 16px; color: #f43f5e;"><i class="fa-solid fa-shield-halved"></i></div>
      <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">Developer Access Locked</h2>
      <p style="color: #94a3b8; margin: 0 0 24px 0; font-size: 13px; line-height: 1.5;">ไม่อนุญาตให้เปิด Developer Tools<br>กรุณาใส่รหัสผ่านผู้ดูแลระบบเพื่อดำเนินการต่อ</p>
      <input type="password" id="password-input" placeholder="Enter Access Code" autocomplete="off" style="${inputStyle}" />
      <button id="password-submit" style="${buttonStyle}">Authorize</button>
      <div id="error-message" style="color: #f43f5e; font-size: 13px; margin-top: 14px; min-height: 20px; font-weight: 600;"></div>
    </div>
  `;
}

function createPasswordModal() {
  const modal = document.createElement('div');
  modal.id = 'security-password-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(12px);
    z-index: 99999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  modal.innerHTML = buildPasswordModalContentHtml();
  return modal;
}

function handlePasswordVerification(modal, inputElement, errorElement) {
  const enteredPassword = inputElement.value.trim();
  if (enteredPassword === DEVTOOLS_PASSWORD) {
    isDevToolsUnlocked = true;
    modal.remove();
    return;
  }

  errorElement.textContent = 'รหัสผ่านไม่ถูกต้อง';
  inputElement.style.borderColor = '#f43f5e';
  inputElement.value = '';
  setTimeout(() => {
    modal.remove();
  }, 1000);
}
function attachPasswordModalEvents(modal, inputElement, submitButton, errorElement) {
  if (!inputElement) return;
  inputElement.focus();
  const onSubmit = () => handlePasswordVerification(modal, inputElement, errorElement);
  if (submitButton) {
    submitButton.addEventListener('click', onSubmit);
  }
  inputElement.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') onSubmit();
  });
}

function showDevToolsPasswordPrompt() {
  if (isDevToolsUnlocked || document.getElementById('security-password-modal')) return;

  const modal = createPasswordModal();
  const target = document.body || document.documentElement;
  target.appendChild(modal);

  const inputElement = document.getElementById('password-input');
  const submitButton = document.getElementById('password-submit');
  const errorElement = document.getElementById('error-message');

  attachPasswordModalEvents(modal, inputElement, submitButton, errorElement);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) event.preventDefault();
  });
}

function isF12Key(event) {
  const keyName = (event.key || '').toLowerCase();
  const keyCode = event.code || '';
  return keyName === 'f12' || keyCode === 'F12';
}

function bindShieldGlobalEvents() {
  if (isMobileOrTabletDevice()) {
    return;
  }

  const onShortcutAttempt = (event) => {
    if (isDevToolsUnlocked) return;

    if (isF12Key(event)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showDevToolsPasswordPrompt();
      return false;
    }
  };

  window.addEventListener('keydown', onShortcutAttempt, true);
  window.addEventListener('keyup', onShortcutAttempt, true);
}

window.showDevToolsPasswordPrompt = showDevToolsPasswordPrompt;
bindShieldGlobalEvents();
