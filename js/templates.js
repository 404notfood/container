/* ========================================
   templates.js — File content templates
   ======================================== */

const Templates = {

  // ===================== SECURITY HELPERS =====================

  generateSecurePassword(length = 32) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}';
    let password = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    return password;
  },

  // Escape for XML/HTML
  escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  // Escape for JSON strings
  escapeJson(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  },

  // Escape for YAML strings (quote if needed)
  escapeYaml(unsafe) {
    if (!unsafe) return '""';
    // If contains special chars, quote it
    if (/[:#\[\]{}&*!|>'"@`-]/.test(unsafe)) {
      return `"${unsafe.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return unsafe;
  },

  // Cache for consistent passwords within a generation session
  _passwordCache: {},

  getPassword(key) {
    if (!this._passwordCache[key]) {
      this._passwordCache[key] = this.generateSecurePassword();
    }
    return this._passwordCache[key];
  },

  resetPasswordCache() {
    this._passwordCache = {};
  },

  // ===================== RUNTIME HELPERS =====================

  // Retourne le nom de la commande selon le runtime
  getCmd(config) {
    return config.runtime === 'docker' ? 'docker' : 'podman';
  },

  // Retourne la commande compose selon le runtime
  getComposeCmd(config) {
    return config.runtime === 'docker' ? 'docker compose' : 'podman-compose';
  },

  // Retourne la commande network exists selon le runtime
  getNetworkExistsCmd(config, networkName) {
    if (config.runtime === 'docker') {
      return `docker network inspect ${networkName}`;
    } else {
      return `podman network exists ${networkName}`;
    }
  },

  // Retourne la commande volume exists selon le runtime
  getVolumeExistsCmd(config, volumeName) {
    if (config.runtime === 'docker') {
      return `docker volume inspect ${volumeName}`;
    } else {
      return `podman volume exists ${volumeName}`;
    }
  },

  // ===================== COMPOSE SERVICES =====================

  composeHeader() {
    return `services:\n`;
  },

  composeNginx(config) {
    const ports = config.ssl !== 'none'
      ? `    ports:\n      - "80:80"\n      - "443:443"\n`
      : `    ports:\n      - "80:80"\n`;
    const volumes = [`      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro`];
    if (config.php) volumes.push(`      - ./src:/var/www/html`);
    if (config.python) volumes.push(`      - ./src:/app`);
    if (config.ssl === 'mkcert') volumes.push(`      - ./certs:/etc/nginx/certs:ro`);
    if (config.ssl === 'letsencrypt') {
      volumes.push(`      - ./certbot/conf:/etc/letsencrypt:ro`);
      volumes.push(`      - ./certbot/www:/var/www/certbot:ro`);
    }
    if (config.nginxSocket && config.php) volumes.push(`      - php-socket:/var/run/php`);
    const depends = [];
    if (config.php) depends.push('php');
    if (config.node) depends.push('node');
    if (config.python) depends.push('python');
    if (config.java) depends.push('java');
    let block = `  nginx:\n    image: nginx:alpine\n    container_name: \${PROJECT_NAME}-nginx\n`;
    block += ports;
    block += `    volumes:\n${volumes.join('\n')}\n`;
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composeApache(config) {
    const ports = config.ssl !== 'none'
      ? `    ports:\n      - "80:80"\n      - "443:443"\n`
      : `    ports:\n      - "80:80"\n`;
    const volumes = [
      `      - ./apache/vhost.conf:/usr/local/apache2/conf/extra/httpd-vhosts.conf:ro`,
      `      - ./src:/var/www/html`
    ];
    if (config.ssl === 'mkcert') volumes.push(`      - ./certs:/etc/apache2/certs:ro`);
    const depends = [];
    if (config.php) depends.push('php');
    if (config.node) depends.push('node');
    let block = `  apache:\n    image: httpd:2.4-alpine\n    container_name: \${PROJECT_NAME}-apache\n`;
    block += ports;
    block += `    volumes:\n${volumes.join('\n')}\n`;
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composeCaddy(config) {
    const volumes = [
      `      - ./Caddyfile:/etc/caddy/Caddyfile:ro`,
      `      - caddy-data:/data`,
      `      - caddy-config:/config`
    ];
    if (config.php) volumes.push(`      - ./src:/var/www/html`);
    const depends = [];
    if (config.php) depends.push('php');
    if (config.node) depends.push('node');
    if (config.python) depends.push('python');
    let block = `  caddy:\n    image: caddy:2-alpine\n    container_name: \${PROJECT_NAME}-caddy\n`;
    block += `    ports:\n      - "80:80"\n      - "443:443"\n`;
    block += `    volumes:\n${volumes.join('\n')}\n`;
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composeTraefik(config) {
    let block = `  traefik:\n    image: traefik:v3.0\n    container_name: \${PROJECT_NAME}-traefik\n`;
    block += `    ports:\n      - "80:80"\n      - "443:443"\n      - "8080:8080"\n`;
    block += `    volumes:\n`;
    block += `      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro\n`;
    block += `      - /var/run/docker.sock:/var/run/docker.sock:ro\n`;
    if (config.ssl === 'traefik-auto') block += `      - traefik-certs:/letsencrypt\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composePhp(config) {
    const volumes = [`      - ./src:/var/www/html`];
    if (config.nginxSocket) volumes.push(`      - php-socket:/var/run/php`);
    const depends = [];
    if (config.mysql) depends.push('mysql');
    if (config.mariadb) depends.push('mariadb');
    if (config.postgres) depends.push('postgres');
    if (config.redis) depends.push('redis');
    let block = `  php:\n    build:\n      context: ./php\n      dockerfile: Dockerfile\n    container_name: \${PROJECT_NAME}-php\n`;
    block += `    volumes:\n${volumes.join('\n')}\n`;
    if (config.mailpit) {
      block += `    environment:\n      - PHP_MAIL_HOST=mailpit\n      - PHP_MAIL_PORT=1025\n`;
    }
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composeNode(config) {
    const depends = [];
    if (config.mysql) depends.push('mysql');
    if (config.mariadb) depends.push('mariadb');
    if (config.postgres) depends.push('postgres');
    if (config.redis) depends.push('redis');
    if (config.mongo) depends.push('mongo');
    let ports = '';
    if (config.webserver === 'none') {
      ports = `    ports:\n      - "3000:3000"\n`;
    } else {
      ports = `    expose:\n      - "3000"\n`;
    }
    let block = `  node:\n    build:\n      context: ./node\n      dockerfile: Dockerfile\n    container_name: \${PROJECT_NAME}-node\n`;
    block += ports;
    block += `    volumes:\n      - ./src:/app\n      - node-modules:/app/node_modules\n`;
    block += `    environment:\n      - NODE_ENV=development\n`;
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composePython(config) {
    const depends = [];
    if (config.mysql) depends.push('mysql');
    if (config.mariadb) depends.push('mariadb');
    if (config.postgres) depends.push('postgres');
    if (config.redis) depends.push('redis');
    if (config.mongo) depends.push('mongo');
    let ports = '';
    if (config.webserver === 'none') {
      ports = `    ports:\n      - "8000:8000"\n`;
    } else {
      ports = `    expose:\n      - "8000"\n`;
    }
    let block = `  python:\n    build:\n      context: ./python\n      dockerfile: Dockerfile\n    container_name: \${PROJECT_NAME}-python\n`;
    block += ports;
    block += `    volumes:\n      - ./src:/app\n`;
    block += `    env_file:\n      - .env\n`;
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composeJava(config) {
    const depends = [];
    if (config.mysql) depends.push('mysql');
    if (config.mariadb) depends.push('mariadb');
    if (config.postgres) depends.push('postgres');
    if (config.redis) depends.push('redis');
    if (config.mongo) depends.push('mongo');
    let ports = '';
    if (config.webserver === 'none') {
      ports = `    ports:\n      - "8080:8080"\n`;
    } else {
      ports = `    expose:\n      - "8080"\n`;
    }
    let block = `  java:\n    build:\n      context: ./java\n      dockerfile: Dockerfile\n    container_name: \${PROJECT_NAME}-java\n`;
    block += ports;
    block += `    volumes:\n      - ./src:/app\n`;
    block += `    env_file:\n      - .env\n`;
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composeMysql() {
    return `  mysql:\n    image: mysql:\${MYSQL_VERSION}\n    container_name: \${PROJECT_NAME}-mysql\n    ports:\n      - "\${MYSQL_PORT:-3306}:3306"\n    environment:\n      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD}\n      MYSQL_DATABASE: \${MYSQL_DATABASE}\n      MYSQL_USER: \${MYSQL_USER}\n      MYSQL_PASSWORD: \${MYSQL_PASSWORD}\n    volumes:\n      - mysql-data:/var/lib/mysql\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeMariadb() {
    return `  mariadb:\n    image: mariadb:\${MARIADB_VERSION}\n    container_name: \${PROJECT_NAME}-mariadb\n    ports:\n      - "\${MARIADB_PORT:-3306}:3306"\n    environment:\n      MARIADB_ROOT_PASSWORD: \${MARIADB_ROOT_PASSWORD}\n      MARIADB_DATABASE: \${MARIADB_DATABASE}\n      MARIADB_USER: \${MARIADB_USER}\n      MARIADB_PASSWORD: \${MARIADB_PASSWORD}\n    volumes:\n      - mariadb-data:/var/lib/mysql\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composePostgres() {
    return `  postgres:\n    image: postgres:\${POSTGRES_VERSION}-alpine\n    container_name: \${PROJECT_NAME}-postgres\n    ports:\n      - "\${POSTGRES_PORT:-5432}:5432"\n    environment:\n      POSTGRES_DB: \${POSTGRES_DB}\n      POSTGRES_USER: \${POSTGRES_USER}\n      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}\n    volumes:\n      - postgres-data:/var/lib/postgresql/data\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeMongo() {
    return `  mongo:\n    image: mongo:\${MONGO_VERSION}\n    container_name: \${PROJECT_NAME}-mongo\n    ports:\n      - "\${MONGO_PORT:-27017}:27017"\n    environment:\n      MONGO_INITDB_ROOT_USERNAME: \${MONGO_USER}\n      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_PASSWORD}\n    volumes:\n      - mongo-data:/data/db\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeRedis() {
    return `  redis:\n    image: redis:7-alpine\n    container_name: \${PROJECT_NAME}-redis\n    command: redis-server --requirepass "\${REDIS_PASSWORD}"\n    ports:\n      - "\${REDIS_PORT:-6379}:6379"\n    environment:\n      - REDIS_PASSWORD=\${REDIS_PASSWORD}\n    volumes:\n      - redis-data:/data\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeMemcached() {
    return `  memcached:\n    image: memcached:1-alpine\n    container_name: \${PROJECT_NAME}-memcached\n    ports:\n      - "11211:11211"\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeRabbitmq() {
    return `  rabbitmq:\n    image: rabbitmq:3-management-alpine\n    container_name: \${PROJECT_NAME}-rabbitmq\n    ports:\n      - "5672:5672"\n      - "15672:15672"\n    environment:\n      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER:-guest}\n      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD:-guest}\n    volumes:\n      - rabbitmq-data:/var/lib/rabbitmq\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeAdminer() {
    return `  adminer:\n    image: adminer:latest\n    container_name: \${PROJECT_NAME}-adminer\n    ports:\n      - "\${ADMINER_PORT:-8081}:8080"\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composePhpmyadmin(config) {
    const host = config.mysql ? 'mysql' : (config.mariadb ? 'mariadb' : 'mysql');
    return `  phpmyadmin:\n    image: phpmyadmin:latest\n    container_name: \${PROJECT_NAME}-phpmyadmin\n    ports:\n      - "\${PMA_PORT:-8082}:80"\n    environment:\n      PMA_HOST: ${host}\n      # SECURITY: PMA_ARBITRARY removed for security. Only connect to configured host.\n      # If you need to connect to multiple hosts, use Adminer instead.\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composePgadmin() {
    return `  pgadmin:\n    image: dpage/pgadmin4:latest\n    container_name: \${PROJECT_NAME}-pgadmin\n    ports:\n      - "\${PGADMIN_PORT:-8083}:80"\n    environment:\n      PGADMIN_DEFAULT_EMAIL: \${PGADMIN_EMAIL:-admin@admin.com}\n      PGADMIN_DEFAULT_PASSWORD: \${PGADMIN_PASSWORD:-admin}\n    volumes:\n      - pgadmin-data:/var/lib/pgadmin\n    depends_on:\n      - postgres\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeMongoexpress() {
    return `  mongo-express:\n    image: mongo-express:latest\n    container_name: \${PROJECT_NAME}-mongo-express\n    ports:\n      - "\${MONGOEXPRESS_PORT:-8084}:8081"\n    environment:\n      ME_CONFIG_MONGODB_ADMINUSERNAME: \${MONGO_USER}\n      ME_CONFIG_MONGODB_ADMINPASSWORD: \${MONGO_PASSWORD}\n      ME_CONFIG_MONGODB_URL: mongodb://\${MONGO_USER}:\${MONGO_PASSWORD}@mongo:27017/\n      ME_CONFIG_BASICAUTH: true\n      ME_CONFIG_BASICAUTH_USERNAME: \${MONGOEXPRESS_USER:-admin}\n      ME_CONFIG_BASICAUTH_PASSWORD: \${MONGOEXPRESS_PASSWORD}\n    depends_on:\n      - mongo\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeMailpit() {
    return `  mailpit:\n    image: axllent/mailpit:latest\n    container_name: \${PROJECT_NAME}-mailpit\n    ports:\n      - "\${MAILPIT_SMTP:-1025}:1025"\n      - "\${MAILPIT_UI:-8025}:8025"\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeMinio() {
    return `  minio:\n    image: minio/minio:latest\n    container_name: \${PROJECT_NAME}-minio\n    ports:\n      - "9000:9000"\n      - "9001:9001"\n    environment:\n      MINIO_ROOT_USER: \${MINIO_USER:-minioadmin}\n      MINIO_ROOT_PASSWORD: \${MINIO_PASSWORD:-minioadmin}\n    volumes:\n      - minio-data:/data\n    command: server /data --console-address ":9001"\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeElasticsearch() {
    return `  elasticsearch:\n    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0\n    container_name: \${PROJECT_NAME}-elasticsearch\n    ports:\n      - "9200:9200"\n    environment:\n      - discovery.type=single-node\n      - xpack.security.enabled=true\n      - ELASTIC_PASSWORD=\${ELASTIC_PASSWORD}\n      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"\n    volumes:\n      - elasticsearch-data:/usr/share/elasticsearch/data\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeCertbot() {
    return `  certbot:\n    image: certbot/certbot:latest\n    container_name: \${PROJECT_NAME}-certbot\n    volumes:\n      - ./certbot/conf:/etc/letsencrypt\n      - ./certbot/www:/var/www/certbot\n    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \${!}; done;'"\n`;
  },

  composeVolumes(config) {
    const vols = [];
    if (config.mysql) vols.push('  mysql-data:');
    if (config.mariadb) vols.push('  mariadb-data:');
    if (config.postgres) vols.push('  postgres-data:');
    if (config.mongo) vols.push('  mongo-data:');
    if (config.redis) vols.push('  redis-data:');
    if (config.rabbitmq) vols.push('  rabbitmq-data:');
    if (config.minio) vols.push('  minio-data:');
    if (config.elasticsearch) vols.push('  elasticsearch-data:');
    if (config.pgadmin) vols.push('  pgadmin-data:');
    if (config.node) vols.push('  node-modules:');
    if (config.webserver === 'caddy') { vols.push('  caddy-data:'); vols.push('  caddy-config:'); }
    if (config.webserver === 'traefik' && config.ssl === 'traefik-auto') vols.push('  traefik-certs:');
    if (config.nginxSocket && config.php) vols.push('  php-socket:');
    if (vols.length === 0) return '';
    return `\nvolumes:\n${vols.join('\n')}\n`;
  },

  composeNetworks() {
    return `\nnetworks:\n  app-network:\n    driver: bridge\n`;
  },

  // ===================== DOCKERFILES =====================

  phpDockerfile(config) {
    const ver = config.phpVersion;
    const exts = config.phpExtensions || [];
    const installExts = exts.filter(e => !['redis', 'memcached', 'imagick', 'xdebug'].includes(e));
    const peclExts = exts.filter(e => ['redis', 'memcached', 'imagick', 'xdebug'].includes(e));

    let df = `FROM php:${ver}-fpm-alpine\n\n`;
    df += `# Install system dependencies\nRUN apk add --no-cache \\\n`;
    df += `    freetype-dev libjpeg-turbo-dev libpng-dev libzip-dev icu-dev \\\n`;
    df += `    oniguruma-dev libxml2-dev curl-dev autoconf g++ make\n\n`;

    if (installExts.length) {
      if (exts.includes('gd')) {
        df += `RUN docker-php-ext-configure gd --with-freetype --with-jpeg\n`;
      }
      df += `RUN docker-php-ext-install -j$(nproc) ${installExts.join(' ')}\n\n`;
    }

    if (peclExts.length) {
      for (const ext of peclExts) {
        df += `RUN pecl install ${ext} && docker-php-ext-enable ${ext}\n`;
      }
      df += '\n';
    }

    df += `# Install Composer\nCOPY --from=composer:latest /usr/bin/composer /usr/bin/composer\n\n`;

    if (config.nginxSocket) {
      df += `# PHP-FPM Unix socket\nRUN sed -i 's|listen = 127.0.0.1:9000|listen = /var/run/php/php-fpm.sock|' /usr/local/etc/php-fpm.d/www.conf \\\n    && sed -i 's|;listen.owner = www-data|listen.owner = www-data|' /usr/local/etc/php-fpm.d/www.conf \\\n    && sed -i 's|;listen.group = www-data|listen.group = www-data|' /usr/local/etc/php-fpm.d/www.conf \\\n    && mkdir -p /var/run/php\n\n`;
    }

    df += `WORKDIR /var/www/html\n\nEXPOSE 9000\nCMD ["php-fpm"]\n`;
    return df;
  },

  nodeDockerfile(config) {
    const ver = config.nodeVersion;

    if (ver === 'nvm') {
      const defaultVer = config.nvmDefault || '24';
      let df = `FROM ubuntu:22.04\n\nENV DEBIAN_FRONTEND=noninteractive\nENV NVM_DIR=/root/.nvm\n\n`;
      df += `RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*\n\n`;
      df += `# Install NVM\nRUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash\n\n`;
      df += `# Install default Node version\nRUN bash -c "source $NVM_DIR/nvm.sh && nvm install ${defaultVer} && nvm alias default ${defaultVer}"\n\n`;
      df += `WORKDIR /app\nCOPY package*.json ./\nRUN bash -c "source $NVM_DIR/nvm.sh && npm install"\nCOPY . .\n\n`;
      df += `EXPOSE 3000\nCMD ["bash", "-c", "source $NVM_DIR/nvm.sh && npm run dev"]\n`;
      return df;
    }

    let df = `FROM node:${ver}-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm install\n\nCOPY . .\n\n`;
    df += `EXPOSE 3000\nCMD ["npm", "run", "dev"]\n`;
    return df;
  },

  pythonDockerfile(config) {
    const pyVer = config.pythonVersionVal || '3.12';
    const fw = config.pythonFrameworkVal || 'custom';

    let df = `FROM python:${pyVer}-slim\n\nENV PYTHONDONTWRITEBYTECODE=1\nENV PYTHONUNBUFFERED=1\n\nWORKDIR /app\n\n`;
    df += `COPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY . .\n\n`;

    if (fw === 'django') {
      df += `EXPOSE 8000\nCMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]\n`;
    } else if (fw === 'flask') {
      df += `EXPOSE 8000\nCMD ["flask", "run", "--host=0.0.0.0", "--port=8000"]\n`;
    } else if (fw === 'fastapi') {
      df += `EXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]\n`;
    } else {
      df += `EXPOSE 8000\nCMD ["python", "main.py"]\n`;
    }
    return df;
  },

  javaDockerfile(config) {
    const javaVer = config.javaVersionVal || '21';
    const build = config.springBuildVal || 'maven';

    let df = '';
    if (build === 'gradle') {
      df += `FROM gradle:${javaVer === '17' ? '8-jdk17' : '8-jdk21'}-alpine AS build\nWORKDIR /app\nCOPY . .\nRUN gradle bootJar --no-daemon\n\n`;
      df += `FROM eclipse-temurin:${javaVer}-jre-alpine\nWORKDIR /app\nCOPY --from=build /app/build/libs/*.jar app.jar\n`;
    } else {
      df += `FROM maven:3.9-eclipse-temurin-${javaVer} AS build\nWORKDIR /app\nCOPY pom.xml .\nRUN mvn dependency:go-offline\nCOPY src ./src\nRUN mvn package -DskipTests\n\n`;
      df += `FROM eclipse-temurin:${javaVer}-jre-alpine\nWORKDIR /app\nCOPY --from=build /app/target/*.jar app.jar\n`;
    }
    df += `\nEXPOSE 8080\nCMD ["java", "-jar", "app.jar"]\n`;
    return df;
  },

  // ===================== WEB SERVER CONFIGS =====================

  // Helper: security headers block for Nginx
  _nginxSecurityHeaders(config) {
    let h = '';
    h += `    # --- Security Headers ---\n`;
    h += `    add_header X-Frame-Options "SAMEORIGIN" always;\n`;
    h += `    add_header X-Content-Type-Options "nosniff" always;\n`;
    h += `    add_header X-XSS-Protection "1; mode=block" always;\n`;
    h += `    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n`;
    h += `    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), picture-in-picture=(), sync-xhr=()" always;\n`;
    if (config.ssl !== 'none') {
      h += `    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\n`;
    }
    h += `    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;" always;\n`;
    h += `\n`;
    h += `    # --- Hide server info ---\n`;
    h += `    server_tokens off;\n`;
    h += `\n`;
    return h;
  },

  nginxConf(config) {
    let upstream = '';
    if (config.php) {
      upstream += config.nginxSocket
        ? `upstream php-fpm {\n    server unix:/var/run/php/php-fpm.sock;\n}\n\n`
        : `upstream php-fpm {\n    server php:9000;\n}\n\n`;
    }
    if (config.node) upstream += `upstream node-app {\n    server node:3000;\n}\n\n`;
    if (config.python) upstream += `upstream python-app {\n    server python:8000;\n}\n\n`;
    if (config.java) upstream += `upstream java-app {\n    server java:8080;\n}\n\n`;

    let server = '';
    if (config.ssl === 'mkcert') {
      server += `server {\n    listen 80;\n    server_name ${config.domain || 'localhost'};\n    return 301 https://$host$request_uri;\n}\n\nserver {\n    listen 443 ssl;\n    server_name ${config.domain || 'localhost'};\n\n    ssl_certificate /etc/nginx/certs/cert.pem;\n    ssl_certificate_key /etc/nginx/certs/key.pem;\n\n`;
    } else if (config.ssl === 'letsencrypt') {
      server += `server {\n    listen 80;\n    server_name ${config.domain || 'localhost'};\n    location /.well-known/acme-challenge/ { root /var/www/certbot; }\n    location / { return 301 https://$host$request_uri; }\n}\n\nserver {\n    listen 443 ssl;\n    server_name ${config.domain || 'localhost'};\n\n    ssl_certificate /etc/letsencrypt/live/${config.domain || 'localhost'}/fullchain.pem;\n    ssl_certificate_key /etc/letsencrypt/live/${config.domain || 'localhost'}/privkey.pem;\n\n`;
    } else {
      server += `server {\n    listen 80;\n    server_name ${config.domain || 'localhost'};\n\n`;
    }

    // Security headers
    server += this._nginxSecurityHeaders(config);

    // Preset Angular: serve static build
    if (config.preset === 'angular') {
      server += `    root /usr/share/nginx/html;\n    index index.html;\n\n`;
      server += `    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}\n`;
      return upstream + server;
    }

    server += `    root /var/www/html;\n    index index.php index.html;\n\n`;

    if (config.php) {
      server += `    location / {\n        try_files $uri $uri/ /index.php?$query_string;\n    }\n\n`;
      server += `    location ~ \\.php$ {\n        fastcgi_split_path_info ^(.+\\.php)(/.+)$;\n`;
      server += config.nginxSocket
        ? `        fastcgi_pass unix:/var/run/php/php-fpm.sock;\n`
        : `        fastcgi_pass php-fpm;\n`;
      server += `        fastcgi_index index.php;\n        include fastcgi_params;\n        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;\n        fastcgi_param PATH_INFO $fastcgi_path_info;\n    }\n\n`;
    }

    if (config.node) {
      const prefix = config.php ? '/api' : '/';
      server += `    location ${prefix} {\n        proxy_pass http://node-app;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n\n`;
    }

    if (config.python) {
      const prefix = config.php ? '/api' : '/';
      server += `    location ${prefix} {\n        proxy_pass http://python-app;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n\n`;
    }

    if (config.java) {
      const prefix = config.php ? '/api' : '/';
      server += `    location ${prefix} {\n        proxy_pass http://java-app;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n\n`;
    }

    if (!config.php && !config.node && !config.python && !config.java) {
      server += `    location / {\n        try_files $uri $uri/ =404;\n    }\n\n`;
    }

    server += `    # Deny access to hidden files (.env, .git, .htaccess, etc.)\n    location ~ /\\. {\n        deny all;\n        return 404;\n    }\n}\n`;
    return upstream + server;
  },

  apacheVhost(config) {
    let vhost = `<VirtualHost *:80>\n    ServerName ${config.domain || 'localhost'}\n    DocumentRoot /var/www/html\n\n`;
    vhost += `    <Directory /var/www/html>\n        Options -Indexes +FollowSymLinks\n        AllowOverride All\n        Require all granted\n    </Directory>\n\n`;
    if (config.php) {
      vhost += `    <FilesMatch \\.php$>\n        SetHandler "proxy:fcgi://php:9000"\n    </FilesMatch>\n\n`;
    }
    if (config.node) {
      const pfx = config.php ? '/api' : '/';
      vhost += `    ProxyPreserveHost On\n    ProxyPass ${pfx} http://node:3000${pfx}\n    ProxyPassReverse ${pfx} http://node:3000${pfx}\n\n`;
    }
    if (config.python) {
      const pfx = config.php ? '/api' : '/';
      vhost += `    ProxyPreserveHost On\n    ProxyPass ${pfx} http://python:8000${pfx}\n    ProxyPassReverse ${pfx} http://python:8000${pfx}\n\n`;
    }
    if (config.java) {
      const pfx = config.php ? '/api' : '/';
      vhost += `    ProxyPreserveHost On\n    ProxyPass ${pfx} http://java:8080${pfx}\n    ProxyPassReverse ${pfx} http://java:8080${pfx}\n\n`;
    }
    // Security headers
    vhost += `    # --- Security Headers ---\n`;
    vhost += `    Header always set X-Frame-Options "SAMEORIGIN"\n`;
    vhost += `    Header always set X-Content-Type-Options "nosniff"\n`;
    vhost += `    Header always set X-XSS-Protection "1; mode=block"\n`;
    vhost += `    Header always set Referrer-Policy "strict-origin-when-cross-origin"\n`;
    vhost += `    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), picture-in-picture=(), sync-xhr=()"\n`;
    if (config.ssl !== 'none') {
      vhost += `    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\n`;
    }
    vhost += `    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"\n`;
    vhost += `\n`;
    vhost += `    # Hide server info\n`;
    vhost += `    ServerSignature Off\n`;
    vhost += `    Header always unset X-Powered-By\n`;
    vhost += `\n`;
    vhost += `    # Deny access to hidden files (.env, .git, etc.)\n`;
    vhost += `    <DirectoryMatch "/\\.">\n        Require all denied\n    </DirectoryMatch>\n`;
    vhost += `\n`;

    vhost += `    ErrorLog /proc/self/fd/2\n    CustomLog /proc/self/fd/1 combined\n</VirtualHost>\n`;
    return vhost;
  },

  caddyfile(config) {
    const domain = config.domain || 'localhost';
    const useAutoSsl = config.ssl === 'caddy-auto' && config.domain;
    let cf = useAutoSsl ? '' : `{\n    auto_https off\n}\n\n`;
    cf += `${useAutoSsl ? domain : ':80'} {\n`;
    cf += `    root * /var/www/html\n`;
    if (config.php) cf += `    php_fastcgi php:9000\n`;
    if (config.node) cf += `    reverse_proxy ${config.php ? '/api/*' : '/*'} node:3000\n`;
    if (config.python) cf += `    reverse_proxy ${config.php ? '/api/*' : '/*'} python:8000\n`;
    if (config.java) cf += `    reverse_proxy ${config.php ? '/api/*' : '/*'} java:8080\n`;
    cf += `    file_server\n    encode gzip\n\n`;
    // Security headers
    cf += `    # Security Headers\n`;
    cf += `    header {\n`;
    cf += `        X-Frame-Options "SAMEORIGIN"\n`;
    cf += `        X-Content-Type-Options "nosniff"\n`;
    cf += `        X-XSS-Protection "1; mode=block"\n`;
    cf += `        Referrer-Policy "strict-origin-when-cross-origin"\n`;
    cf += `        Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), picture-in-picture=(), sync-xhr=()"\n`;
    if (config.ssl !== 'none') {
      cf += `        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"\n`;
    }
    cf += `        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"\n`;
    cf += `        -Server\n`;
    cf += `        -X-Powered-By\n`;
    cf += `    }\n\n`;
    // Deny hidden files
    cf += `    # Deny access to hidden files (.env, .git, etc.)\n`;
    cf += `    @hidden path */.*\n`;
    cf += `    respond @hidden 404\n`;
    cf += `}\n`;
    return cf;
  },

  traefikYml(config) {
    let yml = `# SECURITY WARNING: Dashboard is exposed on port 8080
# Access with credentials from .env file (TRAEFIK_DASHBOARD_USER / TRAEFIK_DASHBOARD_PASSWORD)
# Generate password hash: echo $(htpasswd -nB admin) | sed -e s/\\$/\\$\\$/g

api:\n  dashboard: true\n  # insecure: false - dashboard requires authentication\n\nentryPoints:\n  web:\n    address: ":80"\n`;
    if (config.ssl === 'traefik-auto') {
      yml += `    http:\n      redirections:\n        entryPoint:\n          to: websecure\n          scheme: https\n  websecure:\n    address: ":443"\n\ncertificatesResolvers:\n  letsencrypt:\n    acme:\n      email: \${ACME_EMAIL:-admin@${config.domain || 'example.com'}}\n      storage: /letsencrypt/acme.json\n      httpChallenge:\n        entryPoint: web\n`;
    } else {
      yml += `  websecure:\n    address: ":443"\n`;
    }
    yml += `\nproviders:\n  docker:\n    endpoint: "unix:///var/run/docker.sock"\n    exposedByDefault: false\n    network: app-network\n`;

    // Security headers middleware (file-based)
    yml += `\n# Security Headers Middleware (apply via labels on services)\n`;
    yml += `# Usage: add these labels to your service in docker-compose.yml:\n`;
    yml += `#   labels:\n`;
    yml += `#     - "traefik.http.middlewares.security-headers.headers.frameDeny=true"\n`;
    yml += `#     - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"\n`;
    yml += `#     - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"\n`;
    yml += `#     - "traefik.http.middlewares.security-headers.headers.referrerPolicy=strict-origin-when-cross-origin"\n`;
    yml += `#     - "traefik.http.middlewares.security-headers.headers.permissionsPolicy=camera=(), microphone=(), geolocation=()"\n`;
    if (config.ssl !== 'none') {
      yml += `#     - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"\n`;
      yml += `#     - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"\n`;
      yml += `#     - "traefik.http.middlewares.security-headers.headers.stsPreload=true"\n`;
    }
    yml += `#     - "traefik.http.middlewares.security-headers.headers.contentSecurityPolicy=default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';"\n`;
    yml += `#     - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Powered-By="\n`;

    return yml;
  },

  // ===================== ENV FILE =====================

  envFile(config) {
    const dbName = config.projectName.replace(/-/g, '_');
    let env = `# Project\nPROJECT_NAME=${config.projectName}\n\n`;

    env += `# SECURITY WARNING:\n# Change all passwords below before deploying to production!\n# These are randomly generated secure passwords.\n\n`;

    if (config.mysql) {
      env += `# MySQL\nMYSQL_VERSION=${config.mysqlVersion}\nMYSQL_ROOT_PASSWORD=${this.getPassword('mysql_root')}\nMYSQL_DATABASE=${dbName}\nMYSQL_USER=appuser\nMYSQL_PASSWORD=${this.getPassword('mysql_user')}\nMYSQL_PORT=3306\n\n`;
    }
    if (config.mariadb) {
      env += `# MariaDB\nMARIADB_VERSION=${config.mariadbVersion}\nMARIADB_ROOT_PASSWORD=${this.getPassword('mariadb_root')}\nMARIADB_DATABASE=${dbName}\nMARIADB_USER=appuser\nMARIADB_PASSWORD=${this.getPassword('mariadb_user')}\nMARIADB_PORT=3306\n\n`;
    }
    if (config.postgres) {
      env += `# PostgreSQL\nPOSTGRES_VERSION=${config.postgresVersion}\nPOSTGRES_DB=${dbName}\nPOSTGRES_USER=appuser\nPOSTGRES_PASSWORD=${this.getPassword('postgres_user')}\nPOSTGRES_PORT=5432\n\n`;
    }
    if (config.mongo) {
      env += `# MongoDB\nMONGO_VERSION=${config.mongoVersion}\nMONGO_USER=admin\nMONGO_PASSWORD=${this.getPassword('mongo_admin')}\nMONGO_PORT=27017\n\n`;
    }
    if (config.redis) {
      env += `# Redis\nREDIS_PASSWORD=${this.getPassword('redis')}\nREDIS_PORT=6379\n\n`;
    }
    if (config.rabbitmq) {
      env += `# RabbitMQ\nRABBITMQ_USER=admin\nRABBITMQ_PASSWORD=${this.getPassword('rabbitmq')}\n\n`;
    }
    if (config.minio) {
      env += `# MinIO\nMINIO_USER=minioadmin\nMINIO_PASSWORD=${this.getPassword('minio')}\n\n`;
    }
    if (config.adminer) env += `# Adminer\nADMINER_PORT=8081\n\n`;
    if (config.phpmyadmin) env += `# phpMyAdmin\nPMA_PORT=8082\n\n`;
    if (config.pgadmin) {
      env += `# pgAdmin\nPGADMIN_PORT=8083\nPGADMIN_EMAIL=admin@admin.com\nPGADMIN_PASSWORD=${this.getPassword('pgadmin')}\n\n`;
    }
    if (config.mongoexpress) {
      env += `# Mongo Express\nMONGOEXPRESS_PORT=8084\nMONGOEXPRESS_USER=admin\nMONGOEXPRESS_PASSWORD=${this.getPassword('mongoexpress')}\n\n`;
    }
    if (config.mailpit) env += `# Mailpit\nMAILPIT_SMTP=1025\nMAILPIT_UI=8025\n\n`;
    if (config.elasticsearch) {
      env += `# Elasticsearch\nELASTIC_PASSWORD=${this.getPassword('elasticsearch')}\n\n`;
    }
    if (config.ssl === 'traefik-auto' || config.webserver === 'traefik') {
      env += `# Traefik\n`;
      if (config.ssl === 'traefik-auto') {
        env += `ACME_EMAIL=admin@${config.domain || 'example.com'}\n`;
      }
      env += `# Dashboard credentials\nTRAEFIK_DASHBOARD_USER=admin\nTRAEFIK_DASHBOARD_PASSWORD=${this.getPassword('traefik_dashboard')}\n`;
      env += `# Generate htpasswd hash: echo $(htpasswd -nB admin) | sed -e s/\\$/\\$\\$/g\n\n`;
    }
    return env;
  },

  // ===================== PRESET-SPECIFIC FILES =====================

  // ---- WordPress wp-config.php ----
  wpConfig(config) {
    const dbHost = config.mysql ? 'mysql' : 'mariadb';
    const dbEnvPrefix = config.mysql ? 'MYSQL' : 'MARIADB';
    return `<?php
/**
 * WordPress configuration — generated by Docker Stack Generator
 */

// Database settings
define( 'DB_NAME',     getenv('${dbEnvPrefix}_DATABASE') ?: '${config.projectName.replace(/-/g, '_')}' );
define( 'DB_USER',     getenv('${dbEnvPrefix}_USER') ?: 'appuser' );
define( 'DB_PASSWORD', getenv('${dbEnvPrefix}_PASSWORD') );
define( 'DB_HOST',     '${dbHost}' );
define( 'DB_CHARSET',  'utf8mb4' );
define( 'DB_COLLATE',  '' );

// Authentication unique keys and salts
// SECURITY: Generate new keys at: https://api.wordpress.org/secret-key/1.1/salt/
define( 'AUTH_KEY',         '${this.generateSecurePassword(64)}' );
define( 'SECURE_AUTH_KEY',  '${this.generateSecurePassword(64)}' );
define( 'LOGGED_IN_KEY',    '${this.generateSecurePassword(64)}' );
define( 'NONCE_KEY',        '${this.generateSecurePassword(64)}' );
define( 'AUTH_SALT',        '${this.generateSecurePassword(64)}' );
define( 'SECURE_AUTH_SALT', '${this.generateSecurePassword(64)}' );
define( 'LOGGED_IN_SALT',   '${this.generateSecurePassword(64)}' );
define( 'NONCE_SALT',       '${this.generateSecurePassword(64)}' );

$table_prefix = 'wp_';

// Site URL
define( 'WP_HOME',    '${config.ssl !== 'none' ? 'https' : 'http'}://${config.domain || 'localhost'}' );
define( 'WP_SITEURL', '${config.ssl !== 'none' ? 'https' : 'http'}://${config.domain || 'localhost'}' );

// Debug
define( 'WP_DEBUG',     true );
define( 'WP_DEBUG_LOG', true );

// SMTP via Mailpit
${config.mailpit ? "define( 'WPMS_ON',                true );\ndefine( 'WPMS_SMTP_HOST',        'mailpit' );\ndefine( 'WPMS_SMTP_PORT',        1025 );\ndefine( 'WPMS_SSL',              '' );\ndefine( 'WPMS_SMTP_AUTH',        false );" : '// Enable Mailpit in tools section for email testing'}

// Filesystem
define( 'FS_METHOD', 'direct' );

// Memory
define( 'WP_MEMORY_LIMIT', '256M' );

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
`;
  },

  // ---- Laravel .env ----
  laravelEnv(config) {
    let dbConnection = 'mysql';
    let dbHost = 'mysql';
    let dbPort = '3306';
    let dbDatabase = config.projectName.replace(/-/g, '_');
    const dbUser = 'appuser';
    let dbPass;
    if (config.postgres) {
      dbConnection = 'pgsql'; dbHost = 'postgres'; dbPort = '5432';
      dbPass = this.getPassword('postgres_user');
    } else if (config.mariadb) {
      dbConnection = 'mariadb'; dbHost = 'mariadb';
      dbPass = this.getPassword('mariadb_user');
    } else {
      dbPass = this.getPassword('mysql_user');
    }

    const starter = config.laravelStarter || 'none';
    const hasFrontend = starter !== 'none';

    // Generate Laravel APP_KEY (base64 encoded 32 bytes)
    const appKeyRaw = this.generateSecurePassword(32);
    const appKeyBase64 = btoa(appKeyRaw);

    return `APP_NAME="${config.projectName}"
APP_ENV=local
APP_KEY=base64:${appKeyBase64}
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=${config.ssl !== 'none' ? 'https' : 'http'}://${config.domain || 'localhost'}

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=${dbConnection}
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_DATABASE=${dbDatabase}
DB_USERNAME=${dbUser}
DB_PASSWORD=${dbPass}

SESSION_DRIVER=redis
SESSION_LIFETIME=120

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis

CACHE_STORE=redis
CACHE_PREFIX=${config.projectName.replace(/-/g, '_')}_cache

REDIS_HOST=redis
REDIS_PASSWORD=${this.getPassword('redis')}
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=${config.mailpit ? 'mailpit' : '127.0.0.1'}
MAIL_PORT=${config.mailpit ? '1025' : '2525'}
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@${config.domain || 'example.com'}"
MAIL_FROM_NAME="\${APP_NAME}"

${config.minio ? `AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=${this.getPassword('minio')}
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=${config.projectName.replace(/-/g, '-')}-bucket
AWS_ENDPOINT=http://minio:9000
AWS_USE_PATH_STYLE_ENDPOINT=true` : ''}

${hasFrontend ? `VITE_APP_NAME="\${APP_NAME}"` : ''}
`;
  },

  // ---- Symfony .env ----
  symfonyEnv(config) {
    let dbUrl = '';
    if (config.postgres) {
      dbUrl = `postgresql://appuser:apppassword@postgres:5432/${config.projectName.replace(/-/g, '_')}?serverVersion=${config.postgresVersion}&charset=utf8`;
    } else if (config.mariadb) {
      dbUrl = `mysql://appuser:apppassword@mariadb:3306/${config.projectName.replace(/-/g, '_')}?serverVersion=mariadb-${config.mariadbVersion}`;
    } else {
      dbUrl = `mysql://appuser:apppassword@mysql:3306/${config.projectName.replace(/-/g, '_')}?serverVersion=${config.mysqlVersion}`;
    }

    return `# Symfony ${config.symfonyVersion || '7.2'} — generated by Docker Stack Generator

APP_ENV=dev
APP_SECRET=CHANGE_ME_WITH_A_RANDOM_SECRET
APP_DEBUG=1

# Database
DATABASE_URL="${dbUrl}"

# Messenger (async)
MESSENGER_TRANSPORT_DSN=${config.redis ? 'redis://redis:6379/messages' : 'doctrine://default?auto_setup=0'}

${config.redis ? '# Redis\nREDIS_URL=redis://redis:6379' : ''}

# Mailer
MAILER_DSN=${config.mailpit ? 'smtp://mailpit:1025' : 'null://null'}

# CORS
CORS_ALLOW_ORIGIN='^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?$'
`;
  },

  // ---- Next.js .env.local ----
  nextjsEnvLocal(config) {
    let env = `# Next.js — generated by Docker Stack Generator\n\n`;
    env += `NEXT_PUBLIC_APP_NAME="${config.projectName}"\n`;
    env += `NEXT_PUBLIC_APP_URL=${config.ssl !== 'none' ? 'https' : 'http'}://${config.domain || 'localhost:3000'}\n\n`;

    if (config.postgres) {
      env += `DATABASE_URL="postgresql://appuser:apppassword@postgres:5432/${config.projectName.replace(/-/g, '_')}"\n`;
    } else if (config.mysql) {
      env += `DATABASE_URL="mysql://appuser:apppassword@mysql:3306/${config.projectName.replace(/-/g, '_')}"\n`;
    } else if (config.mongo) {
      env += `MONGODB_URI="mongodb://admin:adminpassword@mongo:27017/${config.projectName.replace(/-/g, '_')}?authSource=admin"\n`;
    }

    if (config.redis) env += `REDIS_URL="redis://redis:6379"\n`;

    env += `\n# Auth (NextAuth.js)\nNEXTAUTH_URL=${config.ssl !== 'none' ? 'https' : 'http'}://${config.domain || 'localhost:3000'}\nNEXTAUTH_SECRET=CHANGE_ME_GENERATE_WITH_OPENSSL\n`;
    return env;
  },

  // ---- Nest.js .env ----
  nestjsEnv(config) {
    const orm = config.nestjsOrm || 'typeorm';
    let env = `# NestJS — generated by Docker Stack Generator\n\n`;
    env += `NODE_ENV=development\nPORT=3000\n\n`;

    if (config.postgres && orm !== 'mongoose') {
      env += `# Database (PostgreSQL)\nDB_TYPE=postgres\nDB_HOST=postgres\nDB_PORT=5432\nDB_USERNAME=appuser\nDB_PASSWORD=apppassword\nDB_DATABASE=${config.projectName.replace(/-/g, '_')}\nDB_SYNCHRONIZE=true\n\n`;
    } else if (config.mysql && orm !== 'mongoose') {
      env += `# Database (MySQL)\nDB_TYPE=mysql\nDB_HOST=mysql\nDB_PORT=3306\nDB_USERNAME=appuser\nDB_PASSWORD=apppassword\nDB_DATABASE=${config.projectName.replace(/-/g, '_')}\nDB_SYNCHRONIZE=true\n\n`;
    } else if (config.mongo) {
      env += `# MongoDB\nMONGODB_URI=mongodb://admin:adminpassword@mongo:27017/${config.projectName.replace(/-/g, '_')}?authSource=admin\n\n`;
    }

    if (config.redis) env += `# Redis\nREDIS_HOST=redis\nREDIS_PORT=6379\n\n`;
    env += `# JWT\nJWT_SECRET=CHANGE_ME\nJWT_EXPIRES_IN=3600s\n`;
    return env;
  },

  // ---- Django settings snippet (.env) ----
  djangoEnv(config) {
    let dbUrl = '';
    if (config.postgres) {
      dbUrl = `postgres://appuser:apppassword@postgres:5432/${config.projectName.replace(/-/g, '_')}`;
    } else if (config.mysql || config.mariadb) {
      const host = config.mysql ? 'mysql' : 'mariadb';
      dbUrl = `mysql://appuser:apppassword@${host}:3306/${config.projectName.replace(/-/g, '_')}`;
    }

    return `# Django ${config.djangoVersion || '5.1'} — generated by Docker Stack Generator

DEBUG=True
SECRET_KEY=change-me-to-a-long-random-string
ALLOWED_HOSTS=localhost,127.0.0.1,${config.domain || ''}

# Database
DATABASE_URL=${dbUrl}

${config.redis ? '# Redis / Cache\nREDIS_URL=redis://redis:6379/0\nCACHE_URL=redis://redis:6379/1' : ''}

# Email
${config.mailpit ? 'EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend\nEMAIL_HOST=mailpit\nEMAIL_PORT=1025' : 'EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend'}

# Static & Media
STATIC_URL=/static/
MEDIA_URL=/media/

${config.minio ? `# MinIO / S3\nAWS_ACCESS_KEY_ID=minioadmin\nAWS_SECRET_ACCESS_KEY=minioadmin\nAWS_STORAGE_BUCKET_NAME=${config.projectName}-media\nAWS_S3_ENDPOINT_URL=http://minio:9000` : ''}
`;
  },

  djangoRequirements(config) {
    let reqs = `Django>=${config.djangoVersion || '5.1'},<${parseFloat(config.djangoVersion || '5.1') + 0.1}\ngunicorn>=21.2.0\n`;
    if (config.postgres) reqs += `psycopg2-binary>=2.9\n`;
    if (config.mysql || config.mariadb) reqs += `mysqlclient>=2.2\n`;
    if (config.redis) reqs += `django-redis>=5.4\nredis>=5.0\n`;
    reqs += `dj-database-url>=2.1\npython-decouple>=3.8\nwhitenoise>=6.5\n`;
    if (config.minio) reqs += `django-storages>=1.14\nboto3>=1.34\n`;
    return reqs;
  },

  // ---- Flask .env ----
  flaskEnv(config) {
    let env = `# Flask — generated by Docker Stack Generator\n\n`;
    env += `FLASK_APP=app\nFLASK_ENV=development\nFLASK_DEBUG=1\nSECRET_KEY=change-me\n\n`;

    if (config.postgres) {
      env += `DATABASE_URL=postgresql://appuser:apppassword@postgres:5432/${config.projectName.replace(/-/g, '_')}\n`;
    } else if (config.mysql || config.mariadb) {
      const host = config.mysql ? 'mysql' : 'mariadb';
      env += `DATABASE_URL=mysql+pymysql://appuser:apppassword@${host}:3306/${config.projectName.replace(/-/g, '_')}\n`;
    } else if (config.mongo) {
      env += `MONGODB_URI=mongodb://admin:adminpassword@mongo:27017/${config.projectName.replace(/-/g, '_')}?authSource=admin\n`;
    }

    if (config.redis) env += `REDIS_URL=redis://redis:6379/0\n`;
    if (config.mailpit) env += `\nMAIL_SERVER=mailpit\nMAIL_PORT=1025\nMAIL_USE_TLS=False\n`;
    return env;
  },

  flaskRequirements(config) {
    let reqs = `Flask>=3.0\npython-dotenv>=1.0\n`;
    if (config.postgres) reqs += `Flask-SQLAlchemy>=3.1\npsycopg2-binary>=2.9\n`;
    if (config.mysql || config.mariadb) reqs += `Flask-SQLAlchemy>=3.1\nPyMySQL>=1.1\n`;
    if (config.mongo) reqs += `Flask-PyMongo>=2.3\n`;
    if (config.redis) reqs += `Flask-Caching>=2.1\nredis>=5.0\n`;
    if (config.mailpit) reqs += `Flask-Mail>=0.9\n`;
    return reqs;
  },

  // ---- Spring Boot application.properties ----
  springProperties(config) {
    const name = config.projectName.replace(/-/g, '');
    let props = `# Spring Boot — generated by Docker Stack Generator\n\nspring.application.name=${config.projectName}\nserver.port=8080\n\n`;

    if (config.postgres) {
      props += `# PostgreSQL\nspring.datasource.url=jdbc:postgresql://postgres:5432/${config.projectName.replace(/-/g, '_')}\nspring.datasource.username=appuser\nspring.datasource.password=apppassword\nspring.datasource.driver-class-name=org.postgresql.Driver\nspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect\n`;
    } else if (config.mysql || config.mariadb) {
      const host = config.mysql ? 'mysql' : 'mariadb';
      const driver = config.mariadb ? 'org.mariadb.jdbc.Driver' : 'com.mysql.cj.jdbc.Driver';
      const dialect = config.mariadb ? 'org.hibernate.dialect.MariaDBDialect' : 'org.hibernate.dialect.MySQLDialect';
      props += `# ${config.mariadb ? 'MariaDB' : 'MySQL'}\nspring.datasource.url=jdbc:mysql://${host}:3306/${config.projectName.replace(/-/g, '_')}\nspring.datasource.username=appuser\nspring.datasource.password=apppassword\nspring.datasource.driver-class-name=${driver}\nspring.jpa.database-platform=${dialect}\n`;
    } else if (config.mongo) {
      props += `# MongoDB\nspring.data.mongodb.uri=mongodb://admin:adminpassword@mongo:27017/${config.projectName.replace(/-/g, '_')}?authSource=admin\n`;
    }

    props += `\nspring.jpa.hibernate.ddl-auto=update\nspring.jpa.show-sql=true\n`;

    if (config.redis) {
      props += `\n# Redis\nspring.data.redis.host=redis\nspring.data.redis.port=6379\n`;
    }

    if (config.mailpit) {
      props += `\n# Mail (Mailpit)\nspring.mail.host=mailpit\nspring.mail.port=1025\nspring.mail.properties.mail.smtp.auth=false\nspring.mail.properties.mail.smtp.starttls.enable=false\n`;
    }

    return props;
  },

  springPomXml(config) {
    const deps = [];
    deps.push(`        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-web</artifactId>\n        </dependency>`);

    if (config.postgres || config.mysql || config.mariadb) {
      deps.push(`        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-data-jpa</artifactId>\n        </dependency>`);
    }
    if (config.postgres) {
      deps.push(`        <dependency>\n            <groupId>org.postgresql</groupId>\n            <artifactId>postgresql</artifactId>\n            <scope>runtime</scope>\n        </dependency>`);
    }
    if (config.mysql) {
      deps.push(`        <dependency>\n            <groupId>com.mysql</groupId>\n            <artifactId>mysql-connector-j</artifactId>\n            <scope>runtime</scope>\n        </dependency>`);
    }
    if (config.mariadb) {
      deps.push(`        <dependency>\n            <groupId>org.mariadb.jdbc</groupId>\n            <artifactId>mariadb-java-client</artifactId>\n            <scope>runtime</scope>\n        </dependency>`);
    }
    if (config.mongo) {
      deps.push(`        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-data-mongodb</artifactId>\n        </dependency>`);
    }
    if (config.redis) {
      deps.push(`        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-data-redis</artifactId>\n        </dependency>`);
    }
    if (config.mailpit) {
      deps.push(`        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-mail</artifactId>\n        </dependency>`);
    }
    deps.push(`        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-test</artifactId>\n            <scope>test</scope>\n        </dependency>`);

    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.0</version>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>${this.escapeXml(config.projectName)}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${this.escapeXml(config.projectName)}</name>
    <properties>
        <java.version>${config.javaVersionVal || '21'}</java.version>
    </properties>
    <dependencies>
${deps.join('\n')}
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`;
  },

  // ---- Angular environment.ts ----
  angularEnvironment(config) {
    return `export const environment = {
  production: false,
  appName: '${config.projectName}',
  apiUrl: '${config.ssl !== 'none' ? 'https' : 'http'}://${config.domain || 'localhost'}/api'
};
`;
  },

  angularDockerfile(config) {
    const nodeVer = config.nodeVersion !== 'nvm' ? config.nodeVersion : '24';
    return `# Build stage
FROM node:${nodeVer}-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
  },

  // ===================== GENERIC FILES =====================

  indexPhp() {
    return `<?php\nphpinfo();\n`;
  },

  indexHtml(config) {
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${config.projectName}</title>\n  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;color:#eee;margin:0;}h1{font-size:2rem;}</style>\n</head>\n<body>\n  <h1>${config.projectName} is running!</h1>\n</body>\n</html>\n`;
  },

  mkcertScript() {
    return `#!/bin/bash\n# Generate SSL certificates for local development\n# Requires mkcert: https://github.com/FiloSottile/mkcert\n\nmkcert -install\nmkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 ::1\n\necho "Certificates generated!"\n`;
  },

  // ===================== INIT SCRIPT =====================

  initScript(config) {
    // Escape shell variables to prevent injection
    const escapeShell = (str) => {
      if (!str) return '';
      // Replace single quotes with '\'' pattern (close quote, escaped quote, open quote)
      return str.replace(/'/g, "'\\''");
    };

    const projectName = escapeShell(config.projectName);
    const gitRepoUrl = escapeShell(config.gitRepoUrl);
    const gitBranch = escapeShell(config.gitBranch || 'main');
    const preset = config.preset || 'none';

    // Determine which container services are expected
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
  },

  // ===================== README =====================

  readme(config) {
    const runtimeName = config.runtime === 'docker' ? 'Docker' : 'Podman';
    const composeCmd = this.getComposeCmd(config);

    let md = `# ${config.projectName}\n\nStack ${runtimeName} generated by **Container Stack Generator**.\n\n`;
    md += `**Runtime:** ${runtimeName}\n\n`;

    if (config.preset && config.preset !== 'none') {
      const presetNames = {
        wordpress: 'WordPress', laravel: 'Laravel', symfony: 'Symfony',
        nextjs: 'Next.js', nestjs: 'NestJS', angular: 'Angular',
        django: 'Django', flask: 'Flask', springboot: 'Spring Boot'
      };
      md += `**Preset:** ${presetNames[config.preset] || config.preset}\n\n`;
    }

    md += `## Services\n\n`;
    const services = [];
    if (config.webserver !== 'none') services.push(`- **${config.webserver.charAt(0).toUpperCase() + config.webserver.slice(1)}** (web server)`);
    if (config.php) services.push(`- **PHP-FPM ${config.phpVersion}**`);
    if (config.node) services.push(`- **Node.js ${config.nodeVersion === 'nvm' ? '(NVM)' : config.nodeVersion}**`);
    if (config.python) services.push(`- **Python ${config.pythonVersionVal || '3.12'}**`);
    if (config.java) services.push(`- **Java ${config.javaVersionVal || '21'}** (Spring Boot)`);
    if (config.mysql) services.push(`- **MySQL ${config.mysqlVersion}**`);
    if (config.mariadb) services.push(`- **MariaDB ${config.mariadbVersion}**`);
    if (config.postgres) services.push(`- **PostgreSQL ${config.postgresVersion}**`);
    if (config.mongo) services.push(`- **MongoDB ${config.mongoVersion}**`);
    if (config.redis) services.push('- **Redis 7**');
    if (config.memcached) services.push('- **Memcached**');
    if (config.rabbitmq) services.push('- **RabbitMQ**');
    if (config.adminer) services.push('- **Adminer** (:8081)');
    if (config.phpmyadmin) services.push('- **phpMyAdmin** (:8082)');
    if (config.pgadmin) services.push('- **pgAdmin** (:8083)');
    if (config.mongoexpress) services.push('- **Mongo Express** (:8084)');
    if (config.mailpit) services.push('- **Mailpit** (SMTP :1025, UI :8025)');
    if (config.minio) services.push('- **MinIO** (API :9000, Console :9001)');
    if (config.elasticsearch) services.push('- **Elasticsearch 8** (:9200)');
    md += services.join('\n') + '\n';

    // Environment-specific instructions
    md += `\n## Environnement de développement\n\n`;

    const envDocs = {
      'windows-laragon': {
        name: 'Windows + Laragon',
        desc: 'Le SSL est géré automatiquement par Laragon. Les containers Podman n\'ont pas besoin de certificats SSL.',
        scriptType: 'powershell',
        url: `https://${config.projectName}.test`,
        note: 'Le certificat SSL est généré automatiquement par Laragon'
      },
      'windows-herd': {
        name: 'Windows + Herd',
        desc: 'Le SSL est géré automatiquement par Herd. Les containers Podman n\'ont pas besoin de certificats SSL.',
        scriptType: 'powershell',
        url: `https://${config.projectName}.test`,
        note: 'Le certificat SSL est généré automatiquement par Herd'
      },
      'windows-xampp': {
        name: 'Windows + XAMPP',
        desc: 'Configurez Apache/Nginx de XAMPP pour faire proxy vers les containers Podman.',
        scriptType: 'powershell',
        url: `http://localhost/${config.projectName}`,
        note: 'Configurez un VirtualHost dans httpd-vhosts.conf pour le SSL',
        extraSetup: `\n### Configuration XAMPP\n\n1. Éditez \`C:\\xampp\\apache\\conf\\extra\\httpd-vhosts.conf\`:\n\`\`\`apache\n<VirtualHost *:80>\n    ServerName ${config.projectName}.local\n    ProxyPreserveHost On\n    ProxyPass / http://localhost:80/\n    ProxyPassReverse / http://localhost:80/\n</VirtualHost>\n\`\`\`\n\n2. Redémarrez Apache depuis le panneau XAMPP\n`
      },
      'windows-wamp': {
        name: 'Windows + WAMP',
        desc: 'Configurez Apache de WAMP pour faire proxy vers les containers Podman.',
        scriptType: 'powershell',
        url: `http://localhost/${config.projectName}`,
        note: 'Configurez un VirtualHost dans httpd-vhosts.conf pour le SSL',
        extraSetup: `\n### Configuration WAMP\n\n1. Éditez \`C:\\wamp64\\bin\\apache\\apache2.x.x\\conf\\extra\\httpd-vhosts.conf\`:\n\`\`\`apache\n<VirtualHost *:80>\n    ServerName ${config.projectName}.local\n    ProxyPreserveHost On\n    ProxyPass / http://localhost:80/\n    ProxyPassReverse / http://localhost:80/\n</VirtualHost>\n\`\`\`\n\n2. Redémarrez Apache depuis l'icône WAMP\n`
      },
      'mac-mamp': {
        name: 'macOS + MAMP',
        desc: 'Configurez Apache/Nginx de MAMP pour faire proxy vers les containers Podman.',
        scriptType: 'bash',
        url: `http://localhost:8888/${config.projectName}`,
        note: 'Par défaut MAMP écoute sur le port 8888',
        extraSetup: `\n### Configuration MAMP\n\n1. Éditez \`/Applications/MAMP/conf/apache/httpd.conf\`:\n\`\`\`apache\n<VirtualHost *:8888>\n    ServerName ${config.projectName}.local\n    ProxyPreserveHost On\n    ProxyPass / http://localhost:80/\n    ProxyPassReverse / http://localhost:80/\n</VirtualHost>\n\`\`\`\n\n2. Redémarrez les serveurs MAMP\n`
      },
      'linux-lamp': {
        name: 'Linux + LAMP',
        desc: 'Configurez Apache/Nginx du système pour faire proxy vers les containers Podman.',
        scriptType: 'bash',
        url: `http://localhost/${config.projectName}`,
        note: 'Configurez un VirtualHost Apache/Nginx pour le SSL',
        extraSetup: `\n### Configuration LAMP (Apache)\n\n1. Créez \`/etc/apache2/sites-available/${config.projectName}.conf\`:\n\`\`\`apache\n<VirtualHost *:80>\n    ServerName ${config.projectName}.local\n    ProxyPreserveHost On\n    ProxyPass / http://localhost:80/\n    ProxyPassReverse / http://localhost:80/\n</VirtualHost>\n\`\`\`\n\n2. Activez le site:\n\`\`\`bash\nsudo a2ensite ${config.projectName}\nsudo systemctl reload apache2\n\`\`\`\n`
      },
      'linux-local': {
        name: 'Linux standalone',
        desc: 'Le SSL est géré directement par les containers Podman.',
        scriptType: 'bash',
        url: config.ssl !== 'none' ? `https://${config.domain || 'localhost'}` : `http://${config.domain || 'localhost'}`,
        note: config.ssl === 'mkcert' ? 'SSL via mkcert' : config.ssl === 'letsencrypt' ? 'SSL via Let\'s Encrypt' : '',
        sslSetup: config.ssl === 'mkcert' ? `\n### Configuration SSL (mkcert)\n\nLe script de démarrage génère automatiquement les certificats SSL via mkcert.\n\nSi vous devez le faire manuellement:\n\`\`\`bash\nmkcert -install\ncd certs\nmkcert ${config.domain || 'localhost'}\ncd ..\n\`\`\`\n` : ''
      },
      'mac-local': {
        name: 'macOS standalone',
        desc: 'Le SSL est géré directement par les containers Podman.',
        scriptType: 'bash',
        url: config.ssl !== 'none' ? `https://${config.domain || 'localhost'}` : `http://${config.domain || 'localhost'}`,
        note: config.ssl === 'mkcert' ? 'SSL via mkcert' : config.ssl === 'letsencrypt' ? 'SSL via Let\'s Encrypt' : '',
        sslSetup: config.ssl === 'mkcert' ? `\n### Configuration SSL (mkcert)\n\nLe script de démarrage génère automatiquement les certificats SSL via mkcert.\n\nSi vous devez le faire manuellement:\n\`\`\`bash\nmkcert -install\ncd certs\nmkcert ${config.domain || 'localhost'}\ncd ..\n\`\`\`\n` : ''
      }
    };

    const envDoc = envDocs[config.environment] || envDocs['linux-local'];

    md += `**${envDoc.name}**\n\n${envDoc.desc}\n\n`;

    if (envDoc.scriptType === 'powershell') {
      md += `### Démarrage\n\n\`\`\`powershell\n.\\start-containers.ps1\n\`\`\`\n\n`;
      md += `### Arrêt\n\n\`\`\`powershell\n.\\stop-containers.ps1\n\`\`\`\n\n`;
    } else {
      md += `### Démarrage\n\n\`\`\`bash\nchmod +x start-containers.sh\n./start-containers.sh\n\`\`\`\n\n`;
      md += `### Arrêt\n\n\`\`\`bash\nchmod +x stop-containers.sh\n./stop-containers.sh\n\`\`\`\n\n`;
    }

    md += `### Accès\n\n`;
    md += `- Application: ${envDoc.url}\n`;
    if (envDoc.note) {
      md += `- ${envDoc.note}\n`;
    }

    if (envDoc.extraSetup) {
      md += envDoc.extraSetup;
    }

    if (envDoc.sslSetup) {
      md += envDoc.sslSetup;
    }

    md += `\n## Quick start (manuel)\n\n\`\`\`bash\n up -d\n logs -f\n\`\`\`\n`;

    if (config.gitRepoUrl) {
      md += `\n## Initialisation\n\nUn script \`init.sh\` est fourni pour automatiser le setup :\n\n\`\`\`bash\nchmod +x init.sh\n./init.sh\n\`\`\`\n\nCe script va :\n1. Cloner le repository \`${config.gitRepoUrl}\`${config.gitBranch && config.gitBranch !== 'main' ? ` (branche: ${config.gitBranch})` : ''} dans \`src/\`\n2. Demarrer les containers avec \` up -d\`\n3. Installer les dependances du projet\n`;
    }

    if (config.preset === 'wordpress') {
      md += `\n## WordPress setup\n\n1. Download WordPress into \`src/\`:\n   \`\`\`bash\n   curl -O https://wordpress.org/latest.tar.gz\n   tar xzf latest.tar.gz --strip-components=1 -C src/\n   cp src/wp-config.php src/wp-config.php  # already generated\n   \`\`\`\n2. Open http://${config.domain || 'localhost'} and complete the installation.\n`;
    }

    if (config.preset === 'laravel') {
      md += `\n## Laravel setup\n\n\`\`\`bash\n# Create project in src/\n exec php composer create-project laravel/laravel . "${config.laravelVersion || '11'}.*"\n# Copy the generated .env\ncp .env.example src/.env  # then merge with generated values\n exec php php artisan key:generate\n exec php php artisan migrate\n\`\`\`\n`;
    }

    if (config.preset === 'symfony') {
      md += `\n## Symfony setup\n\n\`\`\`bash\n exec php composer create-project symfony/skeleton . "${config.symfonyVersion || '7.2'}.*"\n# Copy .env values from generated file\n exec php php bin/console doctrine:migrations:migrate\n\`\`\`\n`;
    }

    if (config.preset === 'django') {
      md += `\n## Django setup\n\n\`\`\`bash\n# In src/\ndjango-admin startproject config .\npython manage.py migrate\npython manage.py createsuperuser\n\`\`\`\n`;
    }

    if (config.preset === 'springboot') {
      md += `\n## Spring Boot setup\n\nGenerate your project at https://start.spring.io/ or use the provided pom.xml.\n\`\`\`bash\n up -d\n\`\`\`\n`;
    }

    if (config.ssl === 'mkcert') {
      md += `\n## SSL (mkcert)\n\n\`\`\`bash\nmkcert -install\nmkcert -cert-file certs/cert.pem -key-file certs/key.pem ${config.domain || 'localhost'}\n\`\`\`\n`;
    }
    if (config.ssl === 'letsencrypt') {
      md += `\n## SSL (Let's Encrypt)\n\n\`\`\`bash\n run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d ${config.domain || 'example.com'}\n restart nginx\n\`\`\`\n`;
    }

    md += `\n## Access\n\n`;
    const proto = config.ssl !== 'none' ? 'https' : 'http';
    md += `- App: ${proto}://${config.domain || 'localhost'}\n`;
    if (config.adminer) md += `- Adminer: http://localhost:8081\n`;
    if (config.phpmyadmin) md += `- phpMyAdmin: http://localhost:8082\n`;
    if (config.pgadmin) md += `- pgAdmin: http://localhost:8083\n`;
    if (config.mongoexpress) md += `- Mongo Express: http://localhost:8084\n`;
    if (config.mailpit) md += `- Mailpit: http://localhost:8025\n`;
    if (config.minio) md += `- MinIO Console: http://localhost:9001\n`;
    if (config.rabbitmq) md += `- RabbitMQ: http://localhost:15672\n`;
    if (config.webserver === 'traefik') md += `- Traefik: http://localhost:8080\n`;

    return md;
  },

  // ===================== ENVIRONMENT-SPECIFIC STARTUP SCRIPTS =====================

  windowsStartScript(config) {
    const envNames = {
      'windows-laragon': 'Laragon',
      'windows-herd': 'Herd',
      'windows-xampp': 'XAMPP',
      'windows-wamp': 'WAMP'
    };
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

    // Ajouter les volumes
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
      'windows-laragon': {
        url: `https://${config.projectName}.test`,
        note: 'Le SSL est gere automatiquement par Laragon'
      },
      'windows-herd': {
        url: `https://${config.projectName}.test`,
        note: 'Le SSL est gere automatiquement par Herd'
      },
      'windows-xampp': {
        url: `http://localhost/${config.projectName}`,
        note: 'Configurez le VirtualHost dans httpd-vhosts.conf pour HTTPS'
      },
      'windows-wamp': {
        url: `http://localhost/${config.projectName}`,
        note: 'Configurez le VirtualHost dans httpd-vhosts.conf pour HTTPS'
      }
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
    const envNames = {
      'linux-local': 'Linux',
      'linux-lamp': 'Linux (LAMP)',
      'mac-local': 'macOS',
      'mac-mamp': 'macOS (MAMP)'
    };
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

    // Ajouter les volumes
    const volumes = [];
    if (config.mysql || config.mariadb) volumes.push('mysql-data');
    if (config.postgres) volumes.push('postgres-data');
    if (config.mongo) volumes.push('mongo-data');
    if (config.redis) volumes.push('redis-data');
    if (config.minio) volumes.push('minio-data');
    if (config.elasticsearch) volumes.push('elasticsearch-data');

    if (volumes.length > 0) {
      script += `# Creer les volumes necessaires\n`;
      const volumeCheck = config.runtime === 'docker'
        ? (vol) => `${cmd} volume inspect ${vol}`
        : (vol) => `${cmd} volume exists ${vol}`;
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

    // Gestion SSL pour environnements standalone (non LAMP/MAMP)
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
      // Pour LAMP/MAMP, les containers sont accessibles via le serveur web local
      const lampUrl = config.environment === 'linux-lamp'
        ? `http://localhost/${config.projectName}`
        : `http://localhost:8888/${config.projectName}`;
      script += `echo "  - Application: ${lampUrl}"\n`;
      script += `echo "  (Le serveur web local fait proxy vers les containers)"\n`;
    } else {
      // Pour standalone, accès direct
      const proto = config.ssl !== 'none' ? 'https' : 'http';
      script += `echo "  - Application: ${proto}://${config.domain || 'localhost'}"\n`;

      if (config.ssl === 'mkcert') {
        script += `echo "  (SSL local via mkcert)"\n`;
      } else if (config.ssl === 'letsencrypt') {
        script += `echo "  (SSL via Let's Encrypt)"\n`;
      }
    }

    if (config.adminer) script += `echo "  - Adminer: http://localhost:8081"\n`;
    if (config.phpmyadmin) script += `echo "  - phpMyAdmin: http://localhost:8082"\n`;
    if (config.pgadmin) script += `echo "  - pgAdmin: http://localhost:8083"\n`;
    if (config.mongoexpress) script += `echo "  - Mongo Express: http://localhost:8084"\n`;
    if (config.mailpit) script += `echo "  - Mailpit: http://localhost:8025"\n`;
    if (config.minio) script += `echo "  - MinIO Console: http://localhost:9001"\n`;

    return script;
  },

  unixStopScript(config) {
    const envNames = {
      'linux-local': 'Linux',
      'linux-lamp': 'Linux (LAMP)',
      'mac-local': 'macOS',
      'mac-mamp': 'macOS (MAMP)'
    };
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
};
