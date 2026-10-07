/**
 * =========================================================================
 * SECURITY SHIELD WITH STARTUP PASSWORD PROTECTION
 * ขึ้นมาขอรหัสตอนเข้าเว็บ เมื่อป้อนรหัสผิดจะบล็อกเว็บ
 * =========================================================================
 */
(function initSecurityShield() {
  const DEVTOOLS_PASSWORD = '28052552';
  const PASSWORD_TIMEOUT = 15000; // 15 seconds
  let isAuthenticated = false;

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
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(10px);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1e3a5f 0%, #0f1729 100%);
        border: 2px solid #3b82f6;
        border-radius: 16px;
        padding: 48px 40px;
        width: 90%;
        max-width: 420px;
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.9);
        text-align: center;
      ">
        <div style="font-size: 56px; margin-bottom: 20px;">🔐</div>
        <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 26px; font-weight: 700;">Security Password</h2>
        <p style="color: #94a3b8; margin: 0 0 28px 0; font-size: 14px; line-height: 1.5;">
          กรุณาป้อนรหัสสำหรับเข้าถึงเว็บไซต์นี้
        </p>
        
        <input 
          type="password" 
          id="password-input" 
          placeholder="Enter Password" 
          autocomplete="off"
          style="
            width: 100%;
            padding: 14px 18px;
            border: 2px solid #334155;
            border-radius: 10px;
            background: #0f172a;
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 18px;
            box-sizing: border-box;
            transition: all 0.3s ease;
            outline: none;
          "
          onfocus="this.style.borderColor='#3b82f6'"
          onblur="this.style.borderColor='#334155'"
        />
        
        <div id="timeout-display" style="
          color: #ef4444;
          font-size: 13px;
          margin-bottom: 18px;
          font-weight: 600;
          min-height: 20px;
        "></div>
        
        <button 
          id="password-submit" 
          style="
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.5)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.4)'"
        >
          Submit
        </button>
        
        <div id="error-message" style="
          color: #ef4444;
          font-size: 14px;
          margin-top: 14px;
          min-height: 22px;
          font-weight: 600;
        "></div>
      </div>
    `;

    return modal;
  }

  // Show Password Modal
  function showPasswordModal() {
    const existingModal = document.getElementById('security-password-modal');
    if (existingModal) return;

    const modal = createPasswordModal();
    const target = document.body || document.documentElement;
    target.appendChild(modal);

    const input = document.getElementById('password-input');
    const submitBtn = document.getElementById('password-submit');
    const errorMsg = document.getElementById('error-message');
    const timeoutDisplay = document.getElementById('timeout-display');

    input.focus();

    // Handle submission
    const handleSubmit = () => {
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
        setTimeout(() => {
          modal.remove();
          blockWebsite();
        }, 1000);
      }
    };

    // Timeout counter
    let remainingTime = PASSWORD_TIMEOUT / 1000;
    const timeoutInterval = setInterval(() => {
      remainingTime--;
      timeoutDisplay.textContent = `⏱️ เวลาคงเหลือ: ${remainingTime} วินาที`;

      if (remainingTime <= 0) {
        clearInterval(timeoutInterval);
        modal.remove();
        blockWebsite();
      }
    }, 1000);

    submitBtn.addEventListener('click', handleSubmit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });

    // Prevent closing modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) e.preventDefault();
    });
  }

  // Block Website (Authentication Failed)
  function blockWebsite() {
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
        padding: 20px;
      ">
        <div style="font-size: 80px; margin-bottom: 30px; animation: shake 0.5s;">🔒</div>
        <h1 style="font-size: 32px; margin: 0 0 16px 0; font-weight: 700;">Access Denied</h1>
        <p style="font-size: 18px; color: #cbd5e1; margin: 0; max-width: 500px; line-height: 1.6;">
          รหัสผ่านไม่ถูกต้อง หรือหมดเวลา<br>
          กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
      <style>
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      </style>
    `;

    // Block DevTools
    setInterval(() => {
      (function () { return false; })['constructor']('debugger')();
    }, 100);

    // Disable all shortcuts
    window.addEventListener('keydown', (e) => e.preventDefault(), true);
    window.addEventListener('contextmenu', (e) => e.preventDefault(), true);
  }

  // Initialize on page load
  function initializePasswordModal() {
    if (!document.getElementById('security-password-modal')) {
      showPasswordModal();
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePasswordModal);
  } else {
    initializePasswordModal();
  }

  // Backup: also initialize on window load
  window.addEventListener('load', initializePasswordModal);

  // Disable Right Click (always active)
  window.addEventListener('contextmenu', (e) => e.preventDefault(), true);
})();
