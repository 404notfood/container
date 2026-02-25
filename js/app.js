/* ========================================
   app.js — UI logic, events, preview, download
   ======================================== */

// ---- App version ----
const APP_VERSION = 'v2.5.0';

document.addEventListener('DOMContentLoaded', () => {

  // ---- Preview state ----
  let currentFiles = {};
  let currentTab   = '';
  let hlCache      = {};          // Cache highlighted HTML per file tab

  // ---- Security Helpers ----
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

  // ---- Debounce ----
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
    toast.style.color        = isError ? 'var(--red)' : 'var(--green)';
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
      el.textContent = ''; el.style.display = 'none';
    });
    document.querySelectorAll('.field-invalid').forEach(el => el.classList.remove('field-invalid'));
  }

  // ---- Helpers ----
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

  // ---- Accessibility setup ----
  // Decorative SVGs hidden from screen readers
  document.querySelectorAll('svg').forEach(svg => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  });

  // ARIA roles for radio groups
  const radioGroupLabels = {
    runtime:   'Runtime de conteneur',
    webserver: 'Serveur web',
    ssl:       'Configuration SSL / HTTPS',
  };
  document.querySelectorAll('.radio-group').forEach(group => {
    group.setAttribute('role', 'radiogroup');
    const firstInput = group.querySelector('input[type="radio"]');
    if (firstInput && radioGroupLabels[firstInput.name]) {
      group.setAttribute('aria-label', radioGroupLabels[firstInput.name]);
    }
  });

  // ARIA for preset / environment grids
  const presetGrid = document.querySelector('#section-preset .preset-grid');
  if (presetGrid) { presetGrid.setAttribute('role', 'radiogroup'); presetGrid.setAttribute('aria-label', "Preset d'application"); }
  const envGrid = document.querySelector('#section-environment .preset-grid');
  if (envGrid) { envGrid.setAttribute('role', 'radiogroup'); envGrid.setAttribute('aria-label', "Environnement de développement"); }

  // ---- Radio card selection (webserver, ssl) ----
  document.querySelectorAll('.radio-group').forEach(group => {
    group.querySelectorAll('.radio-card').forEach(card => {
      card.addEventListener('click', () => {
        group.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const input = card.querySelector('input');
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        updateNginxSocketVisibility();
        updatePreview();
      });
    });
  });

  // ---- Environment card selection ----
  document.querySelectorAll('[data-env]').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('[data-env]').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const input = card.querySelector('input');
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      updateEnvironmentOptions();
      updatePreview();
    });
  });

  // ---- Preset card selection ----
  document.querySelectorAll('.preset-grid .preset-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      card.querySelector('input').checked = true;
      applyPreset(card.querySelector('input').value);
      updatePreview();
    });
  });

  // ---- Toggle switches ----
  document.querySelectorAll('.toggle-input').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const optionsId = toggle.id.replace('enable', '').toLowerCase() + 'Options';
      const opts = document.getElementById(optionsId);
      if (opts) opts.classList.toggle('open', toggle.checked);
      updatePreview();
    });
  });

  // ---- NVM toggle ----
  const nodeVersionSelect = document.getElementById('nodeVersion');
  const nvmDiv = document.getElementById('nvmDefaultVersion');
  nodeVersionSelect.addEventListener('change', () => {
    nvmDiv.style.display = nodeVersionSelect.value === 'nvm' ? 'block' : 'none';
    updatePreview();
  });

  // ---- Nginx socket visibility ----
  function updateNginxSocketVisibility() {
    const ws = document.querySelector('input[name="webserver"]:checked')?.value;
    const nginxOpt = document.getElementById('nginxSocketOption');
    if (nginxOpt) nginxOpt.style.display = ws === 'nginx' ? 'block' : 'none';
  }
  updateNginxSocketVisibility();

  // ---- Environment-based SSL options ----
  function updateEnvironmentOptions() {
    const env = document.querySelector('input[name="environment"]:checked')?.value || 'windows-laragon';
    const sslHint    = document.getElementById('sslHint');
    const sslOptions = document.getElementById('sslOptions');

    const externalSslEnvs = ['windows-laragon','windows-herd','windows-xampp','windows-wamp','mac-mamp','linux-lamp'];
    const sslMessages = {
      'windows-laragon': 'SSL géré par Laragon',
      'windows-herd':    'SSL géré par Herd',
      'windows-xampp':   'SSL via config Apache/Nginx XAMPP',
      'windows-wamp':    'SSL via config Apache WAMP',
      'mac-mamp':        'SSL via config Apache/Nginx MAMP',
      'linux-lamp':      'SSL via config système (Apache/Nginx)',
      'linux-local':     'SSL géré par les containers',
      'mac-local':       'SSL géré par les containers',
    };

    if (sslHint) sslHint.textContent = sslMessages[env] || 'Dépend de l\'environnement';

    if (externalSslEnvs.includes(env)) {
      if (sslOptions) {
        sslOptions.querySelectorAll('.radio-card').forEach(card => {
          const val = card.querySelector('input').value;
          card.style.opacity       = val !== 'none' ? '0.5' : '1';
          card.style.pointerEvents = val !== 'none' ? 'none' : '';
        });
      }
      setRadio('ssl', 'none');
    } else {
      if (sslOptions) {
        sslOptions.querySelectorAll('.radio-card').forEach(card => {
          card.style.opacity = '1'; card.style.pointerEvents = '';
        });
      }
    }

    updatePreview();
  }

  document.querySelectorAll('input[name="environment"]').forEach(r => r.addEventListener('change', updateEnvironmentOptions));
  updateEnvironmentOptions();

  // ---- Runtime info update ----
  function updateRuntimeInfo() {
    const runtime    = document.querySelector('input[name="runtime"]:checked')?.value || 'docker';
    const runtimeInfo = document.getElementById('runtimeInfo');
    if (runtimeInfo) {
      const infos = {
        docker: { title: 'Docker', text: 'Docker est le runtime le plus populaire et le mieux supporté. Recommandé pour la plupart des utilisateurs.', color: '#0066cc' },
        podman: { title: 'Podman', text: 'Podman est un runtime rootless (sans privilèges) compatible Docker. Idéal pour Linux et la sécurité.',  color: '#892ca0' },
      };
      const info = infos[runtime];
      runtimeInfo.innerHTML = `<strong>${info.title}</strong> : ${info.text}`;
      runtimeInfo.style.borderLeftColor = info.color;
    }
    updatePreview();
  }

  document.querySelectorAll('input[name="runtime"]').forEach(r => r.addEventListener('change', updateRuntimeInfo));
  updateRuntimeInfo();

  // ---- Generic input/select change (debounced for text inputs) ----
  const debouncedUpdate = debounce(updatePreview, 300);
  document.querySelectorAll('input[type="text"]').forEach(el => {
    el.addEventListener('input',  debouncedUpdate);
    el.addEventListener('change', updatePreview);
  });
  document.querySelectorAll('select').forEach(el => el.addEventListener('change', updatePreview));

  // ---- Preset sub-options visibility (CSS class-based with animation) ----
  function showPresetOptions(preset) {
    document.querySelectorAll('.preset-options').forEach(el => el.classList.remove('open'));
    const panel = document.getElementById(`presetOptions-${preset}`);
    if (panel) panel.classList.add('open');
  }

  // ---- Apply preset: auto-configure stack ----
  function applyPreset(preset) {
    showPresetOptions(preset);
    if (preset === 'none') return;

    switch (preset) {
      case 'wordpress': {
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', true);
        setSelect('phpVersion', '8.4');
        setPhpExtension('pdo_mysql', true);
        setPhpExtension('gd', true);
        setPhpExtension('curl', true);
        setPhpExtension('zip', true);
        setPhpExtension('mbstring', true);
        setPhpExtension('exif', true);
        setPhpExtension('imagick', true);
        setPhpExtension('xml', true);
        setToggle('enableNode', false);
        setToggle('enablePython', false);
        setToggle('enableJava', false);
        const wpDb = document.getElementById('wpDbEngine').value;
        setToggle('enableMysql', wpDb === 'mysql');
        setToggle('enableMariadb', wpDb === 'mariadb');
        setToggle('enablePostgres', false);
        setToggle('enableMongo', false);
        setToggle('enableRedis', false);
        setToggle('enableMailpit', true);
        break;
      }

      case 'laravel': {
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', true);
        setSelect('phpVersion', '8.4');
        setPhpExtension('pdo_mysql', true);
        setPhpExtension('pdo_pgsql', true);
        setPhpExtension('redis', true);
        setPhpExtension('gd', true);
        setPhpExtension('curl', true);
        setPhpExtension('zip', true);
        setPhpExtension('mbstring', true);
        setPhpExtension('xml', true);
        setPhpExtension('bcmath', true);
        setToggle('enablePython', false);
        setToggle('enableJava', false);
        const lDb = document.getElementById('laravelDb').value;
        setToggle('enableMysql', lDb === 'mysql');
        setToggle('enableMariadb', lDb === 'mariadb');
        setToggle('enablePostgres', lDb === 'postgres');
        setToggle('enableMongo', false);
        setToggle('enableRedis', true);
        setToggle('enableMailpit', true);
        const starter = document.getElementById('laravelStarter').value;
        setToggle('enableNode', starter.includes('react') || starter.includes('vue') || starter.includes('inertia'));
        break;
      }

      case 'symfony': {
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', true);
        setSelect('phpVersion', '8.4');
        setPhpExtension('intl', true);
        setPhpExtension('xml', true);
        setPhpExtension('curl', true);
        setPhpExtension('mbstring', true);
        setPhpExtension('zip', true);
        setPhpExtension('opcache', true);
        setToggle('enableNode', false);
        setToggle('enablePython', false);
        setToggle('enableJava', false);
        const sDb = document.getElementById('symfonyDb').value;
        setToggle('enableMysql', sDb === 'mysql');
        setToggle('enableMariadb', sDb === 'mariadb');
        setToggle('enablePostgres', sDb === 'postgres');
        setPhpExtension('pdo_mysql', sDb === 'mysql' || sDb === 'mariadb');
        setPhpExtension('pdo_pgsql', sDb === 'postgres');
        setToggle('enableMongo', false);
        setToggle('enableRedis', true);
        setPhpExtension('redis', true);
        setToggle('enableMailpit', true);
        break;
      }

      case 'nextjs': {
        setRadio('webserver', 'none');
        setToggle('enablePhp', false);
        setToggle('enableNode', true);
        setSelect('nodeVersion', '20');
        setSelect('nodeFramework', 'nextjs');
        setToggle('enablePython', false);
        setToggle('enableJava', false);
        const nDb = document.getElementById('nextjsDb').value;
        setToggle('enableMysql', nDb === 'mysql');
        setToggle('enablePostgres', nDb === 'postgres');
        setToggle('enableMongo', nDb === 'mongo');
        setToggle('enableMariadb', false);
        setToggle('enableRedis', false);
        break;
      }

      case 'nestjs': {
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', false);
        setToggle('enableNode', true);
        setSelect('nodeVersion', '20');
        setSelect('nodeFramework', 'custom');
        setToggle('enablePython', false);
        setToggle('enableJava', false);
        const nsDb = document.getElementById('nestjsDb').value;
        setToggle('enableMysql', nsDb === 'mysql');
        setToggle('enablePostgres', nsDb === 'postgres');
        setToggle('enableMongo', nsDb === 'mongo');
        setToggle('enableMariadb', false);
        setToggle('enableRedis', true);
        setToggle('enableMailpit', true);
        break;
      }

      case 'angular':
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', false);
        setToggle('enableNode', true);
        setSelect('nodeVersion', '20');
        setToggle('enablePython', false);
        setToggle('enableJava', false);
        setToggle('enableMysql', false);
        setToggle('enableMariadb', false);
        setToggle('enablePostgres', false);
        setToggle('enableMongo', false);
        setToggle('enableRedis', false);
        break;

      case 'django': {
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', false);
        setToggle('enableNode', false);
        setToggle('enablePython', true);
        setSelect('pythonVersionBackend', document.getElementById('pythonVersion').value);
        setSelect('pythonFrameworkBackend', 'django');
        setToggle('enableJava', false);
        const djDb = document.getElementById('djangoDb').value;
        setToggle('enableMysql', djDb === 'mysql');
        setToggle('enablePostgres', djDb === 'postgres');
        setToggle('enableMariadb', false);
        setToggle('enableMongo', false);
        setToggle('enableRedis', true);
        setToggle('enableMailpit', true);
        break;
      }

      case 'flask': {
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', false);
        setToggle('enableNode', false);
        setToggle('enablePython', true);
        setSelect('pythonVersionBackend', document.getElementById('flaskPythonVersion').value);
        setSelect('pythonFrameworkBackend', 'flask');
        setToggle('enableJava', false);
        const flDb = document.getElementById('flaskDb').value;
        setToggle('enableMysql', flDb === 'mysql');
        setToggle('enablePostgres', flDb === 'postgres');
        setToggle('enableMongo', flDb === 'mongo');
        setToggle('enableMariadb', false);
        setToggle('enableRedis', flDb !== 'none');
        break;
      }

      case 'springboot': {
        setRadio('webserver', 'nginx');
        setToggle('enablePhp', false);
        setToggle('enableNode', false);
        setToggle('enablePython', false);
        setToggle('enableJava', true);
        setSelect('javaVersionBackend', document.getElementById('springJavaVersion').value);
        const spDb = document.getElementById('springDb').value;
        setToggle('enableMysql', spDb === 'mysql');
        setToggle('enableMariadb', spDb === 'mariadb');
        setToggle('enablePostgres', spDb === 'postgres');
        setToggle('enableMongo', spDb === 'mongo');
        setToggle('enableRedis', true);
        setToggle('enableMailpit', true);
        break;
      }
    }

    updateNginxSocketVisibility();
  }

  // Re-apply preset when sub-options change
  document.querySelectorAll('.preset-options select').forEach(sel => {
    sel.addEventListener('change', () => {
      const preset = document.querySelector('input[name="preset"]:checked').value;
      if (preset !== 'none') applyPreset(preset);
      updatePreview();
    });
  });

  // ---- Preview (with inline validation feedback) ----
  function updatePreview() {
    clearFieldErrors();
    let hasError = false;

    const validators = [
      { id: 'projectName',   fn: v => Generators.validateProjectName(v || 'my-app') },
      { id: 'projectDomain', fn: v => Generators.validateDomain(v) },
      { id: 'gitRepoUrl',    fn: v => Generators.validateGitUrl(v) },
      { id: 'gitBranch',     fn: v => Generators.validateGitBranch(v) },
    ];

    for (const { id, fn } of validators) {
      const field = document.getElementById(id);
      if (!field) continue;
      try { fn(field.value.trim()); }
      catch (e) { showFieldError(id, e.message); hasError = true; }
    }

    if (hasError) return;

    try {
      const config = Generators.getConfig();
      currentFiles = Generators.generateFiles(config);
      hlCache = {};
      renderTabs();
    } catch (e) {
      console.error('[Preview]', e);
      showToast('Erreur : ' + e.message, true);
    }
  }

  function renderTabs() {
    const tabsContainer = document.getElementById('previewTabs');
    const filenames = Object.keys(currentFiles);
    if (!currentFiles[currentTab] && filenames.length > 0) currentTab = filenames[0];

    tabsContainer.innerHTML = filenames.map(name => {
      const active = name === currentTab ? 'active' : '';
      const escapedName = escapeHtml(name);
      return `<button class="preview-tab ${active}" data-file="${escapedName}">${escapedName}</button>`;
    }).join('');

    tabsContainer.querySelectorAll('.preview-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        currentTab = tab.dataset.file;
        tabsContainer.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderCode();
      });
    });

    renderCode();
  }

  function renderCode() {
    const codeEl = document.getElementById('previewCode');
    const content = currentFiles[currentTab] || '';
    const lang    = Generators.getLanguage(currentTab);
    codeEl.className = `hljs language-${lang}`;

    if (hlCache[currentTab]) {
      codeEl.innerHTML = hlCache[currentTab];
    } else {
      codeEl.textContent = content;
      if (typeof hljs !== 'undefined') hljs.highlightElement(codeEl);
      hlCache[currentTab] = codeEl.innerHTML;
    }
  }

  // ---- Copy to clipboard ----
  const btnCopy = document.getElementById('btnCopy');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const content = currentFiles[currentTab] || '';
      if (!content) return;
      const label = btnCopy.querySelector('[data-copy-label]');
      navigator.clipboard.writeText(content).then(() => {
        btnCopy.classList.add('copied');
        if (label) label.textContent = 'Copié !';
        showToast('Copié dans le presse-papier !');
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          if (label) label.textContent = 'Copier';
        }, 2000);
      }).catch(() => showToast('Impossible de copier', true));
    });
  }

  // ---- Download ZIP ----
  function doDownload() {
    try {
      const config = Generators.getConfig();
      const files  = Generators.generateFiles(config);
      const zip    = new JSZip();
      for (const [path, content] of Object.entries(files)) zip.file(path, content);
      zip.generateAsync({ type: 'blob' }).then(blob => saveAs(blob, `${config.projectName}.zip`));
    } catch (e) {
      showToast('Erreur : ' + e.message, true);
    }
  }

  document.getElementById('btnDownload').addEventListener('click', doDownload);
  document.getElementById('btnDownloadHeader')?.addEventListener('click', doDownload);

  // ---- ARIA attributes synchronization ----
  function initAriaAttributes() {
    // Add role="switch" and aria-checked to all toggle inputs
    document.querySelectorAll('.toggle-input').forEach(toggle => {
      toggle.setAttribute('role', 'switch');
      toggle.setAttribute('aria-checked', toggle.checked ? 'true' : 'false');

      // Get label text from adjacent .toggle-label for aria-label if not already set
      if (!toggle.hasAttribute('aria-label')) {
        const label = toggle.closest('.toggle-row')?.querySelector('.toggle-label');
        if (label) toggle.setAttribute('aria-label', label.textContent.trim());
      }

      // Update aria-checked on change
      toggle.addEventListener('change', (e) => {
        e.target.setAttribute('aria-checked', e.target.checked ? 'true' : 'false');
      });
    });

    // Update aria-checked for radio inputs in radio groups
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      const updateAriaChecked = () => {
        const name = radio.getAttribute('name');
        if (!name) return;
        document.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach(r => {
          r.setAttribute('aria-checked', r.checked ? 'true' : 'false');
        });
      };

      // Set initial state
      updateAriaChecked();

      // Update on change
      radio.addEventListener('change', updateAriaChecked);
    });
  }

  // ---- Sidebar Navigation ----
  const sidebarNav = document.getElementById('sidebarNav');
  const sidebarMobileToggle = document.getElementById('sidebarMobileToggle');
  const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');

  // Create mobile overlay
  const sidebarOverlay = document.createElement('div');
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);

  function closeMobileSidebar() {
    if (sidebarNav) sidebarNav.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('visible');
    if (sidebarMobileToggle) sidebarMobileToggle.setAttribute('aria-expanded', 'false');
  }

  if (sidebarMobileToggle) {
    sidebarMobileToggle.addEventListener('click', () => {
      const isOpen = sidebarNav.classList.toggle('mobile-open');
      sidebarOverlay.classList.toggle('visible', isOpen);
      sidebarMobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // Collect section elements
  const sectionElements = Array.from(sidebarNavItems).map(item => {
    const id = item.getAttribute('data-section');
    return document.getElementById(id);
  }).filter(Boolean);

  // Track visited sections
  const visitedSections = new Set();

  function updateActiveSection() {
    const scrollPos = window.scrollY + 120;
    let activeIndex = 0;

    sectionElements.forEach((section, index) => {
      if (section.offsetTop <= scrollPos) {
        activeIndex = index;
      }
    });

    // Mark current and all above as visited
    for (let i = 0; i <= activeIndex; i++) {
      visitedSections.add(i);
    }

    sidebarNavItems.forEach((item, index) => {
      const dot = item.querySelector('.nav-dot');
      item.classList.toggle('active', index === activeIndex);
      if (dot) {
        dot.classList.toggle('active', index === activeIndex);
        dot.classList.toggle('visited', visitedSections.has(index) && index !== activeIndex);
      }
    });

    // Update progress bar
    updateProgressBar();
  }

  function updateProgressBar() {
    const total = sectionElements.length;
    const completed = visitedSections.size;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill) progressFill.style.width = `${(completed / total) * 100}%`;
    if (progressText) progressText.textContent = `${completed} / ${total} sections`;
  }

  window.addEventListener('scroll', debounce(updateActiveSection, 80));
  updateActiveSection();

  // Smooth scroll to section
  sidebarNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-section');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMobileSidebar();
      }
    });
  });

  // ---- Init ----
  // Set version
  const versionEl = document.getElementById('appVersion');
  if (versionEl) versionEl.textContent = APP_VERSION;

  initAriaAttributes();
  showPresetOptions('none');
  updatePreview();
});
