/* ========================================
   tpl/webservers.js — Nginx, Apache, Caddy, Traefik configs
   ======================================== */

Object.assign(Templates, {

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

    server += this._nginxSecurityHeaders(config);

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
  }
});
