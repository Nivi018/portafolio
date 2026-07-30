# 🔧 Guía de Troubleshooting Post-Deploy

## Problemas Comunes y Soluciones

### 1. Error: "Application error: a client-side exception has occurred"

**Causa**: Error en el código del cliente o falta una variable de entorno.

**Solución**:
1. Ve a Vercel Dashboard → Tu proyecto → **Logs**
2. Busca el error específico en los logs
3. Verifica que todas las variables de entorno estén configuradas
4. Revisa la consola del navegador (F12)

---

### 2. Error: "PrismaClientInitializationError"

**Causa**: Prisma no se generó correctamente durante el build.

**Solución**:
1. Ve a Vercel → **Settings** → **Build & Development Settings**
2. Cambia **Install Command** a: `npm install && prisma generate`
3. O agrega `"postinstall": "prisma generate"` en `package.json` (ya está)
4. Haz redeploy

---

### 3. Error: "Database connection failed"

**Causa**: `DATABASE_URL` incorrecta o Supabase inactivo.

**Solución**:
1. Verifica que `DATABASE_URL` esté correcta en Vercel
2. Ve a Supabase Dashboard y verifica que el proyecto esté activo
3. Si Supabase está pausado, reactívalo
4. Prueba la conexión desde Supabase SQL Editor

```sql
SELECT 1;
```

---

### 4. Error: "NEXTAUTH_URL mismatch"

**Causa**: `NEXTAUTH_URL` no coincide con la URL de Vercel.

**Solución**:
1. Ve a Vercel → **Settings** → **Environment Variables**
2. Actualiza `NEXTAUTH_URL` con tu URL real:
   - Preview: `https://booking-system-git-main-tu-usuario.vercel.app`
   - Producción: `https://tu-dominio.com`
3. Haz redeploy

---

### 5. Error: "Stripe webhook signature verification failed"

**Causa**: `STRIPE_WEBHOOK_SECRET` incorrecto o no configurado.

**Solución**:
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Clic en tu webhook
3. Clic en **"Reveal"** en Signing Secret
4. Copia el secret (empieza con `whsec_...`)
5. Actualiza `STRIPE_WEBHOOK_SECRET` en Vercel
6. Haz redeploy

---

### 6. Los emails no se envían

**Causa**: `RESEND_API_KEY` incorrecta o dominio no verificado.

**Solución**:
1. Verifica `RESEND_API_KEY` en Vercel
2. Ve a [Resend Dashboard](https://resend.com/dashboard)
3. Verifica que tu API key esté activa
4. Si usas dominio personalizado, verifica el dominio
5. Revisa los logs de Resend para ver errores

---

### 7. La app es muy lenta

**Causa**: Queries lentas o falta de caché.

**Solución**:
1. Revisa las queries de Prisma en los logs
2. Agrega índices a columnas frecuentemente consultadas
3. Usa `select` específico en lugar de `include` cuando sea posible
4. Implementa caché con `unstable_cache` de Next.js
5. Considera usar Vercel Pro para mejor performance

---

### 8. Error 500 al cargar páginas

**Causa**: Error no manejado en el servidor.

**Solución**:
1. Ve a Vercel → **Logs** → **Runtime Logs**
2. Busca el stack trace
3. Identifica el error específico
4. Revisa si falta alguna variable de entorno
5. Verifica que la base de datos esté accesible

---

### 9. Las imágenes no cargan

**Causa**: URLs de imágenes externas bloqueadas o formato incorrecto.

**Solución**:
1. Verifica que las URLs de imágenes sean HTTPS
2. Configura `next.config.js` con dominios permitidos:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}
```

3. Usa `next/image` en lugar de `<img>`

---

### 10. Error: "Module not found"

**Causa**: Dependencia no instalada o import incorrecto.

**Solución**:
1. Verifica que la dependencia esté en `package.json`
2. Ejecuta `npm install` localmente
3. Haz commit de `package.json` y `package-lock.json`
4. Push y redeploy

---

## 🔍 Cómo Debuggear

### Ver Logs en Vercel
1. Ve a tu proyecto en Vercel
2. Clic en **Logs** en el menú lateral
3. Filtra por:
   - **Build Logs**: Errores durante el build
   - **Runtime Logs**: Errores en producción
   - **Function Logs**: Logs de API routes

### Ver Logs de Supabase
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Logs** → **Postgres Logs**
4. Filtra por errores

### Ver Logs de Stripe
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Ve a **Developers** → **Logs**
3. Filtra por tu endpoint

### Ver Logs de Resend
1. Ve a [Resend Dashboard](https://resend.com/dashboard)
2. Ve a **Logs**
3. Revisa emails enviados y errores

---

## 🚨 Errores Críticos que Requieren Atención Inmediata

### Database Connection Pool Exhausted
**Síntoma**: Errores intermitentes "too many connections"

**Solución**:
1. Usa connection pooling en `DATABASE_URL`
2. En Supabase, usa el pooler (puerto 6543) en lugar de direct (5432)
3. Upgrade tu plan de Supabase si es necesario

### Memory Limit Exceeded
**Síntoma**: Error "JavaScript heap out of memory" durante build

**Solución**:
1. En Vercel, ve a **Settings** → **Functions**
2. Aumenta el memory limit
3. Optimiza las imágenes y assets
4. Divide el código en chunks más pequeños

### API Rate Limit
**Síntoma**: Errores 429 de APIs externas

**Solución**:
1. Implementa caché
2. Usa rate limiting
3. Upgrade de plan en el servicio correspondiente

---

## 📞 Contacto de Soporte

### Vercel
- [Documentación](https://vercel.com/docs)
- [Discord](https://vercel.com/discord)
- [Support](https://vercel.com/support)

### Supabase
- [Documentación](https://supabase.com/docs)
- [Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

### Stripe
- [Documentación](https://stripe.com/docs)
- [Support](https://support.stripe.com)
- [Discord](https://discord.gg/stripe)

### Resend
- [Documentación](https://resend.com/docs)
- [Support](https://resend.com/support)

---

## ✅ Checklist de Salud Post-Deploy

Ejecuta esto regularmente (semanal):

- [ ] Revisar logs de Vercel por errores
- [ ] Verificar que los emails se envían correctamente
- [ ] Revisar uso de base de datos en Supabase
- [ ] Verificar pagos en Stripe Dashboard
- [ ] Revisar performance en Vercel Analytics
- [ ] Verificar backups de Supabase
- [ ] Actualizar dependencias (`npm outdated`)
- [ ] Revisar seguridad (npm audit)
- [ ] Verificar SSL/HTTPS
- [ ] Revisar límites del plan
