#=========================================================================#
# HestiaCP — Nginx Reverse Proxy for Docker/Podman Container (HTTP)       #
# Template: container-proxy                                                #
#                                                                          #
# Installation:                                                            #
#   sudo cp container-proxy.tpl /usr/local/hestia/data/templates/web/nginx/#
#   sudo cp container-proxy.stpl /usr/local/hestia/data/templates/web/nginx/#
#                                                                          #
# Then in HestiaCP panel: Edit domain > Proxy Template > container-proxy  #
#                                                                          #
# By default proxies to port 3000. To change, set CONTAINER_PORT in       #
# domain's nginx.conf_* or use HestiaCP CLI:                              #
#   v-change-web-domain-proxy-tpl user domain container-proxy              #
#=========================================================================#

server {
    listen      %ip%:%web_port%;
    server_name %domain% %alias%;

    # Logs
    access_log  /var/log/nginx/domains/%domain%.log combined;
    access_log  /var/log/nginx/domains/%domain%.bytes bytes;
    error_log   /var/log/nginx/domains/%domain%.error.log error;

    # Force SSL redirect (if SSL is enabled via HestiaCP)
    include %home%/%user%/conf/web/%domain%/nginx.forcessl.conf*;

    # Security: block dotfiles except .well-known (Let's Encrypt)
    location ~ /\.(?!well-known\/) {
        deny all;
        return 404;
    }

    # Reverse proxy to container
    location / {
        proxy_pass         http://127.0.0.1:3000;

        # Standard proxy headers
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Forwarded-Host  $host;
        proxy_set_header   X-Forwarded-Port  $server_port;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        $connection_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        # Buffering
        proxy_buffering    on;
        proxy_buffer_size  128k;
        proxy_buffers      4 256k;
        proxy_busy_buffers_size 256k;

        # Don't limit upload size (Docker registries, file uploads, etc.)
        client_max_body_size 0;
    }

    # Static files served directly from public_html (optional fallback)
    location /static/ {
        alias %docroot%/static/;
        expires max;
        access_log off;
    }

    # HestiaCP error pages
    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    # HestiaCP stats
    location /vstats/ {
        alias   %home%/%user%/web/%domain%/stats/;
        include %home%/%user%/web/%domain%/stats/auth.conf*;
    }

    # HestiaCP custom includes
    include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}
