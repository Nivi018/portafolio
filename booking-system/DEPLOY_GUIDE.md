# 🚀 Guía de Deploy a Vercel

## Paso 1: Preparar el Repositorio

### 1.1 Inicializar Git (si no lo has hecho)
```bash
cd booking-system
git init
git add .
git commit -m "feat: ready for deploy"
```

### 1.2 Crear Repositorio en GitHub

1. Ve a [https://github.com/new](https://github.com/new)
2. Nombre: `booking-system` (o el que prefieras)
3. Visibilidad: **Privado** (recomendado) o Público
4. **NO** inicialices con README (ya tienes uno)
5. Clic en "Create repository"

### 1.3 Conectar y Subir
```bash
git remote add origin https://github.com/TU_USUARIO/booking-system.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Crear Cuenta en Vercel

1. Ve a [https://vercel.com/signup](https://vercel.com/signup)
2. Regístrate con GitHub
3. Autoriza a Vercel a acceder a tus repositorios

---

## Paso 3: Importar Proyecto

1. En el dashboard de Vercel, clic en **"Add New..."** → **"Project"**
2. Busca el repositorio `booking-system`
3. Clic en **"Import"**

---

## Paso 4: Configurar el Proyecto

### 4.1 Framework Preset
- **Framework Preset**: Next.js (se detecta automáticamente)
- **Root Directory**: `./` (dejar por defecto)
- **Build Command**: Dejar por defecto (usa `npm run build`)

### 4.2 Variables de Entorno

En la sección **"Environment Variables"**, agrega las siguientes variables:

#### Base de datos
```
DATABASE_URL = postgresql://postgres:98741236bussines@db.bmrqlujvkkmtxjvuqrph.supabase.co:5432/postgres
DIRECT_URL = postgresql://postgres:98741236bussines@db.bmrqlujvkkmtxjvuqrph.supabase.co:5432/postgres
```

#### Auth.js
```
NEXTAUTH_SECRET = J2MKPYWXJEY6pxZ8R4GWywGxByNAO+KCpd0WZYZMs50=
NEXTAUTH_URL = https://tu-proyecto.vercel.app
```
**IMPORTANTE**: Después del primer deploy, actualiza `NEXTAUTH_URL` con tu URL real.

#### Resend
```
RESEND_API_KEY = re_tu_clave_de_resend
EMAIL_FROM = noreply@bookingsystem.com
```

#### Supabase (públicas)
```
NEXT_PUBLIC_SUPABASE_URL = https://bmrqlujvkkmtxjvuqrph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_WiJTfR9R4DbJQWtEzNElNg_69bFLs9D
```

#### Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_51TlhO2GeBJRo5WYE9d9dLNS8eYQ78epDDCCItcLU5acnpmreSCV3HV63C1oD8AgAsp9UgR6YxfK0XZPMLhQ4T6iW00ALNzvDm6
STRIPE_SECRET_KEY = sk_test_tu_clave_secreta_de_stripe
STRIPE_WEBHOOK_SECRET = (dejar vacío por ahora, configurar después)
```

#### App
```
NEXT_PUBLIC_APP_URL = https://tu-proyecto.vercel.app
NEXT_PUBLIC_APP_NAME = BookingSystem
```

### 4.3 Deploy

1. Clic en **"Deploy"**
2. Espera 2-5 minutos mientras se construye
3. Una vez completado, verás "🎉 Congratulations!"

---

## Paso 5: Ejecutar Migraciones en Producción

Después del primer deploy exitoso, necesitas ejecutar las migraciones en la base de datos de producción.

### Opción A: Desde tu máquina local

1. Actualiza tu `.env` local con las credenciales de producción:
```env
DATABASE_URL="postgresql://postgres:98741236bussines@db.bmrqlujvkkmtxjvuqrph.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:98741236bussines@db.bmrqlujvkkmtxjvuqrph.supabase.co:5432/postgres"
```

2. Ejecuta las migraciones:
```bash
npx prisma migrate deploy
```

3. (Opcional) Ejecuta el seed:
```bash
npm run db:seed
```

### Opción B: Desde Supabase SQL Editor

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Abre tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta el contenido de `prisma/migrations/20240101000000_init/migration.sql`
5. (Opcional) Ejecuta los inserts del seed

---

## Paso 6: Configurar Webhook de Stripe

### 6.1 Crear Endpoint en Stripe

1. Ve a [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Clic en **"Add endpoint"**
3. **Endpoint URL**: `https://tu-proyecto.vercel.app/api/payments/webhook`
4. **Events to send**: Selecciona:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Clic en **"Add endpoint"**

### 6.2 Obtener Webhook Secret

1. En la página del webhook creado, clic en **"Reveal"** en "Signing secret"
2. Copia el secret (empieza con `whsec_...`)
3. En Vercel, ve a **Settings** → **Environment Variables**
4. Actualiza `STRIPE_WEBHOOK_SECRET` con el valor
5. Haz redeploy para que tome efecto

---

## Paso 7: Configurar Dominio Personalizado (Opcional)

### 7.1 Comprar Dominio

Puedes comprar un dominio en:
- [Namecheap](https://namecheap.com)
- [Google Domains](https://domains.google)
- [Cloudflare](https://cloudflare.com)

### 7.2 Agregar a Vercel

1. En Vercel, ve a **Settings** → **Domains**
2. Clic en **"Add"**
3. Ingresa tu dominio: `tudominio.com`
4. Sigue las instrucciones para configurar DNS
5. Espera a que se propague (puede tardar hasta 48h)

### 7.3 Actualizar Variables de Entorno

Una vez configurado el dominio:
```
NEXTAUTH_URL = https://tudominio.com
NEXT_PUBLIC_APP_URL = https://tudominio.com
```

---

## Paso 8: Verificación Post-Deploy

### 8.1 Checklist

- [ ] La app carga en `https://tu-proyecto.vercel.app`
- [ ] Puedes registrar un nuevo usuario
- [ ] Puedes iniciar sesión
- [ ] Puedes crear un negocio (después de login)
- [ ] Puedes crear servicios
- [ ] Puedes ver la página pública del negocio
- [ ] Puedes hacer una reserva
- [ ] Los emails se envían correctamente
- [ ] Los pagos con Stripe funcionan (usar tarjeta de prueba 4242 4242 4242 4242)
- [ ] El modo oscuro funciona
- [ ] La búsqueda de negocios funciona

### 8.2 Monitoreo

Vercel proporciona:
- **Logs**: Ve a tu proyecto → **Logs**
- **Analytics**: Ve a **Analytics** (requiere plan Pro)
- **Speed Insights**: Ve a **Speed Insights** (gratis)

---

## 🔧 Troubleshooting

### Error: "Prisma Client not generated"
**Solución**: El script `postinstall` debería ejecutarlo. Si no:
```bash
# En Vercel, ve a Settings → Build & Development Settings
# Agrega: Install Command = "npm install && prisma generate"
```

### Error: "Database connection failed"
**Solución**: 
1. Verifica que `DATABASE_URL` esté correcta
2. Verifica que Supabase esté activo
3. Revisa los logs en Vercel

### Error: "NEXTAUTH_SECRET missing"
**Solución**: Agrega `NEXTAUTH_SECRET` en Environment Variables

### Error: "Stripe webhook signature verification failed"
**Solución**: 
1. Verifica que `STRIPE_WEBHOOK_SECRET` esté correcto
2. Asegúrate de que el endpoint en Stripe apunte a la URL correcta

### La app es muy lenta
**Solución**:
1. Revisa las queries de Prisma (usa `select` específico)
2. Agrega índices a columnas frecuentemente consultadas
3. Usa `revalidate` en lugar de `force-dynamic` donde sea posible

---

## 📊 Configuración Post-Deploy Recomendada

### 1. Configurar Dominio Personalizado
- Comprar dominio
- Agregar a Vercel
- Configurar SSL automático

### 2. Configurar Email Personalizado
- En Resend, verificar tu dominio
- Cambiar `EMAIL_FROM` a `noreply@tudominio.com`

### 3. Cambiar a Stripe Live
- Activar cuenta de Stripe
- Obtener keys de producción (sk_live_..., pk_live_...)
- Actualizar variables de entorno

### 4. Configurar Monitoring
- Integrar Sentry para tracking de errores
- Configurar Vercel Analytics
- Configurar alertas en Supabase

### 5. Backup Automático
- Configurar backups automáticos en Supabase
- Programar exports de datos críticos

---

## 🎉 ¡Listo!

Tu aplicación está en producción. Comparte la URL y empieza a recibir usuarios.

**URLs importantes**:
- App: `https://tu-proyecto.vercel.app`
- Dashboard Vercel: `https://vercel.com/dashboard`
- Supabase: `https://app.supabase.com`
- Stripe: `https://dashboard.stripe.com`
