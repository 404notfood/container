/* ========================================
   ui-builder.js — DOM generation from config
   Requires: ui-data.js (UI_SECTIONS)
   ======================================== */
var UIBuilder = {

  svg: function (paths, w, h) {
    w = w || 20; h = h || 20;
    return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + h + '" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' + paths + '</svg>';
  },

  buildSelect: function (id, options) {
    var opts = options.map(function (o) {
      return '<option value="' + o.value + '"' + (o.selected ? ' selected' : '') + '>' + o.text + '</option>';
    }).join('');
    return '<select id="' + id + '">' + opts + '</select>';
  },

  buildFormGroup: function (f) {
    var hintSpan = f.labelHint ? ' <span class="optional">' + f.labelHint + '</span>' : '';
    var errorDiv = f.hasError ? '<div class="field-error" id="' + f.id + '-error" role="alert"></div>' : '';
    var input;
    if (f.tag === 'input') {
      var val = f.value ? ' value="' + f.value + '"' : '';
      input = '<input type="' + f.type + '" id="' + f.id + '"' + val + ' placeholder="' + f.placeholder + '" />';
    } else if (f.tag === 'select') {
      input = this.buildSelect(f.id, f.options);
    }
    return '<div class="form-group"><label for="' + f.id + '">' + f.label + hintSpan + '</label>' + input + errorDiv + '</div>';
  },

  // --- Sidebar ---
  buildSidebar: function (sections) {
    var self = this;
    return sections.map(function (s) {
      return '<li><a href="#' + s.id + '" class="sidebar-nav-item" data-section="' + s.id + '">' +
        '<span class="nav-dot"></span>' +
        '<span class="nav-icon">' + self.svg(s.navIcon, 16, 16) + '</span>' +
        '<span class="nav-label">' + s.navLabel + '</span>' +
        '</a></li>';
    }).join('');
  },

  // --- All sections ---
  buildAllSections: function (sections) {
    var self = this;
    return sections.map(function (s) { return self.buildSection(s); }).join('');
  },

  // --- Single section ---
  buildSection: function (s) {
    var extraClass = s.body.type === 'preview' ? ' card-preview' : '';
    var header, body;
    if (s.body.type === 'preview') {
      header = this.buildPreviewHeader(s);
      body = this.buildPreviewBody();
    } else {
      header = this.buildCardHeader(s);
      body = '<div class="card-body">' + this.buildBody(s.body) + '</div>';
    }
    return '<section class="card' + extraClass + '" id="' + s.id + '">' + header + body + '</section>';
  },

  // --- Card header ---
  buildCardHeader: function (s) {
    var hintHtml = '';
    if (s.hint) {
      hintHtml = '<span class="hint"' + (s.hintId ? ' id="' + s.hintId + '"' : '') + '>' + s.hint + '</span>';
    }
    return '<div class="card-header">' + this.svg(s.icon) + '<h2>' + s.title + '</h2>' + hintHtml + '</div>';
  },

  // --- Body dispatcher ---
  buildBody: function (body) {
    switch (body.type) {
      case 'form-rows': return this.buildFormRows(body);
      case 'radio-group': return this.buildRadioGroup(body);
      case 'preset-grid': return this.buildPresetGrid(body);
      case 'service-blocks': return this.buildServiceBlocks(body);
      case 'env-grid': return this.buildEnvGrid(body);
      default: return '';
    }
  },

  // --- Form rows ---
  buildFormRows: function (body) {
    var self = this;
    return body.rows.map(function (row) {
      var cls = row.cssClass ? ' ' + row.cssClass : '';
      var fields = row.fields.map(function (f) { return self.buildFormGroup(f); }).join('');
      return '<div class="form-row' + cls + '">' + fields + '</div>';
    }).join('');
  },

  // --- Radio group ---
  buildRadioGroup: function (body) {
    var idAttr = body.id ? ' id="' + body.id + '"' : '';
    var cards = body.options.map(function (o) {
      var active = o.checked ? ' active' : '';
      var checked = o.checked ? ' checked' : '';
      var ariaChecked = o.checked ? 'true' : 'false';
      var descHtml = o.desc ? '<span class="radio-desc">' + o.desc + '</span>' : '';
      return '<label class="radio-card' + active + '" data-value="' + o.value + '">' +
        '<input type="radio" name="' + body.name + '" value="' + o.value + '"' + checked + ' aria-checked="' + ariaChecked + '" />' +
        '<span class="radio-icon">' + o.icon + '</span>' +
        '<span class="radio-label">' + o.label + '</span>' +
        descHtml +
        '</label>';
    }).join('');

    var afterHtml = '';
    if (body.after) {
      afterHtml = body.after.map(function (a) {
        if (a.type === 'info-box') {
          return '<div class="info-box" id="' + a.id + '">' + a.html + '</div>';
        }
        if (a.type === 'nginx-socket') {
          return '<div class="nginx-socket-option" id="' + a.id + '">' +
            '<label class="toggle-row">' +
            '<input type="checkbox" id="' + a.toggleId + '" class="toggle-input" />' +
            '<span class="toggle-slider"></span>' +
            '<span class="toggle-label">' + a.label + '</span>' +
            '</label></div>';
        }
        if (a.type === 'port-row') {
          var fields = a.fields.map(function (f) {
            return '<div class="form-group form-group-port">' +
              '<label for="' + f.id + '">' + f.label + '</label>' +
              '<input type="number" id="' + f.id + '" value="' + f.value + '" placeholder="' + f.placeholder + '" min="1" max="65535" />' +
              '</div>';
          }).join('');
          return '<div class="form-row port-row"' + (a.id ? ' id="' + a.id + '"' : '') + '>' + fields + '</div>';
        }
        return '';
      }).join('');
    }

    return '<div class="radio-group"' + idAttr + ' role="radiogroup" aria-label="' + body.ariaLabel + '">' + cards + '</div>' + afterHtml;
  },

  // --- Preset grid ---
  buildPresetGrid: function (body) {
    var self = this;
    var cards = body.options.map(function (o) {
      var active = o.checked ? ' active' : '';
      var checked = o.checked ? ' checked' : '';
      var ariaChecked = o.checked ? 'true' : 'false';
      return '<label class="preset-card' + active + '" data-preset="' + o.value + '">' +
        '<input type="radio" name="' + body.name + '" value="' + o.value + '"' + checked + ' aria-checked="' + ariaChecked + '" />' +
        '<span class="preset-icon">' + o.icon + '</span>' +
        '<span class="preset-name">' + o.name + '</span>' +
        '<span class="preset-desc">' + o.desc + '</span>' +
        '</label>';
    }).join('');

    var panels = (body.presetOptions || []).map(function (p) {
      var rows = p.rows.map(function (r) {
        var fields = r.fields.map(function (f) { return self.buildFormGroup(f); }).join('');
        return '<div class="form-row">' + fields + '</div>';
      }).join('');
      return '<div class="preset-options" id="' + p.id + '" style="display: none">' + rows + '</div>';
    }).join('');

    return '<div class="preset-grid" role="radiogroup" aria-label="' + body.ariaLabel + '">' + cards + '</div>' + panels;
  },

  // --- Environment grid ---
  buildEnvGrid: function (body) {
    var style = body.gridStyle ? ' style="' + body.gridStyle + '"' : '';
    var cards = body.options.map(function (o) {
      var active = o.checked ? ' active' : '';
      var checked = o.checked ? ' checked' : '';
      return '<label class="preset-card' + active + '" data-env="' + o.value + '">' +
        '<input type="radio" name="' + body.name + '" value="' + o.value + '"' + checked + ' />' +
        '<span class="preset-icon">' + o.icon + '</span>' +
        '<span class="preset-name">' + o.name + '</span>' +
        '<span class="preset-desc">' + o.desc + '</span>' +
        '</label>';
    }).join('');
    return '<div class="preset-grid"' + style + '>' + cards + '</div>';
  },

  // --- Service blocks ---
  buildServiceBlocks: function (body) {
    var self = this;
    return body.blocks.map(function (b) {
      var hintHtml = b.toggleHint ? ' <span class="hint">' + b.toggleHint + '</span>' : '';
      var html = '<div class="service-block">' +
        '<label class="toggle-row">' +
        '<input type="checkbox" id="' + b.toggleId + '" class="toggle-input" />' +
        '<span class="toggle-slider"></span>' +
        '<span class="toggle-label">' + b.toggleLabel + hintHtml + '</span>' +
        '</label>';

      if (b.optionsId && b.content) {
        var contentHtml = b.content.map(function (c) { return self.buildServiceContent(c); }).join('');
        html += '<div class="service-options" id="' + b.optionsId + '">' + contentHtml + '</div>';
      }

      html += '</div>';
      return html;
    }).join('');
  },

  buildServiceContent: function (c) {
    if (c.tag === 'select') {
      return '<div class="form-group"><label for="' + c.id + '">' + c.label + '</label>' + this.buildSelect(c.id, c.options) + '</div>';
    }
    if (c.type === 'checkbox-group') {
      var chips = c.chips.map(function (ch) {
        var checked = ch.checked ? ' checked' : '';
        return '<label class="chip"><input type="checkbox" value="' + ch.value + '"' + checked + ' /> ' + ch.value + '</label>';
      }).join('');
      return '<div class="form-group"><label>' + c.label + '</label><div class="checkbox-group" id="' + c.id + '">' + chips + '</div></div>';
    }
    if (c.type === 'form-row') {
      var self = this;
      var fields = c.fields.map(function (f) { return self.buildServiceContent(f); }).join('');
      return '<div class="form-row">' + fields + '</div>';
    }
    if (c.type === 'nvm-default') {
      return '<div id="' + c.id + '" class="form-group" style="display: none; margin-top: 0.5rem">' +
        '<label for="' + c.inputId + '">' + c.label + '</label>' +
        '<input type="text" id="' + c.inputId + '" value="' + c.value + '" placeholder="' + c.placeholder + '" />' +
        '</div>';
    }
    if (c.type === 'port-row') {
      var fields = c.fields.map(function (f) {
        return '<div class="form-group form-group-port">' +
          '<label for="' + f.id + '">' + f.label + '</label>' +
          '<input type="number" id="' + f.id + '" value="' + f.value + '" placeholder="' + f.placeholder + '" min="1" max="65535" />' +
          '</div>';
      }).join('');
      return '<div class="form-row port-row"' + (c.id ? ' id="' + c.id + '"' : '') + '>' + fields + '</div>';
    }
    return '';
  },

  // --- Preview section ---
  buildPreviewHeader: function (s) {
    return '<div class="card-header">' +
      this.svg(s.icon) +
      '<h2>' + s.title + '</h2>' +
      '<div class="preview-actions">' +
        '<button class="btn btn-ghost" id="btnCopy" aria-label="Copier le fichier actif dans le presse-papier">' +
          this.svg('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>', 14, 14) +
          '<span data-copy-label>Copier</span>' +
        '</button>' +
        '<button class="btn btn-primary" id="btnDownload">' +
          this.svg('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', 16, 16) +
          ' Télécharger ZIP' +
        '</button>' +
      '</div>' +
    '</div>';
  },

  buildPreviewBody: function () {
    return '<div class="preview-tabs" id="previewTabs"></div>' +
      '<div class="preview-content"><pre><code id="previewCode" class="hljs"></code></pre></div>';
  }
};

/* ========================================
   Auto-execute: Build UI into skeleton
   ======================================== */
(function () {
  var navList = document.getElementById('sidebarNavList');
  var main = document.getElementById('mainContent');
  if (navList) navList.innerHTML = UIBuilder.buildSidebar(UI_SECTIONS);
  if (main) main.innerHTML = UIBuilder.buildAllSections(UI_SECTIONS);
})();
