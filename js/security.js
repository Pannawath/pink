/**
 * =========================================================================
 * SILENT SECURITY GUARD (js/security.js)
 * High-precision silent protection:
 * 1. Blocks shortcut triggers (F12, Ctrl+U, Ctrl+Shift+I/J/C, Ctrl+S) without noisy lockout overlays.
 * 2. Completely removes window geometry checks to eliminate false-positives on split screen / resizing.
 * 3. Silences console log/info/debug/warn/error to prevent API sniffing.
 * 4. Disables right-click context menu on production.
 * =========================================================================
 */

(function () {
  'use strict';

  // 1. Completely silence all console output to prevent credential/endpoint snooping
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

  // 2. Validate blocked dev shortcuts
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

  function initSilentGuard() {
    silenceConsole();

    // Disable right-click context menu silently
    window.addEventListener('contextmenu', function (event) {
      event.preventDefault();
      return false;
    }, true);

    // Silently block shortcuts (F12, Ctrl+Shift+I, Ctrl+U, etc.)
    const handleKey = function (event) {
      if (isBlockedShortcut(event)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    window.addEventListener('keydown', handleKey, true);
    window.addEventListener('keyup', handleKey, true);
  }

  initSilentGuard();
})();
