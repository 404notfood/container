/* ========================================
   tpl/dockerfiles.js — Dockerfile templates
   ======================================== */

Object.assign(Templates, {

  phpDockerfile(config) {
    const ver = config.phpVersion;
    const exts = config.phpExtensions || [];
    const installExts = exts.filter(e => !['redis', 'memcached', 'imagick', 'xdebug'].includes(e));
    const peclExts = exts.filter(e => ['redis', 'memcached', 'imagick', 'xdebug'].includes(e));

    let df = `FROM php:${ver}-fpm-alpine\n\n`;
    df += `# Install system dependencies\nRUN apk add --no-cache \\\n`;
    df += `    freetype-dev libjpeg-turbo-dev libpng-dev libzip-dev icu-dev \\\n`;
    df += `    oniguruma-dev libxml2-dev curl-dev autoconf g++ make\n\n`;

    if (installExts.length) {
      if (exts.includes('gd')) {
        df += `RUN docker-php-ext-configure gd --with-freetype --with-jpeg\n`;
      }
      df += `RUN docker-php-ext-install -j$(nproc) ${installExts.join(' ')}\n\n`;
    }

    if (peclExts.length) {
      for (const ext of peclExts) {
        df += `RUN pecl install ${ext} && docker-php-ext-enable ${ext}\n`;
      }
      df += '\n';
    }

    df += `# Install Composer\nCOPY --from=composer:latest /usr/bin/composer /usr/bin/composer\n\n`;

    if (config.nginxSocket) {
      df += `# PHP-FPM Unix socket\nRUN sed -i 's|listen = 127.0.0.1:9000|listen = /var/run/php/php-fpm.sock|' /usr/local/etc/php-fpm.d/www.conf \\\n    && sed -i 's|;listen.owner = www-data|listen.owner = www-data|' /usr/local/etc/php-fpm.d/www.conf \\\n    && sed -i 's|;listen.group = www-data|listen.group = www-data|' /usr/local/etc/php-fpm.d/www.conf \\\n    && mkdir -p /var/run/php\n\n`;
    }

    df += `WORKDIR /var/www/html\n\nEXPOSE 9000\nCMD ["php-fpm"]\n`;
    return df;
  },

  nodeDockerfile(config) {
    const ver = config.nodeVersion;

    if (ver === 'nvm') {
      const defaultVer = config.nvmDefault || '24';
      let df = `FROM ubuntu:22.04\n\nENV DEBIAN_FRONTEND=noninteractive\nENV NVM_DIR=/root/.nvm\n\n`;
      df += `RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*\n\n`;
      df += `# Install NVM\nRUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash\n\n`;
      df += `# Install default Node version\nRUN bash -c "source $NVM_DIR/nvm.sh && nvm install ${defaultVer} && nvm alias default ${defaultVer}"\n\n`;
      df += `WORKDIR /app\nCOPY package*.json ./\nRUN bash -c "source $NVM_DIR/nvm.sh && npm install"\nCOPY . .\n\n`;
      df += `EXPOSE 3000\nCMD ["bash", "-c", "source $NVM_DIR/nvm.sh && npm run dev"]\n`;
      return df;
    }

    let df = `FROM node:${ver}-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm install\n\nCOPY . .\n\n`;
    df += `EXPOSE 3000\nCMD ["npm", "run", "dev"]\n`;
    return df;
  },

  pythonDockerfile(config) {
    const pyVer = config.pythonVersionVal || '3.12';
    const fw = config.pythonFrameworkVal || 'custom';

    let df = `FROM python:${pyVer}-slim\n\nENV PYTHONDONTWRITEBYTECODE=1\nENV PYTHONUNBUFFERED=1\n\nWORKDIR /app\n\n`;
    df += `COPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY . .\n\n`;

    if (fw === 'django') {
      df += `EXPOSE 8000\nCMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]\n`;
    } else if (fw === 'flask') {
      df += `EXPOSE 8000\nCMD ["flask", "run", "--host=0.0.0.0", "--port=8000"]\n`;
    } else if (fw === 'fastapi') {
      df += `EXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]\n`;
    } else {
      df += `EXPOSE 8000\nCMD ["python", "main.py"]\n`;
    }
    return df;
  },

  javaDockerfile(config) {
    const javaVer = config.javaVersionVal || '21';
    const build = config.springBuildVal || 'maven';

    let df = '';
    if (build === 'gradle') {
      df += `FROM gradle:${javaVer === '17' ? '8-jdk17' : '8-jdk21'}-alpine AS build\nWORKDIR /app\nCOPY . .\nRUN gradle bootJar --no-daemon\n\n`;
      df += `FROM eclipse-temurin:${javaVer}-jre-alpine\nWORKDIR /app\nCOPY --from=build /app/build/libs/*.jar app.jar\n`;
    } else {
      df += `FROM maven:3.9-eclipse-temurin-${javaVer} AS build\nWORKDIR /app\nCOPY pom.xml .\nRUN mvn dependency:go-offline\nCOPY src ./src\nRUN mvn package -DskipTests\n\n`;
      df += `FROM eclipse-temurin:${javaVer}-jre-alpine\nWORKDIR /app\nCOPY --from=build /app/target/*.jar app.jar\n`;
    }
    df += `\nEXPOSE 8080\nCMD ["java", "-jar", "app.jar"]\n`;
    return df;
  },

  angularDockerfile(config) {
    const nodeVer = config.nodeVersion !== 'nvm' ? config.nodeVersion : '24';
    return `# Build stage
FROM node:${nodeVer}-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist/*/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
  }
});
