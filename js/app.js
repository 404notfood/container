/* ========================================
   app.js — Orchestrator (loads after all modules)
   ======================================== */
const APP_VERSION = 'v2.5.0';

document.addEventListener('DOMContentLoaded', () => {
  // Set version badge
  const versionEl = document.getElementById('appVersion');
  if (versionEl) versionEl.textContent = APP_VERSION;

  // Accessibility
  AppA11y.initAccessibility();
  AppA11y.initAriaAttributes();

  // Event handlers
  AppEvents.initEventHandlers();

  // Environment & runtime init
  AppEnvironment.updateNginxSocketVisibility();
  AppEnvironment.updateEnvironmentOptions();
  AppEnvironment.updateRuntimeInfo();

  // Features
  AppFeatures.initCopyButton();
  AppFeatures.initDownloadButtons();

  // Sidebar navigation
  AppSidebar.initSidebar();

  // Preset defaults & first preview
  AppPresets.showPresetOptions('none');
  AppPreview.updatePreview();
});
