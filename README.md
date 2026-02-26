# Container Stack Generator

**Générateur universel de stacks Docker et Podman avec support multi-environnement**

Version 4.0.5 - Février 2026

---

##  Qu'est-ce que c'est ?

Une application web statique (HTML/CSS/JavaScript) qui génère des configurations complètes de containers (Docker ou Podman) adaptées à votre environnement de développement.

**Générateur côté client :**
- ✅ Aucune donnée envoyée à un serveur
- ✅ Génération 100% dans le navigateur
- ✅ Téléchargement instantané d'un ZIP prêt à l'emploi
- ✅ Sécurité maximale (CSP, validation, mots de passe sécurisés)

**Un seul outil pour tout gérer :**
- Choisissez Docker **OU** Podman
- Sélectionnez votre environnement (Laragon, XAMPP, Linux, etc.)
- Configurez votre stack (PHP, Node, bases de données, etc.)
- Téléchargez une configuration prête à l'emploi

---

##  Architecture technique

### Stack applicative

**Frontend uniquement :**
- HTML5 sémantique
- CSS moderne (découpage modulaire)
- JavaScript vanilla (ES6+)
- Aucun framework frontend
- Aucun backend requis

**Structure modulaire :**
```
css/
├── reset.css         # Reset CSS
├── layout.css        # Layout principal
├── cards.css         # Styles des cartes
├── components.css    # Composants réutilisables
├── forms.css         # Formulaires
├── sidebar.css       # Navigation latérale
├── preview.css       # Aperçu des fichiers
├── responsive.css    # Media queries
└── style.css         # Point d'entrée

js/
├── ui-data.js        # Définitions déclaratives des sections UI
├── ui-builder.js     # Construction dynamique de l'interface
├── generators.js     # Générateurs de fichiers (compose, env, readme, scripts)
├── index.js          # Point d'entrée de l'app
└── tpl/              # Templates de génération
    ├── compose.js    # Templates docker-compose.yml
    ├── env.js        # Templates .env
    ├── readme.js     # Templates README.md
    └── scripts.js    # Templates scripts de démarrage

src/
└── html/             # Partiels HTML (système de build)
    ├── index.template.html      # Template principal
    ├── _head.html               # <head> et meta tags
    ├── _header.html             # En-tête de l'app
    ├── _sidebar.html            # Navigation latérale
    ├── _section-*.html          # Sections du formulaire (11 fichiers)
    └── _footer.html             # Pied de page
```

### Système de build HTML

L'application utilise un système de build simple pour assembler les partiels HTML :

**build.js** (Node.js)
```bash
# Assemble les partiels HTML en un seul index.html
node build.js
```

**build.sh** (Bash, sans dépendances)
```bash
# Alternative sans Node.js
bash build.sh
```

Le système remplace les directives `<!-- @include _filename.html -->` dans `index.template.html` par le contenu des fichiers partiels correspondants. Cela permet de :
- ✅ Maintenir le HTML de manière modulaire (16 fichiers séparés)
- ✅ Générer un seul `index.html` pour la production
- ✅ Faciliter la maintenance et les modifications
- ✅ Pas de dépendances complexes (Node.js natif ou Bash pur)

### Bibliothèques externes (CDN)

- **Highlight.js** : Coloration syntaxique des aperçus
- **JSZip** : Création d'archives ZIP côté client
- **FileSaver.js** : Téléchargement de fichiers

---

##  Fonctionnalités principales

### 1. Support de 2 container runtimes

**Docker** (recommandé)
- Le plus populaire et le mieux supporté
- Compatible avec tous les OS
- Commande : `docker compose`

**Podman** (alternatif)
- Rootless (sans privilèges root)
- Compatible Docker
- Commande : `podman-compose`

### 2. Support de 8 environnements

**Windows (4)**
- Laragon - SSL automatique
- Herd - Moderne, optimisé Laravel
- XAMPP - Cross-platform
- WAMP - Classique Windows

**macOS (2)**
- MAMP - Interface graphique
- macOS Standalone - Production-ready

**Linux (2)**
- LAMP - Stack système
- Linux Standalone - Production-ready

### 3. Presets d'application (10)

- Manuel (configuration libre)
- WordPress
- Laravel (avec starter kits)
- Symfony
- Next.js
- NestJS
- Angular
- Django
- Flask
- Spring Boot

### 4. Services disponibles

**Serveurs Web**
- Nginx (avec option Unix socket)
- Apache
- Caddy (SSL automatique)
- Traefik (microservices)

**Backend**
- PHP 8.1 → 8.5 (5 versions) + 16 extensions
- Node.js 18/20/22/24/25 + NVM (6 options)
- Python 3.10 → 3.14 (5 versions)
- Java 11/17/21/25 LTS (4 versions)

**Bases de données**
- MySQL 8.0/8.4/9.0/9.6 (4 versions)
- MariaDB 10.11 → 12.3 (5 versions)
- PostgreSQL 14 → 18 (5 versions)
- MongoDB 5.0 → 8.2 (5 versions)

**Cache & Queue**
- Redis 7
- Memcached
- RabbitMQ

**Outils de développement**
- Adminer (toutes DB)
- phpMyAdmin (MySQL/MariaDB)
- pgAdmin (PostgreSQL)
- Mongo Express (MongoDB)
- Mailpit (mail catcher)
- MinIO (S3 local)
- Elasticsearch 8

---

##  Installation et utilisation

### Prérequis

**Pour utiliser l'application :**
- Un navigateur moderne (Chrome, Firefox, Edge, Safari)
- Docker ou Podman installé sur votre machine (pour utiliser les configurations générées)

**Pour le développement (optionnel) :**
- Node.js (pour `build.js`) OU Bash (pour `build.sh`)
- Nécessaire uniquement si vous modifiez les fichiers HTML dans `src/html/`

### Installation (développeurs)

Si vous souhaitez modifier l'application :

```bash
# Cloner ou télécharger le projet
git clone <votre-repo>
cd stack-generator

# Modifier les partiels HTML dans src/html/
# Puis régénérer index.html avec :

# Option 1 : Node.js
node build.js

# Option 2 : Bash (sans Node.js)
bash build.sh

# Le fichier index.html est régénéré automatiquement
```

**Note :** Le fichier `index.html` est déjà pré-généré dans le dépôt, vous n'avez pas besoin de le reconstruire pour utiliser l'application.

### Utilisation (utilisateurs finaux)

### Étape 1 : Lancer l'application

**Option A : Fichier local (simple)**
```bash
# Ouvrir directement index.html dans le navigateur
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

**Option B : Serveur web local (recommandé)**
```bash
# Python
python -m http.server 8000

# PHP
php -S localhost:8000

# Node.js (avec http-server)
npx http-server

# Accès : http://localhost:8000
```

### Étape 2 : Configuration

1. **Projet** : Nom, domaine (optionnel), repository Git (optionnel)
2. **Container Runtime** : Docker ou Podman
3. **Preset** : Choisir un preset ou configuration manuelle
4. **Serveur Web** : Nginx, Apache, Caddy, Traefik ou aucun
5. **Backend** : Activer PHP, Node.js, Python et/ou Java
6. **Base de données** : MySQL, MariaDB, PostgreSQL et/ou MongoDB
7. **Cache & Queue** : Redis, Memcached, RabbitMQ
8. **Outils** : Adminer, phpMyAdmin, pgAdmin, etc.
9. **Environnement** : Sélectionner votre environnement de développement
10. **SSL** : Configuration SSL/HTTPS selon l'environnement
11. **Aperçu** : Visualiser et télécharger

### Étape 3 : Télécharger

Cliquer sur "Télécharger ZIP" pour obtenir tous les fichiers générés.

### Étape 4 : Déployer

#### Windows (Laragon/Herd)

```powershell
# Extraire dans C:\laragon\www\mon-projet
.\start-containers.ps1

# Accès : https://mon-projet.test
```

#### Windows (XAMPP/WAMP)

```powershell
# 1. Extraire
# 2. Configurer VirtualHost (voir README généré)
.\start-containers.ps1

# Accès : http://localhost/mon-projet
```

#### macOS (MAMP)

```bash
# 1. Extraire dans /Applications/MAMP/htdocs/mon-projet
# 2. Configurer VirtualHost (voir README généré)
chmod +x start-containers.sh
./start-containers.sh

# Accès : http://localhost:8888/mon-projet
```

#### Linux/macOS (Standalone)

```bash
chmod +x start-containers.sh
./start-containers.sh

# Accès : https://localhost (si SSL activé)
```

---

##  Fichiers générés

```
mon-projet/
├── docker-compose.yml        # Configuration des containers
├── .env                      # Variables d'environnement
├── README.md                 # Instructions spécifiques à la configuration
├── start-containers.ps1/sh   # Script de démarrage (Windows/Unix)
├── stop-containers.ps1/sh    # Script d'arrêt (Windows/Unix)
├── php/
│   ├── Dockerfile            # Image PHP personnalisée (si PHP)
│   └── php.ini               # Configuration PHP
├── node/
│   └── Dockerfile            # Image Node.js personnalisée (si Node.js)
├── python/
│   └── Dockerfile            # Image Python personnalisée (si Python)
├── java/
│   └── Dockerfile            # Image Java personnalisée (si Java)
├── nginx/
│   └── default.conf          # Configuration Nginx (si Nginx)
├── apache/
│   └── vhost.conf            # Configuration Apache (si Apache)
├── certs/                    # Certificats SSL (si mkcert)
└── src/                      # Répertoire du code source
```

---

##  Fonctionnalités avancées

### Configuration des ports

Tous les services permettent de personnaliser leurs ports :
- Serveur web (HTTP/HTTPS)
- Bases de données
- Outils d'administration
- Services backend

### Options PHP avancées

- Choix de 16 extensions PHP
- Configuration php.ini personnalisée
- Communication Nginx via Unix socket (performance)

### Options Node.js avancées

- Support NVM pour multi-versions
- Configuration de frameworks (Next.js, Nuxt, Express)
- Port personnalisable

### SSL flexible

- **none** : HTTP uniquement
- **mkcert** : Certificats locaux de confiance (dev)
- **Let's Encrypt** : Certificats gratuits (prod)
- **Caddy auto** : SSL automatique avec Caddy
- **Traefik auto** : SSL automatique avec Traefik

### Adaptation intelligente

L'application adapte automatiquement :
- Les commandes selon le runtime (docker/podman)
- La configuration SSL selon l'environnement
- Les scripts selon l'OS (PowerShell/Bash)
- Les chemins selon la plateforme

---

##  Sécurité

**Génération côté client**
- Aucune donnée envoyée à un serveur distant
- Traitement 100% local dans le navigateur
- Aucun tracking, aucune analytics

**Bonnes pratiques**
- Content Security Policy (CSP) stricte
- Génération de mots de passe sécurisés (32 caractères aléatoires)
- Validation des entrées utilisateur
- Sanitisation des noms de fichiers
- Variables sensibles dans `.env` (non commité)

**Headers de sécurité**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

##  Développement

### Structure du projet

```
stack-generator/
├── index.html           # Page principale (générée par build.js/build.sh)
├── build.js             # Script de build HTML (Node.js)
├── build.sh             # Script de build HTML (Bash)
├── css/                 # Feuilles de style modulaires (8 fichiers)
├── js/                  # Scripts JavaScript modulaires
│   ├── ui-data.js
│   ├── ui-builder.js
│   ├── generators.js
│   ├── index.js
│   └── tpl/             # Templates de génération
├── src/
│   └── html/            # Partiels HTML (16 fichiers)
│       ├── index.template.html
│       └── _*.html      # Partiels (head, header, sections, footer)
├── README.md            # Documentation
└── .gitignore           # Fichiers à ignorer
```

### Workflow de développement

**1. Modifier l'interface HTML**
```bash
# Éditer les partiels dans src/html/
vim src/html/_section-backend.html

# Régénérer index.html
node build.js
# ou
bash build.sh

# Ouvrir dans le navigateur pour tester
open index.html
```

**2. Modifier les styles**
```bash
# Éditer directement les fichiers CSS
vim css/components.css

# Pas de build nécessaire, recharger le navigateur
```

**3. Modifier la logique JavaScript**
```bash
# Éditer les fichiers JS
vim js/generators.js

# Pas de build nécessaire, recharger le navigateur
```

**4. Ajouter une nouvelle section UI**
```javascript
// 1. Ajouter la définition dans js/ui-data.js
// 2. Créer le partial src/html/_section-nouvelle.html (optionnel)
// 3. Ajouter la directive dans src/html/index.template.html
// 4. Reconstruire : node build.js
```

### Principes de conception

**Modulaire**
- HTML découpé en 16 partiels réutilisables
- CSS découplé en 8 fichiers thématiques
- JS organisé par responsabilité (ui, générateurs, templates)
- Templates de génération séparés par type de fichier

**Déclaratif**
- UI définie dans `ui-data.js` (structure de données)
- Construction automatique via `ui-builder.js`
- Ajout de sections sans modifier le HTML directement
- Système de build simple (Node.js ou Bash)

**Accessible**
- Navigation au clavier complète
- ARIA labels et rôles WCAG
- Indicateurs de progression visuels
- Messages d'erreur contextuels
- Focus management

**Responsive**
- Mobile-first (breakpoints 768px, 1024px)
- Navigation latérale adaptative
- Grilles fluides avec CSS Grid
- Touch-friendly sur mobile

**Performance**
- Génération côté client (pas de serveur)
- Assets externes via CDN (cache navigateur)
- Code JavaScript modulaire et léger
- CSS optimisé sans framework lourd

---

##  Compatibilité

**Navigateurs**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Container Runtimes**
- Docker 20.10+
- Podman 3.0+

**Systèmes d'exploitation**
- Windows 10/11
- macOS 11+ (Big Sur+)
- Linux (toutes distributions récentes)

---

##  Exemples d'usage

### Exemple 1 : Laravel sur Laragon avec Docker

```
1. Runtime : Docker
2. Environnement : Laragon
3. Preset : Laravel 11 + Breeze React
4. Services : PHP 8.4 + MySQL 8.4 + Redis
5. Télécharger et extraire dans C:\laragon\www\mon-laravel
6. .\start-containers.ps1
7. Accès : https://mon-laravel.test
```

### Exemple 2 : Next.js sur Linux avec Podman

```
1. Runtime : Podman
2. Environnement : Linux Standalone
3. Preset : Next.js
4. Services : Node 24 + PostgreSQL 18
5. SSL : mkcert
6. ./start-containers.sh
7. Accès : https://localhost
```

### Exemple 3 : API Python Django

```
1. Runtime : Docker
2. Environnement : Linux Standalone
3. Preset : Django 5.1
4. Services : Python 3.13 + PostgreSQL 18 + Redis
5. Serveur web : Nginx
6. SSL : Let's Encrypt
7. ./start-containers.sh
```

---

##  Dépannage

### L'application ne charge pas

- Vérifier la console du navigateur (F12)
- S'assurer que JavaScript est activé
- Essayer un autre navigateur

### Le téléchargement ZIP échoue

- Vérifier les paramètres de téléchargement du navigateur
- Désactiver les bloqueurs de publicités
- Essayer en navigation privée

### Port déjà utilisé

```bash
# Windows
netstat -ano | findstr :80

# Linux/macOS
sudo lsof -i :80
```

### Runtime non trouvé

```bash
# Vérifier l'installation
docker --version    # ou
podman --version
```

---

##  Changelog

### Version 3.1.5 (2026-02-26)
-  Découpage de `template.js` en modules (compose, env, readme, scripts)
-  Amélioration de la structure JavaScript
-  Documentation mise à jour

### Version 3.1.0 (2026-02-24)
-  Mise à jour de toutes les versions vers février 2026
-  PHP : 5 versions (8.1 → 8.5)
-  Node.js : 6 options (18/20/22/24/25 + NVM)
-  Python : 5 versions (3.10 → 3.14)
-  Java : 4 versions LTS (11/17/21/25)
-  Angular : 5 versions (17 → 21)
-  MySQL : 4 versions (8.0 → 9.6)
-  MariaDB : 5 versions (10.11 → 12.3)
-  PostgreSQL : 5 versions (14 → 18)
-  MongoDB : 5 versions (5.0 → 8.2)
-  Labels informatifs (EOL, LTS, Latest, Recommandé)
-  NVM par défaut : 24 LTS Krypton

### Version 3.0.0 (2026-02-24)
-  Fusion des projets imgpodman et imgdocker
-  Sélection du container runtime (Docker/Podman)
-  Adaptation automatique des commandes
-  Interface unifiée
-  Documentation centralisée

### Version 2.6.0 (2026-02-24)
-  Support de 8 environnements de développement
-  Scripts PowerShell/Bash automatiques
-  Adaptation SSL par environnement
-  Découpage CSS et HTML
-  Interface responsive améliorée

---

##  Contribution

Ce projet est ouvert aux contributions. N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouveaux presets
- Améliorer la documentation

---

##  Licence

MIT License - Libre d'utilisation, modification et distribution

---

##  Crédits

**Développé par Laurent (404NotFood)**
- Site : https://404notfood.fr
- Générateur 100% côté client
- Aucune donnée collectée
- Open source

**Technologies utilisées**
- HTML5 / CSS3 / JavaScript ES6+
- Highlight.js (coloration syntaxique)
- JSZip (génération de ZIP)
- FileSaver.js (téléchargement)

---

**Container Stack Generator v3.1.5**
*Un projet, deux runtimes, huit environnements, toutes les versions à jour*
*Application web statique • Génération côté client • Sécurité maximale*
