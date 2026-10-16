/**
 * =========================================================================
 * DEVTOOLS PROTECTION WITH PASSWORD
 * เมื่อกด F12 หรือ Ctrl+Shift+I จะขึ้น password prompt
 * ถ้าใส่รหัสถูก = ปปลดล็อก DevTools
 * ถ้าใส่รหัสผิด = บล็อก DevTools และ freeze หน้าเว็บ
 * =========================================================================
 */

const DEVTOOLS_PASSWORD = '12345678';
let isDevToolsUnlocked = false;

function buildPasswordModalContentHtml() {
  const cardStyle = 'background: linear-gradient(135deg, #1e3a5f 0%, #0f1729 100%); border: 2px solid #3b82f6; border-radius: 16px; padding: 48px 40px; width: 90%; max-width: 420px; box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9); text-align: center;';
  const inputStyle = 'width: 100%; padding: 14px 18px; border: 2px solid #334155; border-radius: 10px; background: #0f172a; color: #ffffff; font-size: 16px; margin-bottom: 18px; box-sizing: border-box; transition: all 0.3s ease; outline: none;';
  const buttonStyle = 'width: 100%; padding: 14px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 10px; font-size: 17px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);';

  return `
    <div style="${cardStyle}">
      <div style="font-size: 48px; margin-bottom: 20px; color: #60a5fa;"><i class="fa-solid fa-lock"></i></div>
      <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 26px; font-weight: 700;">Developer Tools Password</h2>
      <p style="color: #94a3b8; margin: 0 0 28px 0; font-size: 14px; line-height: 1.5;">กรุณาป้อนรหัสเพื่อเปิด Developer Tools</p>
      <input type="password" id="password-input" placeholder="Enter Password" autocomplete="off" style="${inputStyle}" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#334155'" />
      <button id="password-submit" style="${buttonStyle}" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">Submit</button>
      <div id="error-message" style="color: #ef4444; font-size: 14px; margin-top: 14px; min-height: 22px; font-weight: 600;"></div>
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
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  modal.innerHTML = buildPasswordModalContentHtml();
  return modal;
}

function handlePasswordVerification(modal, inputElement, errorElement) {
  const enteredPassword = inputElement.value;
  if (enteredPassword === DEVTOOLS_PASSWORD) {
    isDevToolsUnlocked = true;
    modal.remove();
    return;
  }

  errorElement.textContent = 'รหัสผ่านไม่ถูกต้อง';
  inputElement.style.borderColor = '#ef4444';
  inputElement.value = '';
  setTimeout(() => {
    modal.remove();
    enableStrictDevToolsProtection();
  }, 1000);
}

function showDevToolsPasswordPrompt() {
  const existingModal = document.getElementById('security-password-modal');
  if (existingModal) return;

  const modal = createPasswordModal();
  const target = document.body || document.documentElement;
  target.appendChild(modal);

  const inputElement = document.getElementById('password-input');
  const submitButton = document.getElementById('password-submit');
  const errorElement = document.getElementById('error-message');

  inputElement.focus();

  const onSubmit = () => handlePasswordVerification(modal, inputElement, errorElement);

  submitButton.addEventListener('click', onSubmit);
  inputElement.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') onSubmit();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) event.preventDefault();
  });
}

function isDevToolsShortcut(event) {
  const keyName = (event.key || '').toLowerCase();
  const keyCode = event.code || '';
  const isF12 = keyName === 'f12' || keyCode === 'F12';
  const isCtrlShift = (event.ctrlKey || event.metaKey) && event.shiftKey && (keyName === 'i' || keyName === 'j' || keyName === 'c');
  const isMacCmd = event.metaKey && (keyName === 'u' || (event.altKey && (keyName === 'i' || keyName === 'j')));
  return isF12 || isCtrlShift || isMacCmd;
}

function buildAccessDeniedHtml() {
  return `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      text-align: center;
      flex-direction: column;
      padding: 20px;
    ">
      <div style="font-size: 72px; margin-bottom: 24px; color: #f43f5e;"><i class="fa-solid fa-lock"></i></div>
      <h1 style="font-size: 32px; margin: 0 0 16px 0; font-weight: 700;">Access Denied</h1>
      <p style="font-size: 18px; color: #cbd5e1; margin: 0; max-width: 500px; line-height: 1.6;">
        Developer Tools are disabled. Authentication failed.
      </p>
    </div>
  `;
}

function isDevToolsOpened() {
  return window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;
}

function freezeDevTools() {
  if (!isDevToolsOpened()) return;
  document.body.innerHTML = buildAccessDeniedHtml();
  setInterval(() => {
    (function () { return false; })['constructor']('debugger')();
  }, 100);
}

function enableStrictDevToolsProtection() {
  const interceptShortcut = (event) => {
    if (isDevToolsShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  };

  window.addEventListener('keydown', interceptShortcut, true);
  window.addEventListener('keyup', interceptShortcut, true);
  window.addEventListener('resize', freezeDevTools);
  setInterval(freezeDevTools, 200);
  window.addEventListener('contextmenu', (event) => event.preventDefault(), true);
}

function bindShieldGlobalEvents() {
  const onShortcutAttempt = (event) => {
    if (!isDevToolsShortcut(event)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!isDevToolsUnlocked && !document.getElementById('security-password-modal')) {
      showDevToolsPasswordPrompt();
    }
    return false;
  };

  window.addEventListener('keydown', onShortcutAttempt, true);
  window.addEventListener('keyup', onShortcutAttempt, true);
  window.addEventListener('contextmenu', (event) => event.preventDefault(), true);
}

bindShieldGlobalEvents();
