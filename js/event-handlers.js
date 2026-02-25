/* ========================================
   event-handlers.js — DOM event listeners
   ======================================== */
(function () {

  function initEventHandlers() {
    // ---- Radio card selection (webserver, ssl, runtime) ----
    document.querySelectorAll('.radio-group').forEach(group => {
      group.querySelectorAll('.radio-card').forEach(card => {
        card.addEventListener('click', () => {
          group.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          var input = card.querySelector('input');
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          AppEnvironment.updateNginxSocketVisibility();
          AppPreview.updatePreview();
        });
      });
    });

    // ---- Environment card selection ----
    document.querySelectorAll('[data-env]').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('[data-env]').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        var input = card.querySelector('input');
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        AppEnvironment.updateEnvironmentOptions();
        AppPreview.updatePreview();
      });
    });

    // ---- Preset card selection ----
    document.querySelectorAll('.preset-grid .preset-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        card.querySelector('input').checked = true;
        AppPresets.applyPreset(card.querySelector('input').value);
        AppPreview.updatePreview();
      });
    });

    // ---- Toggle switches ----
    document.querySelectorAll('.toggle-input').forEach(toggle => {
      toggle.addEventListener('change', () => {
        var optionsId = toggle.id.replace('enable', '').toLowerCase() + 'Options';
        var opts = document.getElementById(optionsId);
        if (opts) opts.classList.toggle('open', toggle.checked);
        AppPreview.updatePreview();
      });
    });

    // ---- NVM toggle ----
    var nodeVersionSelect = document.getElementById('nodeVersion');
    var nvmDiv = document.getElementById('nvmDefaultVersion');
    nodeVersionSelect.addEventListener('change', () => {
      nvmDiv.style.display = nodeVersionSelect.value === 'nvm' ? 'block' : 'none';
      AppPreview.updatePreview();
    });

    // ---- Generic input/select change (debounced for text) ----
    var debouncedUpdate = AppUtils.debounce(AppPreview.updatePreview, 300);
    document.querySelectorAll('input[type="text"]').forEach(el => {
      el.addEventListener('input', debouncedUpdate);
      el.addEventListener('change', AppPreview.updatePreview);
    });
    document.querySelectorAll('select').forEach(el => {
      el.addEventListener('change', AppPreview.updatePreview);
    });

    // ---- Runtime info ----
    document.querySelectorAll('input[name="runtime"]').forEach(r => {
      r.addEventListener('change', AppEnvironment.updateRuntimeInfo);
    });

    // ---- Environment change ----
    document.querySelectorAll('input[name="environment"]').forEach(r => {
      r.addEventListener('change', AppEnvironment.updateEnvironmentOptions);
    });

    // ---- Preset sub-options change ----
    document.querySelectorAll('.preset-options select').forEach(sel => {
      sel.addEventListener('change', () => {
        var preset = document.querySelector('input[name="preset"]:checked').value;
        if (preset !== 'none') AppPresets.applyPreset(preset);
        AppPreview.updatePreview();
      });
    });
  }

  window.AppEvents = { initEventHandlers };
})();
