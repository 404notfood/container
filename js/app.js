/* ========================================
   app.js — UI logic, events, preview, download
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Preview state (hoisted) ----
  let currentFiles = {};
  let currentTab = '';

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

  // ---- Helpers ----
  function setToggle(id, checked) {
    const el = document.getElementById(id);
    if (el) {
      el.checked = checked;
      // Open/close options panel
      const optionsId = id.replace('enable', '').toLowerCase() + 'Options';
      const opts = document.getElementById(optionsId);
      if (opts) opts.classList.toggle('open', checked);
    }
  }

  function setRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
      // Update active class on parent cards
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

  // ---- Radio card selection (webserver, ssl, deployMode) ----
  document.querySelectorAll('.radio-group').forEach(group => {
    group.querySelectorAll('.radio-card').forEach(card => {
      card.addEventListener('click', () => {
        group.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const input = card.querySelector('input');
        input.checked = true;
        // Trigger change event so deploy mode / other handlers fire
        input.dispatchEvent(new Event('change', { bubbles: true }));
        updateNginxSocketVisibility();
        updatePreview();
      });
    });
  });

  // ---- Environment card selection (using preset-grid) ----
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

  // ---- Deploy mode (Standalone / HestiaCP) ----
  function updateDeployMode() {
    const mode = document.querySelector('input[name="deployMode"]:checked').value;
    const isHestia = mode === 'hestia';
    const hestiaOpts = document.getElementById('hestiaOptions');
    if (hestiaOpts) hestiaOpts.style.display = isHestia ? 'block' : 'none';

    // Hide/show sections not relevant in hestia mode
    const webserverSection = document.getElementById('section-webserver');
    const dbSection = document.getElementById('section-database');
    const toolsSection = document.getElementById('section-tools');
    const sslSection = document.getElementById('section-ssl');

    if (webserverSection) webserverSection.style.display = isHestia ? 'none' : '';
    if (sslSection) sslSection.style.display = isHestia ? 'none' : '';

    // In hestia mode, dim DB section and disable DB toggles
    if (dbSection) {
      dbSection.style.opacity = isHestia ? '0.4' : '1';
      dbSection.style.pointerEvents = isHestia ? 'none' : '';
    }

    // In hestia mode, hide DB tool toggles (Adminer, phpMyAdmin, pgAdmin, Mongo Express)
    if (toolsSection) {
      const dbToolIds = ['enableAdminer', 'enablePhpmyadmin', 'enablePgadmin', 'enableMongoexpress'];
      dbToolIds.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
          const row = toggle.closest('.toggle-row');
          if (row) row.style.display = isHestia ? 'none' : '';
        }
      });
    }

    updatePreview();
  }

  // Attach deploy mode events
  document.querySelectorAll('input[name="deployMode"]').forEach(radio => {
    radio.addEventListener('change', updateDeployMode);
  });
  updateDeployMode();

  // ---- Nginx socket visibility ----
  function updateNginxSocketVisibility() {
    const ws = document.querySelector('input[name="webserver"]:checked').value;
    const nginxOpt = document.getElementById('nginxSocketOption');
    if (nginxOpt) nginxOpt.style.display = ws === 'nginx' ? 'block' : 'none';
  }
  updateNginxSocketVisibility();

  // ---- Environment-based SSL options ----
  function updateEnvironmentOptions() {
    const env = document.querySelector('input[name="environment"]:checked')?.value || 'windows-laragon';
    const sslHint = document.getElementById('sslHint');
    const sslOptions = document.getElementById('sslOptions');

    // Environnements avec gestion SSL externe (pas dans les containers)
    const externalSslEnvs = [
      'windows-laragon',
      'windows-herd',
      'windows-xampp',
      'windows-wamp',
      'mac-mamp',
      'linux-lamp'
    ];

    // Messages selon l'environnement
    const sslMessages = {
      'windows-laragon': 'SSL géré par Laragon',
      'windows-herd': 'SSL géré par Herd',
      'windows-xampp': 'SSL via config Apache/Nginx XAMPP',
      'windows-wamp': 'SSL via config Apache WAMP',
      'mac-mamp': 'SSL via config Apache/Nginx MAMP',
      'linux-lamp': 'SSL via config système (Apache/Nginx)',
      'linux-local': 'SSL géré par les containers',
      'mac-local': 'SSL géré par les containers'
    };

    if (externalSslEnvs.includes(env)) {
      // Pour les environnements avec serveur web intégré, désactiver SSL dans les containers
      if (sslHint) {
        sslHint.textContent = sslMessages[env] || 'SSL géré en externe';
        sslHint.style.display = 'inline';
      }

      // Désactiver les options SSL sauf "Aucun"
      if (sslOptions) {
        sslOptions.querySelectorAll('.radio-card').forEach(card => {
          const value = card.querySelector('input').value;
          if (value !== 'none') {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
          } else {
            card.style.opacity = '1';
            card.style.pointerEvents = '';
          }
        });
      }

      // Forcer "Aucun" pour SSL
      setRadio('ssl', 'none');

    } else {
      // Pour Linux/macOS standalone, activer toutes les options SSL
      if (sslHint) {
        sslHint.textContent = sslMessages[env] || 'SSL géré par les containers';
        sslHint.style.display = 'inline';
      }

      if (sslOptions) {
        sslOptions.querySelectorAll('.radio-card').forEach(card => {
          card.style.opacity = '1';
          card.style.pointerEvents = '';
        });
      }
    }

    updatePreview();
  }

  // Attacher les événements pour l'environnement
  document.querySelectorAll('input[name="environment"]').forEach(radio => {
    radio.addEventListener('change', updateEnvironmentOptions);
  });
  updateEnvironmentOptions();

  // ---- Runtime info update ----
  function updateRuntimeInfo() {
    const runtime = document.querySelector('input[name="runtime"]:checked')?.value || 'docker';
    const runtimeInfo = document.getElementById('runtimeInfo');

    if (runtimeInfo) {
      const infos = {
        'docker': {
          title: 'Docker',
          text: 'Docker est le runtime le plus populaire et le mieux supporté. Recommandé pour la plupart des utilisateurs.',
          color: '#0066cc'
        },
        'podman': {
          title: 'Podman',
          text: 'Podman est un runtime rootless (sans privilèges) compatible Docker. Idéal pour Linux et la sécurité.',
          color: '#892ca0'
        }
      };

      const info = infos[runtime];
      runtimeInfo.innerHTML = `<strong>${info.title}</strong> : ${info.text}`;
      runtimeInfo.style.borderLeftColor = info.color;
    }

    updatePreview();
  }

  // Attacher les événements pour le runtime
  document.querySelectorAll('input[name="runtime"]').forEach(radio => {
    radio.addEventListener('change', updateRuntimeInfo);
  });
  updateRuntimeInfo();

  // ---- Generic input/select change ----
  document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('change', updatePreview);
    el.addEventListener('input', updatePreview);
  });

  // ---- Preset sub-options visibility ----
  function showPresetOptions(preset) {
    document.querySelectorAll('.preset-options').forEach(el => el.style.display = 'none');
    const panel = document.getElementById(`presetOptions-${preset}`);
    if (panel) panel.style.display = 'block';
  }

  // ---- Apply preset: auto-configure stack ----
  function applyPreset(preset) {
    showPresetOptions(preset);

    // Reset all toggles first if switching presets (except 'none')
    if (preset === 'none') return;

    switch (preset) {
      case 'wordpress':
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
        // DB based on sub-option
        const wpDb = document.getElementById('wpDbEngine').value;
        setToggle('enableMysql', wpDb === 'mysql');
        setToggle('enableMariadb', wpDb === 'mariadb');
        setToggle('enablePostgres', false);
        setToggle('enableMongo', false);
        setToggle('enableRedis', false);
        setToggle('enableMailpit', true);
        break;

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
        // Starter kits with frontend need Node
        const starter = document.getElementById('laravelStarter').value;
        const needsNode = starter.includes('react') || starter.includes('vue') || starter.includes('inertia');
        setToggle('enableNode', needsNode);
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

  // ---- Preview ----
  function updatePreview() {
    const config = Generators.getConfig();
    currentFiles = Generators.generateFiles(config);
    renderTabs();
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
    const lang = Generators.getLanguage(currentTab);
    codeEl.textContent = content;
    codeEl.className = `hljs language-${lang}`;
    if (typeof hljs !== 'undefined') hljs.highlightElement(codeEl);
  }

  // ---- Download ZIP ----
  document.getElementById('btnDownload').addEventListener('click', () => {
    const config = Generators.getConfig();
    const files = Generators.generateFiles(config);
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }
    zip.generateAsync({ type: 'blob' }).then(blob => {
      saveAs(blob, `${config.projectName}.zip`);
    });
  });

  // ---- Init ----
  showPresetOptions('none');
  updatePreview();
});
