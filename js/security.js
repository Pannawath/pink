/**
 * =========================================================================
 * SECURITY SHIELD WITH STARTUP PASSWORD PROTECTION
 * ขึ้นมาขอรหัสตอนเข้าเว็บ เมื่อป้อนรหัสผิดจะเปิด DevTools Protection
 * =========================================================================
 */
(function initSecurityShield() {
  const DEVTOOLS_PASSWORD = '28052552';
  const PASSWORD_TIMEOUT = 15000; // 15 seconds (increased from 5 for stability)
  let isAuthenticated = false;
  let authenticationAttempted = false;

  // Create Password Modal
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
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(5px);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 2px solid #3b82f6;
        border-radius: 12px;
        padding: 40px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
        <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px;">Security Password</h2>
        <p style="color: #9ca3af; margin: 0 0 24px 0; font-size: 14px;">
          กรุณาป้อนรหัสสำหรับเข้าถึงเว็บไซต์นี้
        </p>
        
        <input 
          type="password" 
          id="password-input" 
          placeholder="Enter Password" 
          style="
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #4b5563;
            border-radius: 8px;
            background: #0f172a;
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 16px;
            box-sizing: border-box;
            transition: all 0.3s ease;
          "
          onkeypress="if(event.key==='Enter') document.getElementById('password-submit').click()"
        />
        
        <div id="timeout-display" style="
          color: #ef4444;
          font-size: 12px;
          margin-bottom: 16px;
          font-weight: bold;
          min-height: 18px;
        "></div>
        
        <button 
          id="password-submit" 
          style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          "
          onmouseover="this.style.background='linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'"
          onmouseout="this.style.background='linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'"
        >
          Submit
        </button>
        
        <div id="error-message" style="
          color: #ef4444;
          font-size: 14px;
          margin-top: 12px;
          min-height: 20px;
        "></div>
      </div>
    `;

    return modal;
  }

  // Show Password Modal
  function showPasswordModal() {
    const existingModal = document.getElementById('security-password-modal');
    if (existingModal) existingModal.remove();

    const modal = createPasswordModal();
    document.body.appendChild(modal);

    const input = document.getElementById('password-input');
    const submitBtn = document.getElementById('password-submit');
    const errorMsg = document.getElementById('error-message');
    const timeoutDisplay = document.getElementById('timeout-display');

    input.focus();

    // Timeout counter
    let remainingTime = PASSWORD_TIMEOUT / 1000; // 5 seconds
    const timeoutInterval = setInterval(() => {
      remainingTime--;
      timeoutDisplay.textContent = `⏱️ เวลาคงเหลือ: ${remainingTime} วินาที`;

      if (remainingTime <= 0) {
        clearInterval(timeoutInterval);
        handlePasswordFailure(modal);
      }
    }, 1000);

    submitBtn.addEventListener('click', () => {
      const password = input.value;

      if (password === DEVTOOLS_PASSWORD) {
        isAuthenticated = true;
        modal.remove();
        clearInterval(timeoutInterval);
        console.log('%c ✅ Authentication Successful!', 'color: #22c55e; font-size: 16px; font-weight: bold;');
      } else {
        errorMsg.textContent = '❌ รหัสผ่านไม่ถูกต้อง';
        input.style.borderColor = '#ef4444';
        input.value = '';
        clearInterval(timeoutInterval);
        setTimeout(() => handlePasswordFailure(modal), 1000);
      }
    });

    // Prevent closing modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) e.preventDefault();
    });
  }

  // Handle Failed Password
  function handlePasswordFailure(modal) {
    authenticationAttempted = true;
    modal.remove();
    enableStrictDevToolsProtection();
  }

  // Strict DevTools Protection (Active after failed password)
  function enableStrictDevToolsProtection() {
    console.clear();
    console.log('%c⚠️ DevTools Protection: ACTIVE', 'color: #ef4444; font-size: 16px; font-weight: bold;');

    // 1. Block All Shortcuts
    const blockShortcuts = (e) => {
      const key = (e.key || '').toLowerCase();
      const code = e.code || '';
      
      const isF12 = key === 'f12' || code === 'F12';
      const isCtrlShift = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || key === 'j' || key === 'c');
      const isMacCmd = e.metaKey && (key === 'u' || (e.altKey && (key === 'i' || key === 'j')));

      if (isF12 || isCtrlShift || isMacCmd) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener('keydown', blockShortcuts, true);
    window.addEventListener('keyup', blockShortcuts, true);

    // 2. Detect and Freeze DevTools
    function isDevToolsOpened() {
      return window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;
    }

    function freezeDevTools() {
      if (isDevToolsOpened()) {
        document.body.innerHTML = `
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
          ">
            <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
            <h1 style="font-size: 28px; margin: 0 0 10px 0;">Access Denied</h1>
            <p style="font-size: 16px; color: #cbd5e1; margin: 0; max-width: 400px;">
              Developer Tools are disabled. Authentication failed.
            </p>
          </div>
        `;

        setInterval(() => {
          (function () { return false; })['constructor']('debugger')();
        }, 100);
      }
    }

    window.addEventListener('resize', freezeDevTools);

    setInterval(freezeDevTools, 200);

    // 3. Disable Right Click
    window.addEventListener('contextmenu', (e) => e.preventDefault(), true);
  }

  // Initialize on page load - use multiple event listeners for reliability
  function initializePasswordModal() {
    // Only show password modal if not already shown
    if (!document.getElementById('security-password-modal')) {
      showPasswordModal();
    }
  }

  // Try multiple ways to initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePasswordModal);
  } else {
    initializePasswordModal();
  }

  // Backup: also initialize on window load
  window.addEventListener('load', initializePasswordModal);
})();
