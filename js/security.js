/**
 * =========================================================================
 * UNIVERSAL WEB SECURITY SHIELD & DEVTOOLS PROTECTION
 * บล็อกคลิกขวา, บล็อกปุ่ม F12 / Ctrl+Shift+I / Cmd+Option+I,
 * และตรวจจับพร้อมแช่แข็งการเปิด DevTools (สแตนด์อโลน ใช้งานกับเว็บอื่นได้ทันที)
 * =========================================================================
 */
(function initSecurityShield() {
  // DevTools Password Protection
  const DEVTOOLS_PASSWORD = '28052552';
  let isDevToolsUnlocked = false;

  // Function to show password prompt
  function showDevToolsPasswordPrompt() {
    const password = prompt('🔐 กรุณาป้อนรหัสเพื่อเปิด Developer Tools:\n(Please enter password to open Developer Tools)');
    if (password === DEVTOOLS_PASSWORD) {
      isDevToolsUnlocked = true;
      console.log('%c ✅ Developer Tools Unlocked!', 'color: #22c55e; font-size: 16px; font-weight: bold;');
      return true;
    } else if (password !== null) {
      alert('❌ รหัสผ่านไม่ถูกต้อง (Incorrect password)');
      return false;
    }
    return false;
  }

  // Read Security Config Switches
  const sec = (typeof CONFIG !== 'undefined' && CONFIG.security) ? CONFIG.security : {};
  const disableRightClick = sec.disableRightClick !== false;
  const disableDevToolsShortcuts = sec.disableDevToolsShortcuts !== false;
  const enableDevToolsFreeze = sec.enableDevToolsFreeze !== false;

  // 1. Disable Right Click Context Menu
  if (disableRightClick) {
    window.addEventListener('contextmenu', (e) => e.preventDefault(), true);
  }

  // 2. Strict Keydown Blocker (Capture phase for F12, Ctrl/Cmd shortcuts)
  if (disableDevToolsShortcuts) {
    const blockShortcuts = (e) => {
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      
      const isF12 = key === 'f12' || code === 'F12';
      const isCtrlShiftDevTools = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || code === 'KeyI' || code === 'KeyJ' || code === 'KeyC');
      const isMacDevTools = e.metaKey && (e.altKey || e.ctrlKey) && (key === 'i' || key === 'j' || key === 'c' || key === 'u' || code === 'KeyI' || code === 'KeyJ' || code === 'KeyC' || code === 'KeyU');
      const isViewSourceOrSave = (e.ctrlKey || e.metaKey) && (key === 'u' || key === 's' || code === 'KeyU' || code === 'KeyS');

      if (isF12 || isCtrlShiftDevTools || isMacDevTools || isViewSourceOrSave) {
        if (!isDevToolsUnlocked) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          showDevToolsPasswordPrompt();
          return false;
        }
      }
    };

    window.addEventListener('keydown', blockShortcuts, true);
    window.addEventListener('keyup', blockShortcuts, true);
    window.addEventListener('keypress', blockShortcuts, true);
  }

  // 3. Multi-Layer DevTools Detection (Dimension Delta + Console Setter Probe + Debugger Trap)
  if (enableDevToolsFreeze) {
    function isDevToolsOpened() {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      return widthThreshold || heightThreshold;
    }

    const freezeDevTools = () => {
      if (isDevToolsOpened() && !isDevToolsUnlocked) {
        showDevToolsPasswordPrompt();
        if (!isDevToolsUnlocked) {
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#ffffff;font-family:sans-serif;font-size:18px;font-weight:bold;">🔐 Access Restricted: Developer Tools Disabled<br><small style="font-size:12px;margin-top:10px;">Please enter the correct password</small></div>';
          setInterval(() => {
            (function () {
              return false;
            })['constructor']('debugger')();
          }, 50);
        }
      }
    };

    window.addEventListener('resize', freezeDevTools);

    let devtoolsDetected = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        devtoolsDetected = true;
      }
    });

    setInterval(() => {
      devtoolsDetected = false;
      console.log('%c', element);
      console.clear();
      
      if ((devtoolsDetected || isDevToolsOpened()) && !isDevToolsUnlocked) {
        freezeDevTools();
      }
    }, 300);
  }
})();
