/* ========================================
   tpl/compose.js — docker-compose.yml templates
   ======================================== */

Object.assign(Templates, {

  composeHeader() {
    return `services:\n`;
  },

  composeNginx(config) {
    const ports = config.ssl !== 'none'
      ? `    ports:\n      - "${config.httpPort}:80"\n      - "${config.httpsPort}:443"\n`
      : `    ports:\n      - "${config.httpPort}:80"\n`;
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
      ? `    ports:\n      - "${config.httpPort}:80"\n      - "${config.httpsPort}:443"\n`
      : `    ports:\n      - "${config.httpPort}:80"\n`;
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
    block += `    ports:\n      - "${config.httpPort}:80"\n      - "${config.httpsPort}:443"\n`;
    block += `    volumes:\n${volumes.join('\n')}\n`;
    if (depends.length) block += `    depends_on:\n${depends.map(d => `      - ${d}`).join('\n')}\n`;
    block += `    networks:\n      - app-network\n    restart: unless-stopped\n`;
    return block;
  },

  composeTraefik(config) {
    let block = `  traefik:\n    image: traefik:v3.0\n    container_name: \${PROJECT_NAME}-traefik\n`;
    block += `    ports:\n      - "${config.httpPort}:80"\n      - "${config.httpsPort}:443"\n      - "${config.traefikDashPort}:8080"\n`;
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
      ports = `    ports:\n      - "${config.nodePort}:3000"\n`;
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
      ports = `    ports:\n      - "${config.pythonPort}:8000"\n`;
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
      ports = `    ports:\n      - "${config.javaPort}:8080"\n`;
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

  composeMemcached(config) {
    return `  memcached:\n    image: memcached:1-alpine\n    container_name: \${PROJECT_NAME}-memcached\n    ports:\n      - "${config.memcachedPort}:11211"\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeRabbitmq(config) {
    return `  rabbitmq:\n    image: rabbitmq:3-management-alpine\n    container_name: \${PROJECT_NAME}-rabbitmq\n    ports:\n      - "${config.rabbitmqPort}:5672"\n      - "${config.rabbitmqUiPort}:15672"\n    environment:\n      RABBITMQ_DEFAULT_USER: \${RABBITMQ_USER:-guest}\n      RABBITMQ_DEFAULT_PASS: \${RABBITMQ_PASSWORD:-guest}\n    volumes:\n      - rabbitmq-data:/var/lib/rabbitmq\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
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

  composeMinio(config) {
    return `  minio:\n    image: minio/minio:latest\n    container_name: \${PROJECT_NAME}-minio\n    ports:\n      - "${config.minioPort}:9000"\n      - "${config.minioConsolePort}:9001"\n    environment:\n      MINIO_ROOT_USER: \${MINIO_USER:-minioadmin}\n      MINIO_ROOT_PASSWORD: \${MINIO_PASSWORD:-minioadmin}\n    volumes:\n      - minio-data:/data\n    command: server /data --console-address ":9001"\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
  },

  composeElasticsearch(config) {
    return `  elasticsearch:\n    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0\n    container_name: \${PROJECT_NAME}-elasticsearch\n    ports:\n      - "${config.elasticsearchPort}:9200"\n    environment:\n      - discovery.type=single-node\n      - xpack.security.enabled=true\n      - ELASTIC_PASSWORD=\${ELASTIC_PASSWORD}\n      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"\n    volumes:\n      - elasticsearch-data:/usr/share/elasticsearch/data\n    networks:\n      - app-network\n    restart: unless-stopped\n`;
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
  }
});
