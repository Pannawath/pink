/**
 * =========================================================================
 * DEVTOOLS & SOURCE INSPECTION SHIELD (js/security.js)
 * Blocks F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, Context Menu, and DevTools
 * window docking, responsive emulator, and debugger inspection across all modes.
 * =========================================================================
 */

(function () {
  'use strict';

  function isRealMobileDevice() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();
    const isDesktopOS = /win32|win64|windows|macintel|linux x86_64|x11/.test(platform) || /windows nt|macintosh|x11; linux/.test(ua);
    if (isDesktopOS && !(ua.includes('macintosh') && navigator.maxTouchPoints > 2 && window.screen.width <= 1366)) {
      return false;
    }
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  }

  let isShieldTriggered = false;

  function silenceConsole() {
    const noop = function () {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'dir', 'trace'];
    try {
      for (let i = 0; i < methods.length; i++) {
        if (window.console && window.console[methods[i]]) {
          window.console[methods[i]] = noop;
        }
      }
    } catch (e) {}
  }

  function isBlockedShortcut(event) {
    const keyName = (event.key || '').toLowerCase();
    const keyCode = event.code || '';
    const isF12 = keyName === 'f12' || keyCode === 'F12' || event.keyCode === 123;
    const isCtrlShift = (event.ctrlKey || event.metaKey) && event.shiftKey && (
      keyName === 'i' || keyName === 'j' || keyName === 'c' || keyName === 'k' || keyName === 'm' ||
      keyCode === 'KeyI' || keyCode === 'KeyJ' || keyCode === 'KeyC' || keyCode === 'KeyK' || keyCode === 'KeyM'
    );
    const isMacAlt = event.metaKey && event.altKey && (
      keyName === 'i' || keyName === 'j' || keyName === 'c' || keyName === 'u' ||
      keyCode === 'KeyI' || keyCode === 'KeyJ' || keyCode === 'KeyC' || keyCode === 'KeyU'
    );
    const isViewSourceOrSave = (event.ctrlKey || event.metaKey) && (
      keyName === 'u' || keyName === 's' || keyCode === 'KeyU' || keyCode === 'KeyS'
    );
    return isF12 || isCtrlShift || isMacAlt || isViewSourceOrSave;
  }

  function renderLockdownScreen() {
    if (isShieldTriggered) return;
    isShieldTriggered = true;

    try {
      if (window.console && window.console.clear) {
        window.console.clear();
      }
    } catch (e) {}

    const lockHtml = [
      '<div style="position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#09090b;color:#f4f4f5;font-family:\'Kanit\',-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;flex-direction:column;padding:24px;user-select:none;">',
      '  <div style="width:56px;height:56px;border-radius:16px;background:#18181b;border:1px solid #27272a;display:flex;align-items:center;justify-content:center;margin-bottom:20px;color:#f43f5e;font-size:24px;">',
      '    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      '  </div>',
      '  <h1 style="font-size:20px;margin:0 0 8px 0;font-weight:700;letter-spacing:0.02em;">ระบบป้องกันการเข้าถึงข้อมูล (Protected View)</h1>',
      '  <p style="font-size:13px;color:#a1a1aa;margin:0 0 24px 0;max-width:400px;line-height:1.6;">ไม่อนุญาตให้เปิดใช้งาน Developer Tools หรือตรวจสอบซอร์สโค้ดของระบบ กรุณาปิดหน้าต่างตรวจสอบแล้วโหลดหน้าเว็บใหม่</p>',
      '  <button onclick="window.location.reload()" style="padding:10px 24px;background:#27272a;color:#f4f4f5;border:1px solid #3f3f46;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600;">โหลดหน้าเว็บใหม่</button>',
      '</div>'
    ].join('');

    if (document.body) {
      document.body.innerHTML = lockHtml;
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        if (document.body) document.body.innerHTML = lockHtml;
      });
    }

    const trapLoop = function () {
      try {
        (function () { return false; })['constructor']('debugger')();
      } catch (e) {}
      setTimeout(trapLoop, 40);
    };
    trapLoop();
  }

  function detectDevTools() {
    if (isShieldTriggered) return;

    // 1. Debugger timing trap (works even when undocked or in responsive device toolbar)
    const t0 = performance.now();
    try {
      (function () { return false; })['constructor']('debugger')();
    } catch (e) {}
    const t1 = performance.now();
    if (t1 - t0 > 60) {
      renderLockdownScreen();
      return;
    }

    // 2. Desktop docked DevTools / Responsive emulator geometry detection
    if (!isRealMobileDevice()) {
      if (window.outerWidth > 0 && window.outerHeight > 0) {
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        // Also detect when Responsive Mode sets innerHeight/innerWidth larger than outerWindow
        const isEmulatorOversized = window.innerHeight > window.outerHeight + 40 || window.innerWidth > window.outerWidth + 40;
        if (widthDiff > 160 || heightDiff > 160 || isEmulatorOversized) {
          renderLockdownScreen();
          return;
        }
      }
    }
  }

  function initSecurityShield() {
    silenceConsole();

    window.addEventListener('contextmenu', function (event) {
      event.preventDefault();
      return false;
    }, true);

    const handleKey = function (event) {
      if (isBlockedShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        renderLockdownScreen();
        return false;
      }
    };

    window.addEventListener('keydown', handleKey, true);
    window.addEventListener('keyup', handleKey, true);
    window.addEventListener('resize', detectDevTools);

    // Immediate check on script load + continuous interval
    detectDevTools();
    setInterval(detectDevTools, 350);
  }

  initSecurityShield();
})();
