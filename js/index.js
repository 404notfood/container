/* ========================================
   index.js — App scripts loader
   Loads all application modules in order
   Uses async=false to preserve execution order
   ======================================== */
(function () {
  var modules = [
    // Templates (helpers must load first, then extensions)
    'js/tpl/helpers.js',
    'js/tpl/compose.js',
    'js/tpl/dockerfiles.js',
    'js/tpl/webservers.js',
    'js/tpl/env.js',
    'js/tpl/presets.tpl.js',
    'js/tpl/generic.js',
    'js/tpl/readme.js',
    'js/tpl/scripts.js',

    // App modules
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
