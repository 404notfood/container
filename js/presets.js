/* ========================================
   presets.js — Preset application logic
   ======================================== */
(function () {
  var F = null; // lazy ref to FormHelpers

  function helpers() {
    if (!F) F = window.FormHelpers;
    return F;
  }

  function showPresetOptions(preset) {
    document.querySelectorAll('.preset-options').forEach(el => el.classList.remove('open'));
    const panel = document.getElementById(`presetOptions-${preset}`);
    if (panel) panel.classList.add('open');
  }

  function applyPreset(preset) {
    var h = helpers();
    showPresetOptions(preset);
    if (preset === 'none') return;

    switch (preset) {
      case 'wordpress':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', true);
        h.setSelect('phpVersion', '8.4');
        h.setPhpExtension('pdo_mysql', true);
        h.setPhpExtension('gd', true);
        h.setPhpExtension('curl', true);
        h.setPhpExtension('zip', true);
        h.setPhpExtension('mbstring', true);
        h.setPhpExtension('exif', true);
        h.setPhpExtension('imagick', true);
        h.setPhpExtension('xml', true);
        h.setToggle('enableNode', false);
        h.setToggle('enablePython', false);
        h.setToggle('enableJava', false);
        var wpDb = document.getElementById('wpDbEngine').value;
        h.setToggle('enableMysql', wpDb === 'mysql');
        h.setToggle('enableMariadb', wpDb === 'mariadb');
        h.setToggle('enablePostgres', false);
        h.setToggle('enableMongo', false);
        h.setToggle('enableRedis', false);
        h.setToggle('enableMailpit', true);
        break;

      case 'laravel':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', true);
        h.setSelect('phpVersion', '8.4');
        h.setPhpExtension('pdo_mysql', true);
        h.setPhpExtension('pdo_pgsql', true);
        h.setPhpExtension('redis', true);
        h.setPhpExtension('gd', true);
        h.setPhpExtension('curl', true);
        h.setPhpExtension('zip', true);
        h.setPhpExtension('mbstring', true);
        h.setPhpExtension('xml', true);
        h.setPhpExtension('bcmath', true);
        h.setToggle('enablePython', false);
        h.setToggle('enableJava', false);
        var lDb = document.getElementById('laravelDb').value;
        h.setToggle('enableMysql', lDb === 'mysql');
        h.setToggle('enableMariadb', lDb === 'mariadb');
        h.setToggle('enablePostgres', lDb === 'postgres');
        h.setToggle('enableMongo', false);
        h.setToggle('enableRedis', true);
        h.setToggle('enableMailpit', true);
        var starter = document.getElementById('laravelStarter').value;
        h.setToggle('enableNode', starter.includes('react') || starter.includes('vue') || starter.includes('inertia'));
        break;

      case 'symfony':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', true);
        h.setSelect('phpVersion', '8.4');
        h.setPhpExtension('intl', true);
        h.setPhpExtension('xml', true);
        h.setPhpExtension('curl', true);
        h.setPhpExtension('mbstring', true);
        h.setPhpExtension('zip', true);
        h.setPhpExtension('opcache', true);
        h.setToggle('enableNode', false);
        h.setToggle('enablePython', false);
        h.setToggle('enableJava', false);
        var sDb = document.getElementById('symfonyDb').value;
        h.setToggle('enableMysql', sDb === 'mysql');
        h.setToggle('enableMariadb', sDb === 'mariadb');
        h.setToggle('enablePostgres', sDb === 'postgres');
        h.setPhpExtension('pdo_mysql', sDb === 'mysql' || sDb === 'mariadb');
        h.setPhpExtension('pdo_pgsql', sDb === 'postgres');
        h.setToggle('enableMongo', false);
        h.setToggle('enableRedis', true);
        h.setPhpExtension('redis', true);
        h.setToggle('enableMailpit', true);
        break;

      case 'nextjs':
        h.setRadio('webserver', 'none');
        h.setToggle('enablePhp', false);
        h.setToggle('enableNode', true);
        h.setSelect('nodeVersion', '20');
        h.setSelect('nodeFramework', 'nextjs');
        h.setToggle('enablePython', false);
        h.setToggle('enableJava', false);
        var nDb = document.getElementById('nextjsDb').value;
        h.setToggle('enableMysql', nDb === 'mysql');
        h.setToggle('enablePostgres', nDb === 'postgres');
        h.setToggle('enableMongo', nDb === 'mongo');
        h.setToggle('enableMariadb', false);
        h.setToggle('enableRedis', false);
        break;

      case 'nestjs':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', false);
        h.setToggle('enableNode', true);
        h.setSelect('nodeVersion', '20');
        h.setSelect('nodeFramework', 'custom');
        h.setToggle('enablePython', false);
        h.setToggle('enableJava', false);
        var nsDb = document.getElementById('nestjsDb').value;
        h.setToggle('enableMysql', nsDb === 'mysql');
        h.setToggle('enablePostgres', nsDb === 'postgres');
        h.setToggle('enableMongo', nsDb === 'mongo');
        h.setToggle('enableMariadb', false);
        h.setToggle('enableRedis', true);
        h.setToggle('enableMailpit', true);
        break;

      case 'angular':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', false);
        h.setToggle('enableNode', true);
        h.setSelect('nodeVersion', '20');
        h.setToggle('enablePython', false);
        h.setToggle('enableJava', false);
        h.setToggle('enableMysql', false);
        h.setToggle('enableMariadb', false);
        h.setToggle('enablePostgres', false);
        h.setToggle('enableMongo', false);
        h.setToggle('enableRedis', false);
        break;

      case 'django':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', false);
        h.setToggle('enableNode', false);
        h.setToggle('enablePython', true);
        h.setSelect('pythonVersionBackend', document.getElementById('pythonVersion').value);
        h.setSelect('pythonFrameworkBackend', 'django');
        h.setToggle('enableJava', false);
        var djDb = document.getElementById('djangoDb').value;
        h.setToggle('enableMysql', djDb === 'mysql');
        h.setToggle('enablePostgres', djDb === 'postgres');
        h.setToggle('enableMariadb', false);
        h.setToggle('enableMongo', false);
        h.setToggle('enableRedis', true);
        h.setToggle('enableMailpit', true);
        break;

      case 'flask':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', false);
        h.setToggle('enableNode', false);
        h.setToggle('enablePython', true);
        h.setSelect('pythonVersionBackend', document.getElementById('flaskPythonVersion').value);
        h.setSelect('pythonFrameworkBackend', 'flask');
        h.setToggle('enableJava', false);
        var flDb = document.getElementById('flaskDb').value;
        h.setToggle('enableMysql', flDb === 'mysql');
        h.setToggle('enablePostgres', flDb === 'postgres');
        h.setToggle('enableMongo', flDb === 'mongo');
        h.setToggle('enableMariadb', false);
        h.setToggle('enableRedis', flDb !== 'none');
        break;

      case 'springboot':
        h.setRadio('webserver', 'nginx');
        h.setToggle('enablePhp', false);
        h.setToggle('enableNode', false);
        h.setToggle('enablePython', false);
        h.setToggle('enableJava', true);
        h.setSelect('javaVersionBackend', document.getElementById('springJavaVersion').value);
        var spDb = document.getElementById('springDb').value;
        h.setToggle('enableMysql', spDb === 'mysql');
        h.setToggle('enableMariadb', spDb === 'mariadb');
        h.setToggle('enablePostgres', spDb === 'postgres');
        h.setToggle('enableMongo', spDb === 'mongo');
        h.setToggle('enableRedis', true);
        h.setToggle('enableMailpit', true);
        break;
    }

    window.AppEnvironment.updateNginxSocketVisibility();
  }

  window.AppPresets = { showPresetOptions, applyPreset };
})();
