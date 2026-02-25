/* ========================================
   a11y.js — Accessibility setup
   ======================================== */
(function () {

  function initAccessibility() {
    // Decorative SVGs hidden from screen readers
    document.querySelectorAll('svg').forEach(svg => {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    });

    // ARIA roles for radio groups
    var radioGroupLabels = {
      runtime: 'Runtime de conteneur',
      webserver: 'Serveur web',
      ssl: 'Configuration SSL / HTTPS',
    };
    document.querySelectorAll('.radio-group').forEach(group => {
      group.setAttribute('role', 'radiogroup');
      var firstInput = group.querySelector('input[type="radio"]');
      if (firstInput && radioGroupLabels[firstInput.name]) {
        group.setAttribute('aria-label', radioGroupLabels[firstInput.name]);
      }
    });

    // ARIA for preset / environment grids
    var presetGrid = document.querySelector('#section-preset .preset-grid');
    if (presetGrid) { presetGrid.setAttribute('role', 'radiogroup'); presetGrid.setAttribute('aria-label', "Preset d'application"); }
    var envGrid = document.querySelector('#section-environment .preset-grid');
    if (envGrid) { envGrid.setAttribute('role', 'radiogroup'); envGrid.setAttribute('aria-label', 'Environnement de développement'); }
  }

  function initAriaAttributes() {
    // Toggle inputs: role="switch" + aria-checked
    document.querySelectorAll('.toggle-input').forEach(toggle => {
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', toggle.checked ? 'true' : 'false');
      if (!toggle.hasAttribute('aria-label')) {
        var label = toggle.closest('.toggle-row')?.querySelector('.toggle-label');
        if (label) toggle.setAttribute('aria-label', label.textContent.trim());
      }
      toggle.addEventListener('change', e => {
        e.target.setAttribute('aria-checked', e.target.checked ? 'true' : 'false');
      });
    });

    // Radio inputs: aria-checked sync
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      var updateAriaChecked = () => {
        var name = radio.getAttribute('name');
        if (!name) return;
        document.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach(r => {
          r.setAttribute('aria-checked', r.checked ? 'true' : 'false');
        });
      };
      updateAriaChecked();
      radio.addEventListener('change', updateAriaChecked);
    });
  }

  window.AppA11y = { initAccessibility, initAriaAttributes };
})();
