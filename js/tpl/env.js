/* ========================================
   tpl/env.js — .env file template
   ======================================== */

Object.assign(Templates, {

  envFile(config) {
    const dbName = config.projectName.replace(/-/g, '_');
    let env = `# Project\nPROJECT_NAME=${config.projectName}\n\n`;

    env += `# SECURITY WARNING:\n# Change all passwords below before deploying to production!\n# These are randomly generated secure passwords.\n\n`;

    if (config.mysql) {
      env += `# MySQL\nMYSQL_VERSION=${config.mysqlVersion}\nMYSQL_ROOT_PASSWORD=${this.getPassword('mysql_root')}\nMYSQL_DATABASE=${dbName}\nMYSQL_USER=appuser\nMYSQL_PASSWORD=${this.getPassword('mysql_user')}\nMYSQL_PORT=${config.mysqlPort}\n\n`;
    }
    if (config.mariadb) {
      env += `# MariaDB\nMARIADB_VERSION=${config.mariadbVersion}\nMARIADB_ROOT_PASSWORD=${this.getPassword('mariadb_root')}\nMARIADB_DATABASE=${dbName}\nMARIADB_USER=appuser\nMARIADB_PASSWORD=${this.getPassword('mariadb_user')}\nMARIADB_PORT=${config.mariadbPort}\n\n`;
    }
    if (config.postgres) {
      env += `# PostgreSQL\nPOSTGRES_VERSION=${config.postgresVersion}\nPOSTGRES_DB=${dbName}\nPOSTGRES_USER=appuser\nPOSTGRES_PASSWORD=${this.getPassword('postgres_user')}\nPOSTGRES_PORT=${config.postgresPort}\n\n`;
    }
    if (config.mongo) {
      env += `# MongoDB\nMONGO_VERSION=${config.mongoVersion}\nMONGO_USER=admin\nMONGO_PASSWORD=${this.getPassword('mongo_admin')}\nMONGO_PORT=${config.mongoPort}\n\n`;
    }
    if (config.redis) {
      env += `# Redis\nREDIS_PASSWORD=${this.getPassword('redis')}\nREDIS_PORT=${config.redisPort}\n\n`;
    }
    if (config.rabbitmq) {
      env += `# RabbitMQ\nRABBITMQ_USER=admin\nRABBITMQ_PASSWORD=${this.getPassword('rabbitmq')}\n\n`;
    }
    if (config.minio) {
      env += `# MinIO\nMINIO_USER=minioadmin\nMINIO_PASSWORD=${this.getPassword('minio')}\n\n`;
    }
    if (config.adminer) env += `# Adminer\nADMINER_PORT=${config.adminerPort}\n\n`;
    if (config.phpmyadmin) env += `# phpMyAdmin\nPMA_PORT=${config.phpmyadminPort}\n\n`;
    if (config.pgadmin) {
      env += `# pgAdmin\nPGADMIN_PORT=${config.pgadminPort}\nPGADMIN_EMAIL=admin@admin.com\nPGADMIN_PASSWORD=${this.getPassword('pgadmin')}\n\n`;
    }
    if (config.mongoexpress) {
      env += `# Mongo Express\nMONGOEXPRESS_PORT=${config.mongoexpressPort}\nMONGOEXPRESS_USER=admin\nMONGOEXPRESS_PASSWORD=${this.getPassword('mongoexpress')}\n\n`;
    }
    if (config.mailpit) env += `# Mailpit\nMAILPIT_SMTP=${config.mailpitSmtpPort}\nMAILPIT_UI=${config.mailpitUiPort}\n\n`;
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
  }
});
