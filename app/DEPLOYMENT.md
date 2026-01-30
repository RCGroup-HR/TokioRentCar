# Guía de Deployment - Sistema de Renta de Vehículos

## Requisitos del Servidor (VPS)

- **Sistema Operativo**: Ubuntu 20.04+ / Debian 11+
- **RAM**: Mínimo 2GB (recomendado 4GB)
- **CPU**: Mínimo 2 cores
- **Almacenamiento**: Mínimo 20GB
- **Node.js**: v20+
- **MySQL**: 8.0+
- **Nginx**: Para proxy reverso (opcional pero recomendado)

## Opción 1: Deployment con Docker (Recomendado)

### 1. Instalar Docker y Docker Compose

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
```

### 2. Clonar el proyecto

```bash
git clone <tu-repositorio> /opt/rentcar
cd /opt/rentcar/app
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Editar las variables:
```
DATABASE_URL="mysql://rentcar:tu_password_seguro@db:3306/rentcar_db"
NEXTAUTH_URL="https://tudominio.com"
NEXTAUTH_SECRET="genera-una-clave-segura-de-32-caracteres"
```

### 4. Iniciar con Docker Compose

```bash
# Construir y levantar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Ejecutar seed (datos iniciales)
docker-compose exec app npx prisma db seed
```

---

## Opción 2: Deployment Manual

### 1. Instalar dependencias del sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git build-essential -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Instalar MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### 2. Configurar MySQL

```bash
sudo mysql

CREATE DATABASE rentcar_db;
CREATE USER 'rentcar'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON rentcar_db.* TO 'rentcar'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Clonar y configurar el proyecto

```bash
cd /opt
git clone <tu-repositorio> rentcar
cd rentcar/app

# Instalar dependencias
npm ci --production=false

# Configurar variables
cp .env.example .env
nano .env
```

### 4. Configurar base de datos y build

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Ejecutar seed
npx prisma db seed

# Build de producción
npm run build
```

### 5. Configurar PM2 para manejo de procesos

```bash
# Instalar PM2
sudo npm install -g pm2

# Iniciar aplicación
pm2 start npm --name "rentcar" -- start

# Configurar auto-inicio
pm2 startup
pm2 save
```

---

## Configurar Nginx como Proxy Reverso (Optimizado)

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/rentcar
```

Contenido del archivo (optimizado para producción):
```nginx
# Redirección HTTP a HTTPS
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL se configurará con Certbot

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Compresión Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Caché de archivos estáticos de Next.js
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Imágenes subidas - servir directamente
    location /uploads {
        alias /opt/rentcar/app/public/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Proxy principal a Next.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads - límite de tamaño
    client_max_body_size 10M;
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/rentcar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Configurar SSL con Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## Credenciales por Defecto

Después del seed, puedes acceder al panel de administración con:

- **URL**: https://tudominio.com/admin
- **Email**: admin@tokiorentcar.com
- **Password**: admin123

**IMPORTANTE**: Cambiar la contraseña inmediatamente después del primer acceso.

---

## Comandos Útiles

```bash
# Ver logs (Docker)
docker-compose logs -f app

# Ver logs (PM2)
pm2 logs rentcar

# Reiniciar aplicación (Docker)
docker-compose restart app

# Reiniciar aplicación (PM2)
pm2 restart rentcar

# Actualizar aplicación
git pull
npm ci
npm run build
pm2 restart rentcar
# O con Docker:
docker-compose up -d --build
```

---

## Backups

### Base de datos

```bash
# Backup manual
mysqldump -u rentcar -p rentcar_db > backup_$(date +%Y%m%d).sql

# Restaurar
mysql -u rentcar -p rentcar_db < backup_20240101.sql
```

### Imágenes subidas

```bash
# Backup de uploads
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/
```

---

## Soporte

Para cualquier problema durante el deployment, revisar:
1. Logs de la aplicación
2. Logs de Nginx: `/var/log/nginx/error.log`
3. Logs de MySQL: `/var/log/mysql/error.log`
