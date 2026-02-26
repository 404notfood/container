/* ========================================
   tpl/generic.js — Generic file templates
   (index.php, index.html, mkcert, init script)
   ======================================== */

Object.assign(Templates, {

  indexPhp() {
    return `<?php\nphpinfo();\n`;
  },

  indexHtml(config) {
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${config.projectName}</title>\n  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;color:#eee;margin:0;}h1{font-size:2rem;}</style>\n</head>\n<body>\n  <h1>${config.projectName} is running!</h1>\n</body>\n</html>\n`;
  },

  mkcertScript() {
    return `#!/bin/bash\n# Generate SSL certificates for local development\n# Requires mkcert: https://github.com/FiloSottile/mkcert\n\nmkcert -install\nmkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 ::1\n\necho "Certificates generated!"\n`;
  },

  hestiaProxyTpl(config) {
    const port = config.node ? config.nodePort : config.python ? config.pythonPort : config.java ? config.javaPort : config.httpPort;
    return `#=========================================================================#
# HestiaCP — Nginx Reverse Proxy for Container (HTTP)                     #
# Project: ${config.projectName}                                          #
# Proxy target: http://127.0.0.1:${port}                                  #
#                                                                          #
# Install:                                                                 #
#   sudo cp container-proxy.tpl /usr/local/hestia/data/templates/web/nginx/#
#   sudo cp container-proxy.stpl /usr/local/hestia/data/templates/web/nginx/#
#   Then: HestiaCP panel > Edit domain > Proxy Template > container-proxy #
#=========================================================================#

server {
    listen      %ip%:%web_port%;
    server_name %domain% %alias%;

    access_log  /var/log/nginx/domains/%domain%.log combined;
    access_log  /var/log/nginx/domains/%domain%.bytes bytes;
    error_log   /var/log/nginx/domains/%domain%.error.log error;

    include %home%/%user%/conf/web/%domain%/nginx.forcessl.conf*;

    location ~ /\\.(?!well-known\\/) {
        deny all;
        return 404;
    }

    location / {
        proxy_pass         http://127.0.0.1:${port};
        proxy_set_header   Host              \\$host;
        proxy_set_header   X-Real-IP         \\$remote_addr;
        proxy_set_header   X-Forwarded-For   \\$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \\$scheme;
        proxy_set_header   X-Forwarded-Host  \\$host;
        proxy_set_header   X-Forwarded-Port  \\$server_port;

        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \\$http_upgrade;
        proxy_set_header   Connection        \\$connection_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        proxy_buffering    on;
        proxy_buffer_size  128k;
        proxy_buffers      4 256k;
        proxy_busy_buffers_size 256k;

        client_max_body_size 0;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    location /vstats/ {
        alias   %home%/%user%/web/%domain%/stats/;
        include %home%/%user%/web/%domain%/stats/auth.conf*;
    }

    include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}
`;
  },

  hestiaProxyStpl(config) {
    const port = config.node ? config.nodePort : config.python ? config.pythonPort : config.java ? config.javaPort : config.httpPort;
    return `#=========================================================================#
# HestiaCP — Nginx Reverse Proxy for Container (HTTPS/SSL)                #
# Project: ${config.projectName}                                          #
#=========================================================================#

map \\$http_upgrade \\$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen      %ip%:%web_ssl_port% ssl;
    server_name %domain% %alias%;

    ssl_certificate     %ssl_pem%;
    ssl_certificate_key %ssl_key%;
    ssl_stapling        on;
    ssl_stapling_verify on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

    access_log  /var/log/nginx/domains/%domain%.log combined;
    access_log  /var/log/nginx/domains/%domain%.bytes bytes;
    error_log   /var/log/nginx/domains/%domain%.error.log error;

    location ~ /\\.(?!well-known\\/) {
        deny all;
        return 404;
    }

    location / {
        proxy_pass         http://127.0.0.1:${port};
        proxy_set_header   Host              \\$host;
        proxy_set_header   X-Real-IP         \\$remote_addr;
        proxy_set_header   X-Forwarded-For   \\$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \\$scheme;
        proxy_set_header   X-Forwarded-Host  \\$host;
        proxy_set_header   X-Forwarded-Port  \\$server_port;

        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \\$http_upgrade;
        proxy_set_header   Connection        \\$connection_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        proxy_buffering    on;
        proxy_buffer_size  128k;
        proxy_buffers      4 256k;
        proxy_busy_buffers_size 256k;

        client_max_body_size 0;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    location /vstats/ {
        alias   %home%/%user%/web/%domain%/stats/;
        include %home%/%user%/web/%domain%/stats/auth.conf*;
    }

    include %home%/%user%/conf/web/%domain%/nginx.ssl.conf_*;
}
`;
  },

  initScript(config) {
    const escapeShell = (str) => {
      if (!str) return '';
      return str.replace(/'/g, "'\\''");
    };

    const projectName = escapeShell(config.projectName);
    const gitRepoUrl = escapeShell(config.gitRepoUrl);
    const gitBranch = escapeShell(config.gitBranch || 'main');
    const preset = config.preset || 'none';

    const containers = [];
    if (config.php) containers.push('php');
    if (config.node) containers.push('node');
    if (config.python) containers.push('python');
    if (config.java) containers.push('java');

    let script = `#!/bin/bash
set -e

echo "=== Initialisation de ${projectName} ==="
echo ""

# -----------------------------------------------------------
# Verification des prerequis
# -----------------------------------------------------------
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "ERREUR : '$1' n'est pas installe ou n'est pas dans le PATH."
    exit 1
  fi
}

check_command git
check_command docker

# Verifier que Docker est demarre
if ! podman info &> /dev/null; then
  echo "ERREUR : le daemon Docker ne semble pas demarre."
  exit 1
fi

# -----------------------------------------------------------
# Clone du repository
# -----------------------------------------------------------
GIT_REPO_URL='${gitRepoUrl}'
GIT_BRANCH='${gitBranch}'

if [ ! -d "src/.git" ]; then
  echo ">> Clonage du repository..."
  if [ "$GIT_BRANCH" != "main" ]; then
    git clone -b "$GIT_BRANCH" -- "$GIT_REPO_URL" src/
  else
    git clone -- "$GIT_REPO_URL" src/
  fi
else
  echo ">> Repository deja clone, pull des derniers changements..."
  (cd src && git pull)
fi

# Securisation des permissions du code source
chmod -R o-rwx src/

# -----------------------------------------------------------
# Demarrage des containers
# -----------------------------------------------------------
echo ">> Demarrage des containers..."
 up -d

# Attente que les containers soient prets
echo ">> Attente du demarrage des services..."
`;

    if (containers.length > 0) {
      script += `max_wait=60
elapsed=0
`;
      for (const svc of containers) {
        script += `while !  exec ${svc} echo "ok" &> /dev/null; do
  sleep 2
  elapsed=$((elapsed + 2))
  if [ "$elapsed" -ge "$max_wait" ]; then
    echo "ERREUR : le container '${svc}' n'a pas demarre dans les $max_wait secondes."
     logs ${svc}
    exit 1
  fi
done
echo "   - ${svc} : pret"
`;
      }
    } else {
      script += `sleep 5
`;
    }

    script += `
# -----------------------------------------------------------
# Installation des dependances
# -----------------------------------------------------------
`;

    switch (preset) {
      case 'wordpress':
        script += `# WordPress : le code est clone depuis le repo
echo ">> WordPress detecte — verifiez que le repo contient bien WordPress."
`;
        break;

      case 'laravel':
        script += `# Installation des dependances Laravel
echo ">> Installation des dependances Composer..."
 exec php composer install --no-interaction --optimize-autoloader

echo ">> Generation de la cle d'application..."
 exec php php artisan key:generate

# Copie du fichier .env avec permissions securisees
if [ -f ".env" ] && [ ! -f "src/.env" ]; then
  echo ">> Copie du fichier .env..."
  cp .env src/.env
  chmod 600 src/.env
fi

echo ">> Execution des migrations..."
 exec php php artisan migrate --force
`;
        break;

      case 'symfony':
        script += `# Installation des dependances Symfony
echo ">> Installation des dependances Composer..."
 exec php composer install --no-interaction --optimize-autoloader

# Copie du fichier .env.local avec permissions securisees
if [ -f "src/.env" ] && [ ! -f "src/.env.local" ]; then
  echo ">> Copie du fichier .env.local..."
  cp src/.env src/.env.local
  chmod 600 src/.env.local
fi

echo ">> Execution des migrations..."
 exec php php bin/console doctrine:migrations:migrate --no-interaction
`;
        break;

      case 'nextjs':
        script += `# Installation des dependances Next.js
echo ">> Installation des dependances npm..."
 exec node npm install

# Copie du fichier .env.local avec permissions securisees
if [ -f "src/.env.local.example" ] && [ ! -f "src/.env.local" ]; then
  cp src/.env.local.example src/.env.local
  chmod 600 src/.env.local
fi
`;
        break;

      case 'nestjs':
        script += `# Installation des dependances NestJS
echo ">> Installation des dependances npm..."
 exec node npm install
`;
        break;

      case 'angular':
        script += `# Installation des dependances Angular
echo ">> Installation des dependances npm..."
 exec node npm install
`;
        break;

      case 'django':
        script += `# Installation des dependances Django
echo ">> Installation des dependances Python..."
 exec python pip install -r requirements.txt

# Copie du fichier .env avec permissions securisees
if [ -f "src/.env.example" ] && [ ! -f "src/.env" ]; then
  cp src/.env.example src/.env
  chmod 600 src/.env
fi

echo ">> Execution des migrations..."
 exec python python manage.py migrate
`;
        break;

      case 'flask':
        script += `# Installation des dependances Flask
echo ">> Installation des dependances Python..."
 exec python pip install -r requirements.txt

# Securisation du fichier .env si present
if [ -f "src/.env" ]; then
  chmod 600 src/.env
fi
`;
        break;

      case 'springboot':
        if (config.springBuildVal === 'gradle') {
          script += `# Build Spring Boot (Gradle)
echo ">> Build du projet avec Gradle..."
 exec java gradle build -x test
`;
        } else {
          script += `# Build Spring Boot (Maven)
echo ">> Build du projet avec Maven..."
 exec java mvn install -DskipTests
`;
        }
        break;

      default:
        if (config.php) {
          script += `# Installation des dependances PHP
if [ -f "src/composer.json" ]; then
  echo ">> Installation des dependances Composer..."
   exec php composer install --no-interaction
fi
`;
        }
        if (config.node) {
          script += `# Installation des dependances Node.js
if [ -f "src/package.json" ]; then
  echo ">> Installation des dependances npm..."
   exec node npm install
fi
`;
        }
        if (config.python) {
          script += `# Installation des dependances Python
if [ -f "src/requirements.txt" ]; then
  echo ">> Installation des dependances Python..."
   exec python pip install -r requirements.txt
fi
`;
        }
        break;
    }

    script += `
# -----------------------------------------------------------
# Securisation des fichiers sensibles
# -----------------------------------------------------------
if [ -f ".env" ]; then
  chmod 600 .env
fi

echo ""
echo "=== ${config.projectName} est pret ! ==="
echo "Acces : ${config.ssl !== 'none' ? 'https' : 'http'}://${config.domain || 'localhost'}"
`;

    return script;
  }
});
