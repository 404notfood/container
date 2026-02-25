/* ========================================
   features.js — Copy clipboard & ZIP download
   ======================================== */
(function () {

  function initCopyButton() {
    var btnCopy = document.getElementById('btnCopy');
    if (!btnCopy) return;
    btnCopy.addEventListener('click', () => {
      var content = AppPreview.getCurrentFiles()[AppPreview.getCurrentTab()] || '';
      if (!content) return;
      var label = btnCopy.querySelector('[data-copy-label]');
      navigator.clipboard.writeText(content).then(() => {
        btnCopy.classList.add('copied');
        if (label) label.textContent = 'Copié !';
        AppUtils.showToast('Copié dans le presse-papier !');
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          if (label) label.textContent = 'Copier';
        }, 2000);
      }).catch(() => AppUtils.showToast('Impossible de copier', true));
    });
  }

  function doDownload() {
    try {
      var config = Generators.getConfig();
      var files = Generators.generateFiles(config);
      var zip = new JSZip();
      for (var [path, content] of Object.entries(files)) zip.file(path, content);
      zip.generateAsync({ type: 'blob' }).then(blob => saveAs(blob, `${config.projectName}.zip`));
    } catch (e) {
      AppUtils.showToast('Erreur : ' + e.message, true);
    }
  }

  function initDownloadButtons() {
    document.getElementById('btnDownload').addEventListener('click', doDownload);
    document.getElementById('btnDownloadHeader')?.addEventListener('click', doDownload);
  }

  window.AppFeatures = { initCopyButton, initDownloadButtons };
})();
