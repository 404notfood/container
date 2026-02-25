/* ========================================
   index.js — App scripts loader
   Loads all application modules in order
   Uses async=false to preserve execution order
   ======================================== */
(function () {
  var modules = [
    'js/templates.js',
    'js/generators.js',
    'js/utils.js',
    'js/form-helpers.js',
    'js/presets.js',
    'js/environment.js',
    'js/preview.js',
    'js/features.js',
    'js/a11y.js',
    'js/sidebar.js',
    'js/event-handlers.js',
    'js/app.js'
  ];

  modules.forEach(function (src) {
    var el = document.createElement('script');
    el.src = src;
    el.async = false;
    document.body.appendChild(el);
  });
})();
