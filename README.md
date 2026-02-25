# Container Stack Generator

**Générateur universel de stacks Docker et Podman avec support multi-environnement**

Version 3.1.0 - Versions à jour (Février 2026)

---

##  Qu'est-ce que c'est ?

Un générateur web qui crée des configurations complètes de containers (Docker ou Podman) adaptées à votre environnement de développement.

**Un seul outil pour tout gérer :**
- Choisissez Docker **OU** Podman
- Sélectionnez votre environnement (Laragon, XAMPP, Linux, etc.)
- Configurez votre stack (PHP, Node, databases, etc.)
- Téléchargez une configuration prête à l'emploi

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

### 3. Presets d'application

- WordPress
- Laravel
- Symfony
- Next.js
- NestJS
- Angular
- Django
- Flask
- Spring Boot

### 4. Services disponibles

**Backend**
- PHP 8.1 → 8.5 (5 versions)
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

**Outils**
- Adminer
- phpMyAdmin
- pgAdmin
- Mongo Express
- Mailpit
- MinIO (S3)
- Elasticsearch 8

---

##  Utilisation

### Étape 1 : Ouvrir l'interface

Ouvrez `index.html` dans votre navigateur ou via un serveur web local.

### Étape 2 : Configuration

1. **Container Runtime** : Choisir Docker ou Podman
2. **Environnement** : Sélectionner votre environnement de développement
3. **Projet** : Nom, domaine (optionnel), repository Git (optionnel)
4. **Preset** : Choisir un preset ou configuration manuelle
5. **Services** : Activer les services nécessaires
6. **SSL** : Configurer selon l'environnement

### Étape 3 : Télécharger

Cliquer sur "Télécharger ZIP" pour obtenir tous les fichiers générés.

### Étape 4 : Installation

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
├── README.md                 # Instructions spécifiques
├── start-containers.ps1/sh   # Script de démarrage
├── stop-containers.ps1/sh    # Script d'arrêt
├── php/Dockerfile            # (si PHP)
├── node/Dockerfile           # (si Node.js)
├── nginx/default.conf        # (si Nginx)
├── certs/                    # (si SSL mkcert)
└── src/                      # Code source
```

---

##  Commandes générées

Les commandes sont automatiquement adaptées au runtime choisi :

| Action | Docker | Podman |
|--------|--------|--------|
| Démarrer | `docker compose up -d` | `podman-compose up -d` |
| Arrêter | `docker compose down` | `podman-compose down` |
| Logs | `docker compose logs -f` | `podman-compose logs -f` |
| Réseau | `docker network create` | `podman network create` |
| Volume | `docker volume create` | `podman volume create` |

---

##  Architecture

### Environnements avec serveur web intégré
(Laragon, Herd, XAMPP, WAMP, MAMP, LAMP)

```
Navigateur (HTTPS)
    ↓
Serveur Web Local (SSL)
    ↓
Containers Docker/Podman (HTTP)
```

### Environnements standalone
(Linux, macOS)

```
Navigateur (HTTPS)
    ↓
Container Nginx/Caddy (SSL dans container)
    ↓
Autres containers
```

---

##  Documentation

Consultez les fichiers générés pour des instructions détaillées selon votre configuration.

---

##  Docker vs Podman

### Utilisez Docker si :
- Vous débutez avec les containers
- Vous travaillez en équipe (standard de facto)
- Vous utilisez Docker Desktop
- Vous voulez le maximum de compatibilité

### Utilisez Podman si :
- Vous êtes sur Linux et préférez rootless
- Vous avez besoin de sécurité renforcée
- Vous voulez éviter un daemon permanent
- Vous êtes familier avec les containers

---

##  Installation des runtimes

### Docker

**Windows/macOS**
```bash
# Docker Desktop
winget install Docker.DockerDesktop  # Windows
brew install --cask docker           # macOS
```

**Linux**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Podman

**Windows**
```powershell
winget install RedHat.Podman
```

**macOS**
```bash
brew install podman
podman machine init
podman machine start
```

**Linux**
```bash
# Ubuntu/Debian
sudo apt install podman

# Fedora/RHEL
sudo dnf install podman

# Arch
sudo pacman -S podman
```

---

##  Sécurité

- Génération de mots de passe sécurisés (32 caractères)
- Content Security Policy activée
- Variables d'environnement dans `.env`
- Certificats SSL (mkcert ou Let's Encrypt)
- Validation des entrées utilisateur

---

##  Avantages du projet unifié

**Pour l'utilisateur**
- ✅ Un seul outil à retenir
- ✅ Choix flexible Docker ou Podman
- ✅ Expérience cohérente
- ✅ Documentation centralisée

**Pour la maintenance**
- ✅ Code unique à maintenir
- ✅ Pas de duplication
- ✅ Corrections de bugs unifiées
- ✅ ~50% de code en moins

---

##  Compatibilité

- **Docker** : 20.10+
- **Podman** : 3.0+
- **Windows** : 10/11
- **macOS** : 11+
- **Linux** : Toutes distributions récentes
- **Navigateurs** : Tous navigateurs modernes

---

##  Exemples

### Exemple 1 : Laravel sur Laragon avec Docker

```
1. Runtime : Docker
2. Environnement : Laragon
3. Preset : Laravel 11
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
4. Services : Node 20 + PostgreSQL 16
5. SSL : mkcert
6. ./start-containers.sh
7. Accès : https://localhost
```

### Exemple 3 : WordPress sur XAMPP avec Docker

```
1. Runtime : Docker
2. Environnement : XAMPP
3. Preset : WordPress
4. Services : PHP 8.4 + MySQL 8.4
5. Configurer VirtualHost Apache
6. .\start-containers.ps1
7. Accès : http://localhost/mon-wp
```

---

##  Dépannage

### Port 80 déjà utilisé

```bash
# Windows
netstat -ano | findstr :80

# Linux/macOS
sudo lsof -i :80
```

### Runtime non trouvé

Vérifier l'installation :
```bash
docker --version    # ou
podman --version
```

### SSL ne fonctionne pas (Laragon/Herd)

1. Vérifier que le SSL est activé dans l'environnement
2. Redémarrer l'environnement
3. Vérifier les certificats dans le système

---

##  Changelog

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
-  NVM par défaut : 20 → 24 LTS Krypton

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

---

##  Support

- Documentation complète dans les fichiers générés
- README adapté à votre configuration
- Exemples pour chaque environnement
- Instructions de dépannage

---

##  Licence

MIT License - Libre d'utilisation

---

##  Crédits

- Interface moderne et responsive
- Génération côté client (aucune donnée envoyée à un serveur)
- Sécurité renforcée (CSP, validation, mots de passe sécurisés)
- Support universel (Windows, macOS, Linux)

---

**Container Stack Generator v3.1.0**
*Un projet, deux runtimes, huit environnements, toutes les versions à jour* 🚀
"#container" 
