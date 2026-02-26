/* ========================================
   tpl/helpers.js — Security & runtime helpers
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

  escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  escapeJson(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  },

  escapeYaml(unsafe) {
    if (!unsafe) return '""';
    if (/[:#\[\]{}&*!|>'"@`-]/.test(unsafe)) {
      return `"${unsafe.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return unsafe;
  },

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

  getCmd(config) {
    return config.runtime === 'docker' ? 'docker' : 'podman';
  },

  getComposeCmd(config) {
    return config.runtime === 'docker' ? 'docker compose' : 'podman-compose';
  },

  getNetworkExistsCmd(config, networkName) {
    if (config.runtime === 'docker') {
      return `docker network inspect ${networkName}`;
    } else {
      return `podman network exists ${networkName}`;
    }
  },

  getVolumeExistsCmd(config, volumeName) {
    if (config.runtime === 'docker') {
      return `docker volume inspect ${volumeName}`;
    } else {
      return `podman volume exists ${volumeName}`;
    }
  }
};
