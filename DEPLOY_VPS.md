# Guía de Despliegue en VPS - TokioRentCar

## Pre-requisitos en el VPS

Asegúrate de tener instalado:
- Node.js 18+ (recomendado 20 LTS)
- MySQL 8.0+
- Nginx
- PM2 (gestor de procesos)
- Git
- Certbot (para SSL)

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar MySQL
sudo apt install mysql-server

# Instalar Nginx
sudo apt install nginx

# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx
```

---

## Paso 1: Configurar Base de Datos MySQL

```bash
# Conectar a MySQL
sudo mysql

# Crear base de datos y usuario
CREATE DATABASE rentcar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rentcar_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA_AQUI';
GRANT ALL PRIVILEGES ON rentcar_db.* TO 'rentcar_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**IMPORTANTE:** Usa una contraseña segura (mínimo 16 caracteres, letras, números y símbolos).

---

## Paso 2: Subir el Proyecto al VPS

### Opción A: Con Git
```bash
# En el VPS
cd /var/www
sudo git clone https://tu-repositorio.git tokiorentcar
sudo chown -R $USER:$USER /var/www/tokiorentcar
```

### Opción B: Con SCP/SFTP
```bash
# Desde tu máquina local
scp -r ./app usuario@tu-vps:/var/www/tokiorentcar
```

---

## Paso 3: Configurar Variables de Entorno

```bash
cd /var/www/tokiorentcar/app

# Crear archivo .env (NO copiarlo del desarrollo)
nano .env
```

Contenido del `.env`:
```env
# Base de datos
DATABASE_URL="mysql://rentcar_user:TU_CONTRASEÑA_SEGURA@localhost:3306/rentcar_db"

# NextAuth - GENERAR UN SECRET NUEVO
NEXTAUTH_SECRET="GENERA_UNO_NUEVO_CON_OPENSSL"
NEXTAUTH_URL="https://tudominio.com"

# Entorno
NODE_ENV="production"
```

**Generar NEXTAUTH_SECRET seguro:**
```bash
openssl rand -base64 32
# Copiar el resultado al .env
```

---

## Paso 4: Instalar Dependencias y Construir

```bash
cd /var/www/tokiorentcar/app

# Instalar dependencias
npm ci --production=false

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones de base de datos
npx prisma db push

# Ejecutar seed (datos iniciales)
npm run db:seed

# Construir la aplicación
npm run build
```

---

## Paso 5: Configurar PM2

Crear archivo de configuración PM2:

```bash
nano /var/www/tokiorentcar/ecosystem.config.js
```

Contenido:
```javascript
module.exports = {
  apps: [{
    name: 'tokiorentcar',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/tokiorentcar/app',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Iniciar la aplicación:
```bash
cd /var/www/tokiorentcar
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Paso 6: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/tokiorentcar
```

Contenido:
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL (se configurará con Certbot)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Configuración SSL segura
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Headers de seguridad adicionales
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Límite de tamaño de uploads
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/tokiorentcar.access.log;
    error_log /var/log/nginx/tokiorentcar.error.log;

    # Archivos estáticos (uploads)
    location /uploads {
        alias /var/www/tokiorentcar/app/public/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy a Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

Activar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/tokiorentcar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Paso 7: Configurar SSL con Certbot

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Renovación automática:
```bash
sudo certbot renew --dry-run
```

---

## Paso 8: Configurar Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Paso 9: Verificación Final

1. **Verificar que la app está corriendo:**
   ```bash
   pm2 status
   pm2 logs tokiorentcar
   ```

2. **Verificar Nginx:**
   ```bash
   sudo systemctl status nginx
   ```

3. **Probar la aplicación:**
   - Visita `https://tudominio.com`
   - Intenta hacer login
   - Verifica que los uploads funcionan

---

## Comandos Útiles

```bash
# Ver logs de la aplicación
pm2 logs tokiorentcar

# Reiniciar aplicación
pm2 restart tokiorentcar

# Ver estado
pm2 status

# Actualizar después de cambios
cd /var/www/tokiorentcar/app
git pull
npm ci
npm run build
pm2 restart tokiorentcar

# Ver logs de Nginx
sudo tail -f /var/log/nginx/tokiorentcar.error.log
```

---

## Mantenimiento

### Backups de Base de Datos
```bash
# Crear backup
mysqldump -u rentcar_user -p rentcar_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u rentcar_user -p rentcar_db < backup_20240130.sql
```

### Actualizar la Aplicación
```bash
cd /var/www/tokiorentcar/app
git pull origin main
npm ci
npx prisma db push
npm run build
pm2 restart tokiorentcar
```

---

## Solución de Problemas

### Error: EACCES permission denied
```bash
sudo chown -R $USER:$USER /var/www/tokiorentcar
```

### Error: Port 3000 already in use
```bash
pm2 delete all
pm2 start ecosystem.config.js
```

### Error: MySQL connection refused
```bash
sudo systemctl status mysql
sudo systemctl start mysql
```

### Ver errores de la app
```bash
pm2 logs tokiorentcar --err --lines 100
```

---

## Checklist de Seguridad Post-Despliegue

- [ ] Cambiar contraseña por defecto del usuario admin
- [ ] Verificar que NEXTAUTH_SECRET es único y seguro
- [ ] Verificar que SSL está activo (candado verde)
- [ ] Verificar que no se puede acceder a /api/customers sin login
- [ ] Deshabilitar acceso SSH por contraseña (usar solo claves)
- [ ] Configurar fail2ban para proteger SSH
- [ ] Configurar backups automáticos de la BD
- [ ] Verificar headers de seguridad en https://securityheaders.com

---

## Credenciales Iniciales

Después del seed, las credenciales por defecto son:

**Super Admin:**
- Email: `admin@rentcar.com`
- Password: `Admin123!`

**IMPORTANTE:** Cambiar estas credenciales inmediatamente después del primer login.
