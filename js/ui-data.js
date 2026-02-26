/* ========================================
   ui-data.js — Declarative UI section definitions
   Must load synchronously (no defer) before other scripts
   ======================================== */

var UI_SECTIONS = [
  // ---- Project ----
  {
    id: 'section-project',
    title: 'Projet',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    navLabel: 'Projet',
    navIcon: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    body: {
      type: 'form-rows',
      rows: [
        { fields: [
          { tag: 'input', id: 'projectName', label: 'Nom du projet', type: 'text', value: 'my-app', placeholder: 'my-app', hasError: true },
          { tag: 'input', id: 'projectDomain', label: 'Domaine', labelHint: '(optionnel, pour SSL prod)', type: 'text', placeholder: 'example.com', hasError: true }
        ]},
        { cssClass: 'mt-sm', fields: [
          { tag: 'input', id: 'gitRepoUrl', label: 'Repository Git', labelHint: '(optionnel)', type: 'text', placeholder: 'https://github.com/user/repo.git', hasError: true },
          { tag: 'input', id: 'gitBranch', label: 'Branche', labelHint: '(défaut : main)', type: 'text', placeholder: 'main', hasError: true }
        ]}
      ]
    }
  },

  // ---- Runtime ----
  {
    id: 'section-runtime',
    title: 'Moteur de conteneurs',
    hint: 'Docker ou Podman',
    icon: '<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M8 2v20M16 2v20M2 8h20M2 16h20"/>',
    navLabel: 'Runtime',
    navIcon: '<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M8 2v20M16 2v20M2 8h20M2 16h20"/>',
    body: {
      type: 'radio-group',
      name: 'runtime',
      ariaLabel: 'Sélection du runtime de conteneur',
      options: [
        { value: 'docker', icon: 'D', label: 'Docker', desc: 'Recommandé', checked: true },
        { value: 'podman', icon: 'P', label: 'Podman', desc: 'Rootless' }
      ],
      after: [
        { type: 'info-box', id: 'runtimeInfo', html: '<strong>Docker</strong> est le runtime le plus populaire et le mieux supporté. Recommandé pour la plupart des utilisateurs.' }
      ]
    }
  },

  // ---- Preset ----
  {
    id: 'section-preset',
    title: 'Application / Preset',
    hint: 'Auto-configure la stack',
    icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    navLabel: 'Preset',
    navIcon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    body: {
      type: 'preset-grid',
      name: 'preset',
      ariaLabel: "Sélection du preset d'application",
      options: [
        { value: 'none', icon: '\u2014', name: 'Manuel', desc: 'Config libre', checked: true },
        { value: 'wordpress', icon: 'W', name: 'WordPress', desc: 'PHP + MySQL' },
        { value: 'laravel', icon: 'L', name: 'Laravel', desc: 'PHP + DB + Redis' },
        { value: 'symfony', icon: 'S', name: 'Symfony', desc: 'PHP + DB' },
        { value: 'nextjs', icon: 'N', name: 'Next.js', desc: 'React SSR' },
        { value: 'nestjs', icon: 'Ns', name: 'Nest.js', desc: 'Node API' },
        { value: 'angular', icon: 'Ng', name: 'Angular', desc: 'SPA + Nginx' },
        { value: 'django', icon: 'Dj', name: 'Django', desc: 'Python + Postgres' },
        { value: 'flask', icon: 'Fl', name: 'Flask', desc: 'Python micro' },
        { value: 'springboot', icon: 'Sb', name: 'Spring Boot', desc: 'Java + DB' }
      ],
      presetOptions: [
        { id: 'presetOptions-wordpress', rows: [
          { fields: [
            { tag: 'select', id: 'wpDbEngine', label: 'Base de données', options: [
              { value: 'mysql', text: 'MySQL', selected: true },
              { value: 'mariadb', text: 'MariaDB' }
            ]}
          ]}
        ]},
        { id: 'presetOptions-laravel', rows: [
          { fields: [
            { tag: 'select', id: 'laravelVersion', label: 'Version Laravel', options: [
              { value: '10', text: '10 LTS' },
              { value: '11', text: '11', selected: true },
              { value: '12', text: '12' }
            ]},
            { tag: 'select', id: 'laravelStarter', label: 'Starter Kit', options: [
              { value: 'none', text: 'Aucun', selected: true },
              { value: 'breeze-react', text: 'Breeze + React' },
              { value: 'breeze-vue', text: 'Breeze + Vue' },
              { value: 'breeze-livewire', text: 'Breeze + Livewire' },
              { value: 'jetstream-livewire', text: 'Jetstream + Livewire' },
              { value: 'jetstream-inertia-react', text: 'Jetstream + Inertia (React)' },
              { value: 'jetstream-inertia-vue', text: 'Jetstream + Inertia (Vue)' }
            ]},
            { tag: 'select', id: 'laravelDb', label: 'Base de données', options: [
              { value: 'mysql', text: 'MySQL', selected: true },
              { value: 'mariadb', text: 'MariaDB' },
              { value: 'postgres', text: 'PostgreSQL' }
            ]}
          ]}
        ]},
        { id: 'presetOptions-symfony', rows: [
          { fields: [
            { tag: 'select', id: 'symfonyVersion', label: 'Version Symfony', options: [
              { value: '6.4', text: '6.4 LTS' },
              { value: '7.0', text: '7.0' },
              { value: '7.1', text: '7.1' },
              { value: '7.2', text: '7.2', selected: true }
            ]},
            { tag: 'select', id: 'symfonyDb', label: 'Base de données', options: [
              { value: 'postgres', text: 'PostgreSQL', selected: true },
              { value: 'mysql', text: 'MySQL' },
              { value: 'mariadb', text: 'MariaDB' }
            ]}
          ]}
        ]},
        { id: 'presetOptions-nextjs', rows: [
          { fields: [
            { tag: 'select', id: 'nextjsDb', label: 'Base de données', options: [
              { value: 'none', text: 'Aucune', selected: true },
              { value: 'postgres', text: 'PostgreSQL' },
              { value: 'mysql', text: 'MySQL' },
              { value: 'mongo', text: 'MongoDB' }
            ]}
          ]}
        ]},
        { id: 'presetOptions-nestjs', rows: [
          { fields: [
            { tag: 'select', id: 'nestjsDb', label: 'Base de données', options: [
              { value: 'postgres', text: 'PostgreSQL', selected: true },
              { value: 'mysql', text: 'MySQL' },
              { value: 'mongo', text: 'MongoDB' }
            ]},
            { tag: 'select', id: 'nestjsOrm', label: 'ORM', options: [
              { value: 'typeorm', text: 'TypeORM', selected: true },
              { value: 'prisma', text: 'Prisma' },
              { value: 'mongoose', text: 'Mongoose (MongoDB)' }
            ]}
          ]}
        ]},
        { id: 'presetOptions-angular', rows: [
          { fields: [
            { tag: 'select', id: 'angularVersion', label: 'Version Angular', options: [
              { value: '17', text: '17 (EOL)' },
              { value: '18', text: '18 (EOL)' },
              { value: '19', text: '19' },
              { value: '20', text: '20' },
              { value: '21', text: '21 (Latest)', selected: true }
            ]}
          ]}
        ]},
        { id: 'presetOptions-django', rows: [
          { fields: [
            { tag: 'select', id: 'djangoVersion', label: 'Version Django', options: [
              { value: '4.2', text: '4.2 LTS' },
              { value: '5.0', text: '5.0' },
              { value: '5.1', text: '5.1', selected: true }
            ]},
            { tag: 'select', id: 'pythonVersion', label: 'Version Python', options: [
              { value: '3.10', text: '3.10' },
              { value: '3.11', text: '3.11' },
              { value: '3.12', text: '3.12' },
              { value: '3.13', text: '3.13', selected: true },
              { value: '3.14', text: '3.14 (Latest)' }
            ]},
            { tag: 'select', id: 'djangoDb', label: 'Base de données', options: [
              { value: 'postgres', text: 'PostgreSQL', selected: true },
              { value: 'mysql', text: 'MySQL' }
            ]}
          ]}
        ]},
        { id: 'presetOptions-flask', rows: [
          { fields: [
            { tag: 'select', id: 'flaskPythonVersion', label: 'Version Python', options: [
              { value: '3.10', text: '3.10' },
              { value: '3.11', text: '3.11' },
              { value: '3.12', text: '3.12' },
              { value: '3.13', text: '3.13', selected: true },
              { value: '3.14', text: '3.14 (Latest)' }
            ]},
            { tag: 'select', id: 'flaskDb', label: 'Base de données', options: [
              { value: 'none', text: 'Aucune', selected: true },
              { value: 'postgres', text: 'PostgreSQL' },
              { value: 'mysql', text: 'MySQL' },
              { value: 'mongo', text: 'MongoDB' }
            ]}
          ]}
        ]},
        { id: 'presetOptions-springboot', rows: [
          { fields: [
            { tag: 'select', id: 'springJavaVersion', label: 'Version Java', options: [
              { value: '11', text: '11 LTS' },
              { value: '17', text: '17 LTS' },
              { value: '21', text: '21 LTS', selected: true },
              { value: '25', text: '25 LTS (Latest)' }
            ]},
            { tag: 'select', id: 'springDb', label: 'Base de données', options: [
              { value: 'postgres', text: 'PostgreSQL', selected: true },
              { value: 'mysql', text: 'MySQL' },
              { value: 'mariadb', text: 'MariaDB' },
              { value: 'mongo', text: 'MongoDB' }
            ]},
            { tag: 'select', id: 'springBuild', label: 'Build tool', options: [
              { value: 'maven', text: 'Maven', selected: true },
              { value: 'gradle', text: 'Gradle' }
            ]}
          ]}
        ]}
      ]
    }
  },

  // ---- Webserver ----
  {
    id: 'section-webserver',
    title: 'Serveur Web',
    icon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
    navLabel: 'Serveur Web',
    navIcon: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
    body: {
      type: 'radio-group',
      name: 'webserver',
      ariaLabel: 'Sélection du serveur web',
      options: [
        { value: 'nginx', icon: 'N', label: 'Nginx', desc: 'Haute perfo.', checked: true },
        { value: 'apache', icon: 'A', label: 'Apache', desc: '.htaccess' },
        { value: 'caddy', icon: 'C', label: 'Caddy', desc: 'SSL auto' },
        { value: 'traefik', icon: 'T', label: 'Traefik', desc: 'Microservices' },
        { value: 'none', icon: '\u2014', label: 'Aucun', desc: 'Sans proxy' }
      ],
      after: [
        { type: 'nginx-socket', id: 'nginxSocketOption', toggleId: 'enableNginxSocket', label: 'Nginx : communication via Unix socket (au lieu de TCP)' },
        { type: 'port-row', id: 'webserverPorts', fields: [
          { tag: 'input', id: 'httpPort', label: 'Port HTTP', type: 'number', value: '80', placeholder: '80' },
          { tag: 'input', id: 'httpsPort', label: 'Port HTTPS', type: 'number', value: '443', placeholder: '443' },
          { tag: 'input', id: 'traefikDashPort', label: 'Traefik Dashboard', type: 'number', value: '8080', placeholder: '8080' }
        ]}
      ]
    }
  },

  // ---- Backend ----
  {
    id: 'section-backend',
    title: 'Backend (Serveur)',
    icon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    navLabel: 'Backend',
    navIcon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    body: {
      type: 'service-blocks',
      blocks: [
        {
          toggleId: 'enablePhp', toggleLabel: 'PHP-FPM',
          optionsId: 'phpOptions',
          content: [
            { tag: 'select', id: 'phpVersion', label: 'Version', options: [
              { value: '8.1', text: '8.1 (EOL 2025)' },
              { value: '8.2', text: '8.2' },
              { value: '8.3', text: '8.3' },
              { value: '8.4', text: '8.4 (LTS)', selected: true },
              { value: '8.5', text: '8.5 (Latest)' }
            ]},
            { type: 'checkbox-group', id: 'phpExtensionsGroup', label: 'Extensions', chips: [
              { value: 'gd', checked: true }, { value: 'intl', checked: true },
              { value: 'zip', checked: true }, { value: 'pdo_mysql' },
              { value: 'pdo_pgsql' }, { value: 'redis' },
              { value: 'memcached' }, { value: 'opcache', checked: true },
              { value: 'mbstring', checked: true }, { value: 'xml' },
              { value: 'curl', checked: true }, { value: 'imagick' },
              { value: 'xdebug' }, { value: 'bcmath' },
              { value: 'exif' }, { value: 'soap' }
            ]}
          ]
        },
        {
          toggleId: 'enableNode', toggleLabel: 'Node.js',
          optionsId: 'nodeOptions',
          content: [
            { type: 'form-row', fields: [
              { tag: 'select', id: 'nodeVersion', label: 'Version', options: [
                { value: '18', text: '18 (EOL 2025)' },
                { value: '20', text: '20 LTS Iron' },
                { value: '22', text: '22 LTS Jod' },
                { value: '24', text: '24 LTS Krypton (Latest)', selected: true },
                { value: '25', text: '25 Current' },
                { value: 'nvm', text: 'NVM (multi-version)' }
              ]},
              { tag: 'select', id: 'nodeFramework', label: 'Framework', options: [
                { value: 'custom', text: 'Custom / Express', selected: true },
                { value: 'nextjs', text: 'Next.js' },
                { value: 'nuxt', text: 'Nuxt' }
              ]}
            ]},
            { type: 'nvm-default', id: 'nvmDefaultVersion', inputId: 'nvmDefault', label: 'Version par défaut NVM', value: '24', placeholder: '24' },
            { type: 'port-row', fields: [
              { tag: 'input', id: 'nodePort', label: 'Port', type: 'number', value: '3000', placeholder: '3000' }
            ]}
          ]
        },
        {
          toggleId: 'enablePython', toggleLabel: 'Python',
          optionsId: 'pythonOptions',
          content: [
            { type: 'form-row', fields: [
              { tag: 'select', id: 'pythonVersionBackend', label: 'Version', options: [
                { value: '3.10', text: '3.10' },
                { value: '3.11', text: '3.11' },
                { value: '3.12', text: '3.12' },
                { value: '3.13', text: '3.13', selected: true },
                { value: '3.14', text: '3.14 (Latest)' }
              ]},
              { tag: 'select', id: 'pythonFrameworkBackend', label: 'Framework', options: [
                { value: 'custom', text: 'Custom', selected: true },
                { value: 'django', text: 'Django' },
                { value: 'flask', text: 'Flask' },
                { value: 'fastapi', text: 'FastAPI' }
              ]}
            ]},
            { type: 'port-row', fields: [
              { tag: 'input', id: 'pythonPort', label: 'Port', type: 'number', value: '8000', placeholder: '8000' }
            ]}
          ]
        },
        {
          toggleId: 'enableJava', toggleLabel: 'Java (Spring Boot)',
          optionsId: 'javaOptions',
          content: [
            { type: 'form-row', fields: [
              { tag: 'select', id: 'javaVersionBackend', label: 'Version Java', options: [
                { value: '11', text: '11 LTS' },
                { value: '17', text: '17 LTS' },
                { value: '21', text: '21 LTS', selected: true },
                { value: '25', text: '25 LTS (Latest)' }
              ]}
            ]},
            { type: 'port-row', fields: [
              { tag: 'input', id: 'javaPort', label: 'Port', type: 'number', value: '8080', placeholder: '8080' }
            ]}
          ]
        }
      ]
    }
  },

  // ---- Database ----
  {
    id: 'section-database',
    title: 'Base de données',
    icon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    navLabel: 'Base de données',
    navIcon: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    body: {
      type: 'service-blocks',
      blocks: [
        {
          toggleId: 'enableMysql', toggleLabel: 'MySQL',
          optionsId: 'mysqlOptions',
          content: [
            { tag: 'select', id: 'mysqlVersion', label: 'Version', options: [
              { value: '8.0', text: '8.0 (EOL avril 2026)' },
              { value: '8.4', text: '8.4 LTS (Recommandé)', selected: true },
              { value: '9.0', text: '9.0 Innovation' },
              { value: '9.6', text: '9.6 Innovation (Latest)' }
            ]},
            { type: 'port-row', fields: [
              { tag: 'input', id: 'mysqlPort', label: 'Port', type: 'number', value: '3306', placeholder: '3306' }
            ]}
          ]
        },
        {
          toggleId: 'enableMariadb', toggleLabel: 'MariaDB',
          optionsId: 'mariadbOptions',
          content: [
            { tag: 'select', id: 'mariadbVersion', label: 'Version', options: [
              { value: '10.11', text: '10.11 LTS' },
              { value: '11.4', text: '11.4 LTS' },
              { value: '11.8', text: '11.8 LTS (Recommandé)', selected: true },
              { value: '12.2', text: '12.2 Rolling' },
              { value: '12.3', text: '12.3 RC (LTS Q2 2026)' }
            ]},
            { type: 'port-row', fields: [
              { tag: 'input', id: 'mariadbPort', label: 'Port', type: 'number', value: '3306', placeholder: '3306' }
            ]}
          ]
        },
        {
          toggleId: 'enablePostgres', toggleLabel: 'PostgreSQL',
          optionsId: 'postgresOptions',
          content: [
            { tag: 'select', id: 'postgresVersion', label: 'Version', options: [
              { value: '14', text: '14' },
              { value: '15', text: '15' },
              { value: '16', text: '16' },
              { value: '17', text: '17' },
              { value: '18', text: '18 (Latest)', selected: true }
            ]},
            { type: 'port-row', fields: [
              { tag: 'input', id: 'postgresPort', label: 'Port', type: 'number', value: '5432', placeholder: '5432' }
            ]}
          ]
        },
        {
          toggleId: 'enableMongo', toggleLabel: 'MongoDB',
          optionsId: 'mongoOptions',
          content: [
            { tag: 'select', id: 'mongoVersion', label: 'Version', options: [
              { value: '5.0', text: '5.0' },
              { value: '6.0', text: '6.0' },
              { value: '7.0', text: '7.0' },
              { value: '8.0', text: '8.0' },
              { value: '8.2', text: '8.2 (Latest)', selected: true }
            ]},
            { type: 'port-row', fields: [
              { tag: 'input', id: 'mongoPort', label: 'Port', type: 'number', value: '27017', placeholder: '27017' }
            ]}
          ]
        }
      ]
    }
  },

  // ---- Cache & Queue ----
  {
    id: 'section-cache',
    title: 'Cache &amp; File d\'attente',
    icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    navLabel: 'Cache & Queue',
    navIcon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    body: {
      type: 'service-blocks',
      blocks: [
        {
          toggleId: 'enableRedis', toggleLabel: 'Redis 7',
          optionsId: 'redisOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'redisPort', label: 'Port', type: 'number', value: '6379', placeholder: '6379' }
            ]}
          ]
        },
        {
          toggleId: 'enableMemcached', toggleLabel: 'Memcached',
          optionsId: 'memcachedOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'memcachedPort', label: 'Port', type: 'number', value: '11211', placeholder: '11211' }
            ]}
          ]
        },
        {
          toggleId: 'enableRabbitmq', toggleLabel: 'RabbitMQ',
          optionsId: 'rabbitmqOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'rabbitmqPort', label: 'Port AMQP', type: 'number', value: '5672', placeholder: '5672' },
              { tag: 'input', id: 'rabbitmqUiPort', label: 'Port UI', type: 'number', value: '15672', placeholder: '15672' }
            ]}
          ]
        }
      ]
    }
  },

  // ---- Tools ----
  {
    id: 'section-tools',
    title: 'Outils',
    icon: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>',
    navLabel: 'Outils',
    navIcon: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>',
    body: {
      type: 'service-blocks',
      blocks: [
        {
          toggleId: 'enableAdminer', toggleLabel: 'Adminer', toggleHint: '(toutes DB)',
          optionsId: 'adminerOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'adminerPort', label: 'Port', type: 'number', value: '8081', placeholder: '8081' }
            ]}
          ]
        },
        {
          toggleId: 'enablePhpmyadmin', toggleLabel: 'phpMyAdmin', toggleHint: '(MySQL / MariaDB)',
          optionsId: 'phpmyadminOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'phpmyadminPort', label: 'Port', type: 'number', value: '8082', placeholder: '8082' }
            ]}
          ]
        },
        {
          toggleId: 'enablePgadmin', toggleLabel: 'pgAdmin', toggleHint: '(PostgreSQL)',
          optionsId: 'pgadminOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'pgadminPort', label: 'Port', type: 'number', value: '8083', placeholder: '8083' }
            ]}
          ]
        },
        {
          toggleId: 'enableMongoexpress', toggleLabel: 'Mongo Express', toggleHint: '(MongoDB)',
          optionsId: 'mongoexpressOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'mongoexpressPort', label: 'Port', type: 'number', value: '8084', placeholder: '8084' }
            ]}
          ]
        },
        {
          toggleId: 'enableMailpit', toggleLabel: 'Mailpit',
          optionsId: 'mailpitOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'mailpitSmtpPort', label: 'Port SMTP', type: 'number', value: '1025', placeholder: '1025' },
              { tag: 'input', id: 'mailpitUiPort', label: 'Port UI', type: 'number', value: '8025', placeholder: '8025' }
            ]}
          ]
        },
        {
          toggleId: 'enableMinio', toggleLabel: 'MinIO (S3)',
          optionsId: 'minioOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'minioPort', label: 'Port API', type: 'number', value: '9000', placeholder: '9000' },
              { tag: 'input', id: 'minioConsolePort', label: 'Port Console', type: 'number', value: '9001', placeholder: '9001' }
            ]}
          ]
        },
        {
          toggleId: 'enableElasticsearch', toggleLabel: 'Elasticsearch 8',
          optionsId: 'elasticsearchOptions',
          content: [
            { type: 'port-row', fields: [
              { tag: 'input', id: 'elasticsearchPort', label: 'Port', type: 'number', value: '9200', placeholder: '9200' }
            ]}
          ]
        }
      ]
    }
  },

  // ---- Environment ----
  {
    id: 'section-environment',
    title: 'Environnement de développement',
    icon: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    navLabel: 'Environnement',
    navIcon: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    body: {
      type: 'env-grid',
      name: 'environment',
      gridStyle: 'grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));',
      options: [
        { value: 'windows-laragon', icon: 'La', name: 'Laragon', desc: 'Windows', checked: true },
        { value: 'windows-herd', icon: 'He', name: 'Herd', desc: 'Windows/Mac' },
        { value: 'windows-xampp', icon: 'Xa', name: 'XAMPP', desc: 'Cross-platform' },
        { value: 'windows-wamp', icon: 'Wa', name: 'WAMP', desc: 'Windows' },
        { value: 'mac-mamp', icon: 'Ma', name: 'MAMP', desc: 'macOS/Windows' },
        { value: 'linux-lamp', icon: 'La', name: 'LAMP', desc: 'Linux' },
        { value: 'linux-local', icon: 'Li', name: 'Linux', desc: 'Standalone' },
        { value: 'mac-local', icon: 'Mc', name: 'macOS', desc: 'Standalone' },
        { value: 'vps-hestia', icon: 'Hs', name: 'HestiaCP', desc: 'VPS Panel' }
      ]
    }
  },

  // ---- SSL ----
  {
    id: 'section-ssl',
    title: 'SSL / HTTPS',
    hint: "Depend de l'environnement",
    hintId: 'sslHint',
    icon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    navLabel: 'SSL / HTTPS',
    navIcon: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    body: {
      type: 'radio-group',
      id: 'sslOptions',
      name: 'ssl',
      ariaLabel: 'Sélection du mode SSL',
      options: [
        { value: 'none', icon: '--', label: 'Aucun (HTTP)', desc: '', checked: true },
        { value: 'mkcert', icon: 'm', label: 'mkcert (dev)', desc: '' },
        { value: 'letsencrypt', icon: 'L', label: "Let's Encrypt", desc: '' },
        { value: 'caddy-auto', icon: 'C', label: 'Caddy (auto)', desc: '' },
        { value: 'traefik-auto', icon: 'T', label: 'Traefik (auto)', desc: '' }
      ]
    }
  },

  // ---- Preview ----
  {
    id: 'section-preview',
    title: 'Aperçu &amp; Téléchargement',
    icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    navLabel: 'Aperçu',
    navIcon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    body: { type: 'preview' }
  }
];
