#!/bin/bash
#=========================================================================#
# HestiaCP Container Proxy Template — Installation Script                  #
#                                                                          #
# Installe les templates Nginx pour proxifier vers un container            #
# Docker ou Podman depuis HestiaCP.                                        #
#                                                                          #
# Usage:                                                                   #
#   sudo bash install.sh                                                   #
#   sudo bash install.sh --port 8080                                       #
#   sudo bash install.sh --port 8080 --domain example.com --user admin     #
#=========================================================================#

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Defaults ---
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
DOMAIN=""
HESTIA_USER=""
TEMPLATE_DIR="/usr/local/hestia/data/templates/web/nginx"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
    case $1 in
        --port|-p)     CONTAINER_PORT="$2"; shift 2 ;;
        --domain|-d)   DOMAIN="$2"; shift 2 ;;
        --user|-u)     HESTIA_USER="$2"; shift 2 ;;
        --help|-h)
            echo "Usage: sudo bash install.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -p, --port PORT      Container port (default: 3000)"
            echo "  -d, --domain DOMAIN  Apply template to this domain"
            echo "  -u, --user USER      HestiaCP user for the domain"
            echo "  -h, --help           Show this help"
            echo ""
            echo "Examples:"
            echo "  sudo bash install.sh"
            echo "  sudo bash install.sh --port 8080"
            echo "  sudo bash install.sh --port 3000 --domain app.example.com --user admin"
            exit 0
            ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
    esac
done

# --- Check root ---
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}Error: This script must be run as root (sudo)${NC}"
    exit 1
fi

# --- Check HestiaCP ---
if [[ ! -d "$TEMPLATE_DIR" ]]; then
    echo -e "${RED}Error: HestiaCP Nginx template directory not found${NC}"
    echo -e "Expected: $TEMPLATE_DIR"
    echo -e "Is HestiaCP installed?"
    exit 1
fi

# --- Check template files ---
if [[ ! -f "$SCRIPT_DIR/container-proxy.tpl" ]] || [[ ! -f "$SCRIPT_DIR/container-proxy.stpl" ]]; then
    echo -e "${RED}Error: Template files not found in $SCRIPT_DIR${NC}"
    echo -e "Expected: container-proxy.tpl and container-proxy.stpl"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HestiaCP Container Proxy Installer    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# --- Customize port in templates ---
echo -e "${YELLOW}[1/3]${NC} Preparing templates (port: ${GREEN}$CONTAINER_PORT${NC})..."

# Create temp copies with custom port
TMP_TPL=$(mktemp)
TMP_STPL=$(mktemp)
sed "s|http://127.0.0.1:3000|http://127.0.0.1:$CONTAINER_PORT|g" "$SCRIPT_DIR/container-proxy.tpl" > "$TMP_TPL"
sed "s|http://127.0.0.1:3000|http://127.0.0.1:$CONTAINER_PORT|g" "$SCRIPT_DIR/container-proxy.stpl" > "$TMP_STPL"

# --- Install templates ---
echo -e "${YELLOW}[2/3]${NC} Installing templates to ${GREEN}$TEMPLATE_DIR${NC}..."

cp "$TMP_TPL" "$TEMPLATE_DIR/container-proxy.tpl"
cp "$TMP_STPL" "$TEMPLATE_DIR/container-proxy.stpl"
chmod 644 "$TEMPLATE_DIR/container-proxy.tpl"
chmod 644 "$TEMPLATE_DIR/container-proxy.stpl"

rm -f "$TMP_TPL" "$TMP_STPL"

echo -e "  ${GREEN}✓${NC} container-proxy.tpl  installed"
echo -e "  ${GREEN}✓${NC} container-proxy.stpl installed"

# --- Apply to domain if specified ---
if [[ -n "$DOMAIN" ]] && [[ -n "$HESTIA_USER" ]]; then
    echo -e "${YELLOW}[3/3]${NC} Applying template to ${GREEN}$DOMAIN${NC} (user: $HESTIA_USER)..."

    # Check if v-change-web-domain-proxy-tpl exists
    if command -v v-change-web-domain-proxy-tpl &> /dev/null; then
        v-change-web-domain-proxy-tpl "$HESTIA_USER" "$DOMAIN" "container-proxy"
        echo -e "  ${GREEN}✓${NC} Template applied to $DOMAIN"
    else
        echo -e "  ${YELLOW}⚠${NC} HestiaCP CLI not found, apply manually via panel:"
        echo -e "    Edit domain > Proxy Template > container-proxy"
    fi
else
    echo -e "${YELLOW}[3/3]${NC} Skipped domain assignment (use --domain and --user to auto-apply)"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Installation complete!                 ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Container port: ${BLUE}$CONTAINER_PORT${NC}"
echo -e "Proxy target:   ${BLUE}http://127.0.0.1:$CONTAINER_PORT${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. In HestiaCP panel: Edit domain > Proxy Template > ${GREEN}container-proxy${NC}"
echo -e "  2. Start your container on port ${BLUE}$CONTAINER_PORT${NC}"
echo -e "  3. Enable SSL via HestiaCP (Let's Encrypt)"
echo ""
echo -e "To change port later, edit:"
echo -e "  ${BLUE}$TEMPLATE_DIR/container-proxy.tpl${NC}"
echo -e "  ${BLUE}$TEMPLATE_DIR/container-proxy.stpl${NC}"
echo -e "  Then rebuild: ${BLUE}v-rebuild-web-domain USER DOMAIN${NC}"
