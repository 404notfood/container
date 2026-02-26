/* ========================================
   environment.js — Environment & runtime logic
   ======================================== */
(function () {

  function updateNginxSocketVisibility() {
    var ws = document.querySelector('input[name="webserver"]:checked')?.value;
    var nginxOpt = document.getElementById('nginxSocketOption');
    if (nginxOpt) nginxOpt.style.display = ws === 'nginx' ? 'block' : 'none';
  }

  function updateEnvironmentOptions() {
    var env = document.querySelector('input[name="environment"]:checked')?.value || 'windows-laragon';
    var sslHint = document.getElementById('sslHint');
    var sslOptions = document.getElementById('sslOptions');

    var externalSslEnvs = ['windows-laragon', 'windows-herd', 'windows-xampp', 'windows-wamp', 'mac-mamp', 'linux-lamp', 'vps-hestia'];
    var sslMessages = {
      'windows-laragon': 'SSL géré par Laragon',
      'windows-herd': 'SSL géré par Herd',
      'windows-xampp': 'SSL via config Apache/Nginx XAMPP',
      'windows-wamp': 'SSL via config Apache WAMP',
      'mac-mamp': 'SSL via config Apache/Nginx MAMP',
      'linux-lamp': 'SSL via config système (Apache/Nginx)',
      'linux-local': 'SSL géré par les containers',
      'mac-local': 'SSL géré par les containers',
      'vps-hestia': 'SSL géré par HestiaCP (Let\'s Encrypt)',
    };

    if (sslHint) sslHint.textContent = sslMessages[env] || "Dépend de l'environnement";

    // HestiaCP options panel
    var hestiaOptions = document.getElementById('hestiaOptions');
    if (hestiaOptions) hestiaOptions.classList.toggle('open', env === 'vps-hestia');

    if (externalSslEnvs.includes(env)) {
      if (sslOptions) {
        sslOptions.querySelectorAll('.radio-card').forEach(card => {
          var val = card.querySelector('input').value;
          card.style.opacity = val !== 'none' ? '0.5' : '1';
          card.style.pointerEvents = val !== 'none' ? 'none' : '';
        });
      }
      window.FormHelpers.setRadio('ssl', 'none');
    } else {
      if (sslOptions) {
        sslOptions.querySelectorAll('.radio-card').forEach(card => {
          card.style.opacity = '1';
          card.style.pointerEvents = '';
        });
      }
    }

    window.AppPreview.updatePreview();
  }

  function updateRuntimeInfo() {
    var runtime = document.querySelector('input[name="runtime"]:checked')?.value || 'docker';
    var runtimeInfo = document.getElementById('runtimeInfo');
    if (runtimeInfo) {
      var infos = {
        docker: { title: 'Docker', text: 'Docker est le runtime le plus populaire et le mieux supporté. Recommandé pour la plupart des utilisateurs.', color: '#0066cc' },
        podman: { title: 'Podman', text: 'Podman est un runtime rootless (sans privilèges) compatible Docker. Idéal pour Linux et la sécurité.', color: '#892ca0' },
      };
      var info = infos[runtime];
      runtimeInfo.innerHTML = `<strong>${info.title}</strong> : ${info.text}`;
      runtimeInfo.style.borderLeftColor = info.color;
    }
    window.AppPreview.updatePreview();
  }

  window.AppEnvironment = { updateEnvironmentOptions, updateRuntimeInfo, updateNginxSocketVisibility };
})();
