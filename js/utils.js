/* ========================================
   utils.js — Shared utility functions
   ======================================== */
(function () {
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ---- Toast ----
  let toastTimer;
  function showToast(msg, isError) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.borderColor = isError ? 'var(--red)' : 'var(--green)';
    toast.style.color = isError ? 'var(--red)' : 'var(--green)';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ---- Field validation display ----
  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.add('field-invalid');
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) { errorEl.textContent = message; errorEl.style.display = 'block'; }
  }

  function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    document.querySelectorAll('.field-invalid').forEach(el => el.classList.remove('field-invalid'));
  }

  window.AppUtils = { escapeHtml, debounce, showToast, showFieldError, clearFieldErrors };
})();
