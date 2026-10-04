/**
 * =========================================================================
 * UNIVERSAL WEB SECURITY SHIELD & DEVTOOLS PROTECTION
 * บล็อกคลิกขวา, บล็อกปุ่ม F12 / Ctrl+Shift+I / Cmd+Option+I,
 * และตรวจจับพร้อมแช่แข็งการเปิด DevTools (สแตนด์อโลน ใช้งานกับเว็บอื่นได้ทันที)
 * =========================================================================
 */
(function initSecurityShield() {
  // 1. Disable Right Click Context Menu
  window.addEventListener('contextmenu', (e) => e.preventDefault(), true);

  // 2. Strict Keydown Blocker (Capture phase for F12, Ctrl/Cmd shortcuts)
  const blockShortcuts = (e) => {
    const code = e.code || '';
    const key = (e.key || '').toLowerCase();
    
    const isF12 = key === 'f12' || code === 'F12';
    
    // Windows / Linux shortcuts (Ctrl + Shift + I/J/C)
    const isCtrlShiftDevTools = (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || code === 'KeyI' || code === 'KeyJ' || code === 'KeyC');
    
    // macOS shortcuts (Cmd + Alt/Option + I/J/C/U)
    const isMacDevTools = e.metaKey && (e.altKey || e.ctrlKey) && (key === 'i' || key === 'j' || key === 'c' || key === 'u' || code === 'KeyI' || code === 'KeyJ' || code === 'KeyC' || code === 'KeyU');
    
    // Ctrl/Cmd + U (View Source) and Ctrl/Cmd + S (Save Page)
    const isViewSourceOrSave = (e.ctrlKey || e.metaKey) && (key === 'u' || key === 's' || code === 'KeyU' || code === 'KeyS');

    if (isF12 || isCtrlShiftDevTools || isMacDevTools || isViewSourceOrSave) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  };

  window.addEventListener('keydown', blockShortcuts, true);
  window.addEventListener('keyup', blockShortcuts, true);
  window.addEventListener('keypress', blockShortcuts, true);

  // 3. Multi-Layer DevTools Detection (Dimension Delta + Console Setter Probe + Debugger Trap)
  function isDevToolsOpened() {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    return widthThreshold || heightThreshold;
  }

  // Active Console Cleanser & Debugger Freeze Loop
  const freezeDevTools = () => {
    if (isDevToolsOpened()) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#ffffff;font-family:sans-serif;font-size:18px;font-weight:bold;">Access Restricted: Developer Tools Disabled</div>';
      setInterval(() => {
        (function () {
          return false;
        })['constructor']('debugger')();
      }, 50);
    }
  };

  window.addEventListener('resize', freezeDevTools);

  // Setter trap for docked/undocked DevTools
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
    
    if (devtoolsDetected || isDevToolsOpened()) {
      freezeDevTools();
    }
  }, 300);
})();
