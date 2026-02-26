/* ========================================
   tpl/scripts.js — Environment startup/stop scripts
   (Windows PowerShell + Unix bash)
   ======================================== */

Object.assign(Templates, {

  windowsStartScript(config) {
    const envNames = { 'windows-laragon': 'Laragon', 'windows-herd': 'Herd', 'windows-xampp': 'XAMPP', 'windows-wamp': 'WAMP' };
    const envName = envNames[config.environment] || 'Windows';
    const cmd = this.getCmd(config);
    const composeCmd = this.getComposeCmd(config);
    const runtimeName = config.runtime === 'docker' ? 'Docker' : 'Podman';

    let script = `# Script de demarrage ${runtimeName} pour Windows (${envName})
# Ce script cree et demarre les containers ${runtimeName}
# ${envName} gere deja le SSL, donc les containers n'ont pas besoin de certificats

Write-Host "Demarrage des containers ${runtimeName} pour ${config.projectName}..." -ForegroundColor Green

# Verifier que ${runtimeName} est installe
if (-not (Get-Command ${cmd} -ErrorAction SilentlyContinue)) {
    Write-Host "Erreur: ${runtimeName} n'est pas installe ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Charger les variables d'environnement
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Creer le reseau si necessaire
$networkExists = ${cmd} network ls --format "{{.Name}}" | Select-String -Pattern "^app-network$"
if (-not $networkExists) {
    Write-Host "Creation du reseau app-network..." -ForegroundColor Yellow
    ${cmd} network create app-network
}

`;

    const volumes = [];
    if (config.mysql || config.mariadb) volumes.push('mysql-data');
    if (config.postgres) volumes.push('postgres-data');
    if (config.mongo) volumes.push('mongo-data');
    if (config.redis) volumes.push('redis-data');
    if (config.minio) volumes.push('minio-data');
    if (config.elasticsearch) volumes.push('elasticsearch-data');

    if (volumes.length > 0) {
      script += `# Creer les volumes necessaires\n`;
      volumes.forEach(vol => {
        script += `$volumeExists = ${cmd} volume ls --format "{{.Name}}" | Select-String -Pattern "^${vol}$"\n`;
        script += `if (-not $volumeExists) {\n`;
        script += `    Write-Host "Creation du volume ${vol}..." -ForegroundColor Yellow\n`;
        script += `    ${cmd} volume create ${vol}\n`;
        script += `}\n\n`;
      });
    }

    script += `# Demarrer les containers\n`;
    script += `Write-Host "Demarrage des services..." -ForegroundColor Yellow\n`;
    script += `${composeCmd} up -d\n\n`;

    script += `Write-Host "Containers demarres avec succes!" -ForegroundColor Green\n`;
    script += `Write-Host ""\n`;
    script += `Write-Host "Acces via ${envName}:" -ForegroundColor Cyan\n`;

    const accessInfo = {
      'windows-laragon': { url: `https://${config.projectName}.test`, note: 'Le SSL est gere automatiquement par Laragon' },
      'windows-herd': { url: `https://${config.projectName}.test`, note: 'Le SSL est gere automatiquement par Herd' },
      'windows-xampp': { url: `http://localhost/${config.projectName}`, note: 'Configurez le VirtualHost dans httpd-vhosts.conf pour HTTPS' },
      'windows-wamp': { url: `http://localhost/${config.projectName}`, note: 'Configurez le VirtualHost dans httpd-vhosts.conf pour HTTPS' }
    };

    const info = accessInfo[config.environment] || { url: `http://localhost`, note: '' };
    script += `Write-Host "  - Application: ${info.url}" -ForegroundColor White\n`;
    if (info.note) {
      script += `Write-Host "  (${info.note})" -ForegroundColor Gray\n`;
    }

    return script;
  },

  windowsStopScript(config) {
    const composeCmd = this.getComposeCmd(config);
    const runtimeName = config.runtime === 'docker' ? 'Docker' : 'Podman';

    return `# Script d'arret ${runtimeName} pour Windows
# Arrete et supprime les containers

Write-Host "Arret des containers ${runtimeName} pour ${config.projectName}..." -ForegroundColor Yellow

${composeCmd} down

Write-Host "Containers arretes!" -ForegroundColor Green
`;
  },

  unixStartScript(config) {
    const envNames = { 'linux-local': 'Linux', 'linux-lamp': 'Linux (LAMP)', 'mac-local': 'macOS', 'mac-mamp': 'macOS (MAMP)' };
    const envName = envNames[config.environment] || 'Unix';
    const cmd = this.getCmd(config);
    const composeCmd = this.getComposeCmd(config);
    const runtimeName = config.runtime === 'docker' ? 'Docker' : 'Podman';
    const networkCheck = config.runtime === 'docker'
      ? `docker network inspect app-network`
      : `podman network exists app-network`;

    let script = `#!/bin/bash
# Script de demarrage ${runtimeName} pour ${envName}
# Ce script cree et demarre les containers ${runtimeName}

set -e

echo "Demarrage des containers ${runtimeName} pour ${config.projectName}..."

# Verifier que ${runtimeName} est installe
if ! command -v ${cmd} &> /dev/null; then
    echo "Erreur: ${runtimeName} n'est pas installe"
    exit 1
fi

# Charger les variables d'environnement
if [ -f .env ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi

# Creer le reseau si necessaire
if ! ${networkCheck} &>/dev/null; then
    echo "Creation du reseau app-network..."
    ${cmd} network create app-network
fi

`;

    const volumes = [];
    if (config.mysql || config.mariadb) volumes.push('mysql-data');
    if (config.postgres) volumes.push('postgres-data');
    if (config.mongo) volumes.push('mongo-data');
    if (config.redis) volumes.push('redis-data');
    if (config.minio) volumes.push('minio-data');
    if (config.elasticsearch) volumes.push('elasticsearch-data');

    if (volumes.length > 0) {
      script += `# Creer les volumes necessaires\n`;
      volumes.forEach(vol => {
        const check = config.runtime === 'docker'
          ? `${cmd} volume inspect ${vol}`
          : `${cmd} volume exists ${vol}`;
        script += `if ! ${check} &>/dev/null; then\n`;
        script += `    echo "Creation du volume ${vol}..."\n`;
        script += `    ${cmd} volume create ${vol}\n`;
        script += `fi\n\n`;
      });
    }

    const standaloneEnvs = ['linux-local', 'mac-local'];
    if (standaloneEnvs.includes(config.environment) && config.ssl === 'mkcert') {
      script += `# Generer les certificats SSL mkcert si necessaire\n`;
      script += `if [ ! -f certs/${config.domain || 'localhost'}.pem ]; then\n`;
      script += `    echo "Generation des certificats SSL avec mkcert..."\n`;
      script += `    if ! command -v mkcert &> /dev/null; then\n`;
      script += `        echo "Erreur: mkcert n'est pas installe"\n`;
      script += `        echo "Installation: https://github.com/FiloSottile/mkcert"\n`;
      script += `        exit 1\n`;
      script += `    fi\n`;
      script += `    cd certs\n`;
      script += `    mkcert -install\n`;
      script += `    mkcert ${config.domain || 'localhost'}\n`;
      script += `    cd ..\n`;
      script += `fi\n\n`;
    }

    script += `# Demarrer les containers\n`;
    script += `echo "Demarrage des services..."\n`;
    script += `${composeCmd} up -d\n\n`;

    script += `echo "Containers demarres avec succes!"\n`;
    script += `echo ""\n`;
    script += `echo "Acces:"\n`;

    const externalServerEnvs = ['linux-lamp', 'mac-mamp'];
    if (externalServerEnvs.includes(config.environment)) {
      const lampUrl = config.environment === 'linux-lamp'
        ? `http://localhost/${config.projectName}`
        : `http://localhost:8888/${config.projectName}`;
      script += `echo "  - Application: ${lampUrl}"\n`;
      script += `echo "  (Le serveur web local fait proxy vers les containers)"\n`;
    } else {
      const proto = config.ssl !== 'none' ? 'https' : 'http';
      script += `echo "  - Application: ${proto}://${config.domain || 'localhost'}"\n`;

      if (config.ssl === 'mkcert') {
        script += `echo "  (SSL local via mkcert)"\n`;
      } else if (config.ssl === 'letsencrypt') {
        script += `echo "  (SSL via Let's Encrypt)"\n`;
      }
    }

    if (config.adminer) script += `echo "  - Adminer: http://localhost:${config.adminerPort}"\n`;
    if (config.phpmyadmin) script += `echo "  - phpMyAdmin: http://localhost:${config.phpmyadminPort}"\n`;
    if (config.pgadmin) script += `echo "  - pgAdmin: http://localhost:${config.pgadminPort}"\n`;
    if (config.mongoexpress) script += `echo "  - Mongo Express: http://localhost:${config.mongoexpressPort}"\n`;
    if (config.mailpit) script += `echo "  - Mailpit: http://localhost:${config.mailpitUiPort}"\n`;
    if (config.minio) script += `echo "  - MinIO Console: http://localhost:${config.minioConsolePort}"\n`;

    return script;
  },

  hestiaStartScript(config) {
    const cmd = this.getCmd(config);
    const composeCmd = this.getComposeCmd(config);
    const runtimeName = config.runtime === 'docker' ? 'Docker' : 'Podman';
    const networkCheck = config.runtime === 'docker'
      ? `docker network inspect app-network`
      : `podman network exists app-network`;
    const domain = config.domain || 'example.com';

    let script = `#!/bin/bash
# Script de demarrage ${runtimeName} pour HestiaCP VPS
# Projet: ${config.projectName}
# Le SSL et le reverse proxy sont geres par HestiaCP

set -e

echo "Demarrage des containers ${runtimeName} pour ${config.projectName} (HestiaCP)..."

# Verifier que ${runtimeName} est installe
if ! command -v ${cmd} &> /dev/null; then
    echo "Erreur: ${runtimeName} n'est pas installe"
    exit 1
fi

# Charger les variables d'environnement
if [ -f .env ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi

# Creer le reseau si necessaire
if ! ${networkCheck} &>/dev/null; then
    echo "Creation du reseau app-network..."
    ${cmd} network create app-network
fi

`;

    const volumes = [];
    if (config.mysql || config.mariadb) volumes.push('mysql-data');
    if (config.postgres) volumes.push('postgres-data');
    if (config.mongo) volumes.push('mongo-data');
    if (config.redis) volumes.push('redis-data');
    if (config.minio) volumes.push('minio-data');
    if (config.elasticsearch) volumes.push('elasticsearch-data');

    if (volumes.length > 0) {
      script += `# Creer les volumes necessaires\n`;
      volumes.forEach(vol => {
        const check = config.runtime === 'docker'
          ? `${cmd} volume inspect ${vol}`
          : `${cmd} volume exists ${vol}`;
        script += `if ! ${check} &>/dev/null; then\n`;
        script += `    echo "Creation du volume ${vol}..."\n`;
        script += `    ${cmd} volume create ${vol}\n`;
        script += `fi\n\n`;
      });
    }

    script += `# Demarrer les containers\n`;
    script += `echo "Demarrage des services..."\n`;
    script += `${composeCmd} up -d\n\n`;

    script += `echo "Containers demarres avec succes!"\n`;
    script += `echo ""\n`;
    script += `echo "Acces:"\n`;
    script += `echo "  - Application: https://${domain}"\n`;
    script += `echo "  (SSL et proxy geres par HestiaCP)"\n`;

    if (config.adminer) script += `echo "  - Adminer: http://localhost:${config.adminerPort}"\n`;
    if (config.phpmyadmin) script += `echo "  - phpMyAdmin: http://localhost:${config.phpmyadminPort}"\n`;
    if (config.pgadmin) script += `echo "  - pgAdmin: http://localhost:${config.pgadminPort}"\n`;
    if (config.mongoexpress) script += `echo "  - Mongo Express: http://localhost:${config.mongoexpressPort}"\n`;
    if (config.mailpit) script += `echo "  - Mailpit: http://localhost:${config.mailpitUiPort}"\n`;
    if (config.minio) script += `echo "  - MinIO Console: http://localhost:${config.minioConsolePort}"\n`;

    script += `\necho ""\n`;
    script += `echo "Pour installer le template HestiaCP: sudo bash hestia/install.sh"\n`;

    return script;
  },

  hestiaStopScript(config) {
    const composeCmd = this.getComposeCmd(config);
    const runtimeName = config.runtime === 'docker' ? 'Docker' : 'Podman';

    return `#!/bin/bash
# Script d'arret ${runtimeName} pour HestiaCP VPS
# Arrete et supprime les containers

echo "Arret des containers ${runtimeName} pour ${config.projectName}..."

${composeCmd} down

echo "Containers arretes!"
`;
  },

  unixStopScript(config) {
    const envNames = { 'linux-local': 'Linux', 'linux-lamp': 'Linux (LAMP)', 'mac-local': 'macOS', 'mac-mamp': 'macOS (MAMP)' };
    const envName = envNames[config.environment] || 'Unix';
    const composeCmd = this.getComposeCmd(config);
    const runtimeName = config.runtime === 'docker' ? 'Docker' : 'Podman';

    return `#!/bin/bash
# Script d'arret ${runtimeName} pour ${envName}
# Arrete et supprime les containers

echo "Arret des containers ${runtimeName} pour ${config.projectName}..."

${composeCmd} down

echo "Containers arretes!"
`;
  }
});
