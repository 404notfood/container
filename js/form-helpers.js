/* ========================================
   form-helpers.js — Programmatic form setters
   ======================================== */
(function () {
  function setToggle(id, checked) {
    const el = document.getElementById(id);
    if (el) {
      el.checked = checked;
      const optionsId = id.replace('enable', '').toLowerCase() + 'Options';
      const opts = document.getElementById(optionsId);
      if (opts) opts.classList.toggle('open', checked);
    }
  }

  function setRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
      const group = radio.closest('.radio-group, .preset-grid');
      if (group) {
        group.querySelectorAll('.radio-card, .preset-card').forEach(c => c.classList.remove('active'));
        radio.closest('.radio-card, .preset-card')?.classList.add('active');
      }
    }
  }

  function setSelect(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function setPhpExtension(ext, checked) {
    const cb = document.querySelector(`#phpExtensionsGroup input[value="${ext}"]`);
    if (cb) cb.checked = checked;
  }

  window.FormHelpers = { setToggle, setRadio, setSelect, setPhpExtension };
})();
