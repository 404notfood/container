/* ========================================
   preview.js — Preview generation, tabs & code
   ======================================== */
(function () {
  var currentFiles = {};
  var currentTab = '';
  var hlCache = {};

  function updatePreview() {
    AppUtils.clearFieldErrors();
    var hasError = false;

    var validators = [
      { id: 'projectName', fn: v => Generators.validateProjectName(v || 'my-app') },
      { id: 'projectDomain', fn: v => Generators.validateDomain(v) },
      { id: 'gitRepoUrl', fn: v => Generators.validateGitUrl(v) },
      { id: 'gitBranch', fn: v => Generators.validateGitBranch(v) },
    ];

    for (var { id, fn } of validators) {
      var field = document.getElementById(id);
      if (!field) continue;
      try { fn(field.value.trim()); }
      catch (e) { AppUtils.showFieldError(id, e.message); hasError = true; }
    }

    if (hasError) return;

    try {
      var config = Generators.getConfig();
      currentFiles = Generators.generateFiles(config);
      hlCache = {};
      renderTabs();
    } catch (e) {
      console.error('[Preview]', e);
      AppUtils.showToast('Erreur : ' + e.message, true);
    }
  }

  function renderTabs() {
    var tabsContainer = document.getElementById('previewTabs');
    var filenames = Object.keys(currentFiles);
    if (!currentFiles[currentTab] && filenames.length > 0) currentTab = filenames[0];

    tabsContainer.innerHTML = filenames.map(name => {
      var active = name === currentTab ? 'active' : '';
      var escapedName = AppUtils.escapeHtml(name);
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
    var codeEl = document.getElementById('previewCode');
    var content = currentFiles[currentTab] || '';
    var lang = Generators.getLanguage(currentTab);
    codeEl.className = `hljs language-${lang}`;

    if (hlCache[currentTab]) {
      codeEl.innerHTML = hlCache[currentTab];
    } else {
      codeEl.textContent = content;
      if (typeof hljs !== 'undefined') hljs.highlightElement(codeEl);
      hlCache[currentTab] = codeEl.innerHTML;
    }
  }

  function getCurrentFiles() { return currentFiles; }
  function getCurrentTab() { return currentTab; }

  window.AppPreview = { updatePreview, renderTabs, renderCode, getCurrentFiles, getCurrentTab };
})();
