/* ========================================
   generators.js — Collect config & produce files
   ======================================== */

const Generators = {

  // ---- Validation Helpers ----
  validateProjectName(name) {
    // Docker container names: alphanumeric, underscore, hyphen only, max 63 chars
    if (!name || name.length === 0) return 'my-app';
    if (name.length > 63) {
      throw new Error('Le nom du projet ne peut pas dépasser 63 caractères');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Le nom du projet ne peut contenir que des lettres, chiffres, tirets et underscores');
    }
    return name;
  },

  validateDomain(domain) {
    if (!domain) return '';
    // Basic domain validation
    if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
      throw new Error('Format de domaine invalide');
    }
    if (domain.length > 253) {
      throw new Error('Le domaine ne peut pas dépasser 253 caractères');
    }
    return domain.toLowerCase();
  },

  validateGitUrl(url) {
    if (!url) return '';
    // Allow only https and git protocols
    if (!/^(https?:\/\/|git@)[a-zA-Z0-9._-]+[\/:][\w\-._~:\/?#\[\]@!$&'()*+,;=%]+\.git$/.test(url)) {
      throw new Error('Format d\'URL Git invalide. Utilisez https:// ou git@');
    }
    if (url.length > 2048) {
      throw new Error('L\'URL Git est trop longue');
    }
    return url;
  },

  validateGitBranch(branch) {
    if (!branch) return 'main';
    // Git branch name rules
    if (!/^[a-zA-Z0-9._/-]+$/.test(branch)) {
      throw new Error('Nom de branche Git invalide');
    }
    if (branch.length > 255) {
      throw new Error('Le nom de la branche est trop long');
    }
    return branch;
  },

  getConfig() {
    const preset = document.querySelector('input[name="preset"]:checked').value;

    const rawProjectName = document.getElementById('projectName').value.trim() || 'my-app';
    const rawDomain = document.getElementById('projectDomain').value.trim();
    const rawGitUrl = document.getElementById('gitRepoUrl').value.trim();
    const rawGitBranch = document.getElementById('gitBranch').value.trim() || 'main';

    const config = {
      projectName: this.validateProjectName(rawProjectName),
      domain: this.validateDomain(rawDomain),
      gitRepoUrl: this.validateGitUrl(rawGitUrl),
      gitBranch: this.validateGitBranch(rawGitBranch),
      preset,
      runtime: document.querySelector('input[name="runtime"]:checked').value,
      environment: document.querySelector('input[name="environment"]:checked').value,
      webserver: document.querySelector('input[name="webserver"]:checked').value,
      ssl: document.querySelector('input[name="ssl"]:checked').value,
      nginxSocket: document.getElementById('enableNginxSocket').checked,

      // Ports
      httpPort: document.getElementById('httpPort').value || '80',
      httpsPort: document.getElementById('httpsPort').value || '443',
      traefikDashPort: document.getElementById('traefikDashPort').value || '8080',
      nodePort: document.getElementById('nodePort').value || '3000',
      pythonPort: document.getElementById('pythonPort').value || '8000',
      javaPort: document.getElementById('javaPort').value || '8080',
      mysqlPort: document.getElementById('mysqlPort').value || '3306',
      mariadbPort: document.getElementById('mariadbPort').value || '3306',
      postgresPort: document.getElementById('postgresPort').value || '5432',
      mongoPort: document.getElementById('mongoPort').value || '27017',
      redisPort: document.getElementById('redisPort').value || '6379',
      memcachedPort: document.getElementById('memcachedPort').value || '11211',
      rabbitmqPort: document.getElementById('rabbitmqPort').value || '5672',
      rabbitmqUiPort: document.getElementById('rabbitmqUiPort').value || '15672',
      adminerPort: document.getElementById('adminerPort').value || '8081',
      phpmyadminPort: document.getElementById('phpmyadminPort').value || '8082',
      pgadminPort: document.getElementById('pgadminPort').value || '8083',
      mongoexpressPort: document.getElementById('mongoexpressPort').value || '8084',
      mailpitSmtpPort: document.getElementById('mailpitSmtpPort').value || '1025',
      mailpitUiPort: document.getElementById('mailpitUiPort').value || '8025',
      minioPort: document.getElementById('minioPort').value || '9000',
      minioConsolePort: document.getElementById('minioConsolePort').value || '9001',
      elasticsearchPort: document.getElementById('elasticsearchPort').value || '9200',

      // HestiaCP
      hestiaUser: document.getElementById('hestiaUser')?.value?.trim() || 'admin',
      hestiaProxyPort: document.getElementById('hestiaProxyPort')?.value || '8080',

      // Backend
      php: document.getElementById('enablePhp').checked,
      phpVersion: document.getElementById('phpVersion').value,
      phpExtensions: [],
      node: document.getElementById('enableNode').checked,
      nodeVersion: document.getElementById('nodeVersion').value,
      nodeFramework: document.getElementById('nodeFramework').value,
      nvmDefault: document.getElementById('nvmDefault').value.trim() || '24',
      python: document.getElementById('enablePython').checked,
      pythonVersionVal: document.getElementById('pythonVersionBackend').value,
      pythonFrameworkVal: document.getElementById('pythonFrameworkBackend').value,
      java: document.getElementById('enableJava').checked,
      javaVersionVal: document.getElementById('javaVersionBackend').value,

      // Databases
      mysql: document.getElementById('enableMysql').checked,
      mysqlVersion: document.getElementById('mysqlVersion').value,
      mariadb: document.getElementById('enableMariadb').checked,
      mariadbVersion: document.getElementById('mariadbVersion').value,
      postgres: document.getElementById('enablePostgres').checked,
      postgresVersion: document.getElementById('postgresVersion').value,
      mongo: document.getElementById('enableMongo').checked,
      mongoVersion: document.getElementById('mongoVersion').value,

      // Cache & Queue
      redis: document.getElementById('enableRedis').checked,
      memcached: document.getElementById('enableMemcached').checked,
      rabbitmq: document.getElementById('enableRabbitmq').checked,

      // Tools
      adminer: document.getElementById('enableAdminer').checked,
      phpmyadmin: document.getElementById('enablePhpmyadmin').checked,
      pgadmin: document.getElementById('enablePgadmin').checked,
      mongoexpress: document.getElementById('enableMongoexpress').checked,
      mailpit: document.getElementById('enableMailpit').checked,
      minio: document.getElementById('enableMinio').checked,
      elasticsearch: document.getElementById('enableElasticsearch').checked,

      // Preset-specific
      wpDbEngine: document.getElementById('wpDbEngine').value,
      laravelVersion: document.getElementById('laravelVersion').value,
      laravelStarter: document.getElementById('laravelStarter').value,
      laravelDb: document.getElementById('laravelDb').value,
      symfonyVersion: document.getElementById('symfonyVersion').value,
      symfonyDb: document.getElementById('symfonyDb').value,
      nextjsDb: document.getElementById('nextjsDb').value,
      nestjsDb: document.getElementById('nestjsDb').value,
      nestjsOrm: document.getElementById('nestjsOrm').value,
      angularVersion: document.getElementById('angularVersion').value,
      djangoVersion: document.getElementById('djangoVersion').value,
      djangoPythonVersion: document.getElementById('pythonVersion').value,
      djangoDb: document.getElementById('djangoDb').value,
      flaskPythonVersion: document.getElementById('flaskPythonVersion').value,
      flaskDb: document.getElementById('flaskDb').value,
      springJavaVersion: document.getElementById('springJavaVersion').value,
      springDb: document.getElementById('springDb').value,
      springBuildVal: document.getElementById('springBuild').value,
    };

    // Collect PHP extensions
    if (config.php) {
      document.querySelectorAll('#phpExtensionsGroup input:checked').forEach(cb => {
        config.phpExtensions.push(cb.value);
      });
    }

    return config;
  },

  generateFiles(config) {
    const files = {};

    // Reset password cache for new generation
    Templates.resetPasswordCache();

    // --- docker-compose.yml ---
    let compose = Templates.composeHeader();

    // Web server
    if (config.webserver === 'nginx') compose += Templates.composeNginx(config);
    if (config.webserver === 'apache') compose += Templates.composeApache(config);
    if (config.webserver === 'caddy') compose += Templates.composeCaddy(config);
    if (config.webserver === 'traefik') compose += Templates.composeTraefik(config);

    // Backend services
    if (config.php) compose += Templates.composePhp(config);
    if (config.node) compose += Templates.composeNode(config);
    if (config.python) compose += Templates.composePython(config);
    if (config.java) compose += Templates.composeJava(config);

    // Databases
    if (config.mysql) compose += Templates.composeMysql(config);
    if (config.mariadb) compose += Templates.composeMariadb(config);
    if (config.postgres) compose += Templates.composePostgres(config);
    if (config.mongo) compose += Templates.composeMongo(config);

    // Cache & Queue
    if (config.redis) compose += Templates.composeRedis(config);
    if (config.memcached) compose += Templates.composeMemcached(config);
    if (config.rabbitmq) compose += Templates.composeRabbitmq(config);

    // Tools
    if (config.adminer) compose += Templates.composeAdminer(config);
    if (config.phpmyadmin) compose += Templates.composePhpmyadmin(config);
    if (config.pgadmin) compose += Templates.composePgadmin(config);
    if (config.mongoexpress) compose += Templates.composeMongoexpress(config);
    if (config.mailpit) compose += Templates.composeMailpit(config);
    if (config.minio) compose += Templates.composeMinio(config);
    if (config.elasticsearch) compose += Templates.composeElasticsearch(config);

    if (config.ssl === 'letsencrypt') compose += Templates.composeCertbot();

    compose += Templates.composeVolumes(config);
    compose += Templates.composeNetworks();
    files['docker-compose.yml'] = compose;

    // --- .env ---
    files['.env'] = Templates.envFile(config);

    // --- Dockerfiles ---
    if (config.php) files['php/Dockerfile'] = Templates.phpDockerfile(config);
    if (config.node) files['node/Dockerfile'] = Templates.nodeDockerfile(config);
    if (config.python) files['python/Dockerfile'] = Templates.pythonDockerfile(config);
    if (config.java) files['java/Dockerfile'] = Templates.javaDockerfile(config);

    // --- Web server configs ---
    if (config.webserver === 'nginx') files['nginx/default.conf'] = Templates.nginxConf(config);
    if (config.webserver === 'apache') files['apache/vhost.conf'] = Templates.apacheVhost(config);
    if (config.webserver === 'caddy') files['Caddyfile'] = Templates.caddyfile(config);
    if (config.webserver === 'traefik') files['traefik/traefik.yml'] = Templates.traefikYml(config);

    // --- SSL ---
    if (config.ssl === 'mkcert') {
      files['certs/generate.sh'] = Templates.mkcertScript();
      files['certs/.gitkeep'] = '';
    }
    if (config.ssl === 'letsencrypt') {
      files['certbot/conf/.gitkeep'] = '';
      files['certbot/www/.gitkeep'] = '';
    }

    // --- Preset-specific files ---
    switch (config.preset) {
      case 'wordpress':
        files['src/wp-config.php'] = Templates.wpConfig(config);
        files['src/.htaccess'] = `# WordPress .htaccess\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteBase /\nRewriteRule ^index\\.php$ - [L]\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule . /index.php [L]\n</IfModule>\n`;
        break;

      case 'laravel':
        files['src/.env.example'] = Templates.laravelEnv(config);
        break;

      case 'symfony':
        files['src/.env'] = Templates.symfonyEnv(config);
        break;

      case 'nextjs':
        files['src/.env.local'] = Templates.nextjsEnvLocal(config);
        files['src/package.json'] = JSON.stringify({
          name: config.projectName,
          version: '0.1.0',
          private: true,
          scripts: { dev: 'next dev', build: 'next build', start: 'next start', lint: 'next lint' },
          dependencies: { next: 'latest', react: 'latest', 'react-dom': 'latest' },
          devDependencies: { '@types/node': 'latest', '@types/react': 'latest', typescript: 'latest' }
        }, null, 2) + '\n';
        break;

      case 'nestjs':
        files['src/.env'] = Templates.nestjsEnv(config);
        files['src/package.json'] = JSON.stringify({
          name: config.projectName,
          version: '0.0.1',
          private: true,
          scripts: { dev: 'nest start --watch', build: 'nest build', start: 'node dist/main', 'start:prod': 'node dist/main' },
          dependencies: {
            '@nestjs/common': '^10.0.0', '@nestjs/core': '^10.0.0',
            '@nestjs/platform-express': '^10.0.0', 'reflect-metadata': '^0.2.0', rxjs: '^7.8.1',
            ...(config.nestjsOrm === 'typeorm' ? { '@nestjs/typeorm': '^10.0.0', typeorm: '^0.3.0' } : {}),
            ...(config.nestjsOrm === 'prisma' ? { '@prisma/client': '^5.0.0' } : {}),
            ...(config.nestjsOrm === 'mongoose' ? { '@nestjs/mongoose': '^10.0.0', mongoose: '^8.0.0' } : {}),
            ...(config.postgres ? { pg: '^8.11.0' } : {}),
            ...(config.mysql ? { mysql2: '^3.6.0' } : {})
          },
          devDependencies: { '@nestjs/cli': '^10.0.0', '@nestjs/schematics': '^10.0.0', typescript: '^5.3.0' }
        }, null, 2) + '\n';
        break;

      case 'angular':
        files['src/environment.ts'] = Templates.angularEnvironment(config);
        files['node/Dockerfile'] = Templates.angularDockerfile(config);
        break;

      case 'django':
        files['src/.env'] = Templates.djangoEnv(config);
        files['src/requirements.txt'] = Templates.djangoRequirements(config);
        break;

      case 'flask':
        files['src/.env'] = Templates.flaskEnv(config);
        files['src/requirements.txt'] = Templates.flaskRequirements(config);
        files['src/app.py'] = `from flask import Flask\n\napp = Flask(__name__)\n\n@app.route('/')\ndef hello():\n    return '<h1>${config.projectName} is running!</h1>'\n\nif __name__ == '__main__':\n    app.run(host='0.0.0.0', port=8000, debug=True)\n`;
        break;

      case 'springboot':
        files['src/src/main/resources/application.properties'] = Templates.springProperties(config);
        if (config.springBuildVal === 'maven') {
          files['src/pom.xml'] = Templates.springPomXml(config);
        }
        break;
    }

    // --- Default source files (if no preset or preset doesn't provide them) ---
    if (config.preset === 'none' || !config.preset) {
      if (config.php) {
        files['src/index.php'] = Templates.indexPhp();
      } else if (!config.node && !config.python && !config.java) {
        files['src/index.html'] = Templates.indexHtml(config);
      }
    }

    // --- init.sh (if git repo specified) ---
    if (config.gitRepoUrl) {
      files['init.sh'] = Templates.initScript(config);
    }

    // --- Environment-specific startup scripts ---
    const windowsEnvs = ['windows-laragon', 'windows-herd', 'windows-xampp', 'windows-wamp'];
    const unixEnvs = ['linux-local', 'linux-lamp', 'mac-local', 'mac-mamp'];

    if (windowsEnvs.includes(config.environment)) {
      files['start-containers.ps1'] = Templates.windowsStartScript(config);
      files['stop-containers.ps1'] = Templates.windowsStopScript(config);
    } else if (config.environment === 'vps-hestia') {
      files['start-containers.sh'] = Templates.hestiaStartScript(config);
      files['stop-containers.sh'] = Templates.hestiaStopScript(config);
      files['hestia/container-proxy.tpl'] = Templates.hestiaProxyTpl(config);
      files['hestia/container-proxy.stpl'] = Templates.hestiaProxyStpl(config);
      files['hestia/install.sh'] = Templates.hestiaInstallScript(config);
    } else if (unixEnvs.includes(config.environment)) {
      files['start-containers.sh'] = Templates.unixStartScript(config);
      files['stop-containers.sh'] = Templates.unixStopScript(config);
    }

    // --- README ---
    files['README.md'] = Templates.readme(config);

    return files;
  },

  getLanguage(filename) {
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
    if (filename === 'Dockerfile' || filename.endsWith('/Dockerfile')) return 'dockerfile';
    if (filename.endsWith('.conf')) return 'nginx';
    if (filename.endsWith('.tpl') || filename.endsWith('.stpl')) return 'nginx';
    if (filename.endsWith('.env') || filename.endsWith('.env.local') || filename.endsWith('.env.example')) return 'ini';
    if (filename.endsWith('.sh')) return 'bash';
    if (filename.endsWith('.ps1')) return 'powershell';
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.php')) return 'php';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.java')) return 'java';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.properties')) return 'properties';
    if (filename.endsWith('.xml')) return 'xml';
    if (filename.endsWith('.txt')) return 'plaintext';
    if (filename === 'Caddyfile') return 'plaintext';
    if (filename === '.htaccess') return 'bash';
    return 'plaintext';
  }
};
