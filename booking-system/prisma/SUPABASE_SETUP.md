# 🗄️ Configuración de Supabase

## Paso 1: Crear proyecto en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Haz clic en **"New Project"**
3. Completa:
   - **Name**: `booking-system` (o el nombre que prefieras)
   - **Database Password**: genera una contraseña segura y **guárdala**
   - **Region**: elige la más cercana a tus usuarios
4. Haz clic en **"Create new project"**
5. Espera 1-2 minutos mientras se inicializa

## Paso 2: Obtener credenciales

1. En tu proyecto, ve a **Settings** → **Database**
2. En la sección **"Connection string"**, selecciona **"URI"**
3. Copia la URL que se ve así:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. También copia la **Direct connection** (puerto 5432) para migraciones

## Paso 3: Configurar variables de entorno

Edita tu archivo `.env`:

```env
# Connection pooling (para la app en runtime)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Direct connection (para migraciones)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Reemplaza:
- `[PROJECT-REF]` con el ID de tu proyecto
- `[PASSWORD]` con la contraseña que configuraste
- `[REGION]` con la región (ej: `us-east-1`)

## Paso 4: Ejecutar migraciones

```bash
# Generar el cliente de Prisma
npx prisma generate

# Aplicar las migraciones a Supabase
npx prisma migrate deploy

# O en desarrollo, crear nueva migración
npx prisma migrate dev --name init
```

## Paso 5: Configurar Row Level Security (opcional pero recomendado)

Una vez que las tablas estén creadas, ejecuta el script SQL:

```bash
# Opción 1: Desde Supabase SQL Editor
# Ve a SQL Editor en Supabase y pega el contenido de prisma/supabase-setup.sql

# Opción 2: Desde la terminal con psql
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" -f prisma/supabase-setup.sql
```

## Paso 6: Seed de datos (opcional)

Para poblar la base de datos con datos de prueba:

```bash
npm run db:seed
```

## Paso 7: Verificar con Prisma Studio

```bash
npx prisma studio
```

Esto abre una GUI en [http://localhost:5555](http://localhost:5555) para ver y editar tus datos.

## 🔧 Troubleshooting

### Error: "Authentication failed"
- Verifica que la contraseña en `DATABASE_URL` sea correcta
- Asegúrate de codificar caracteres especiales en la contraseña (`@` → `%40`, `#` → `%23`)

### Error: "Connection refused"
- Verifica que estés usando el puerto correcto (5432 para migraciones, 6543 para pooling)
- Verifica que tu IP esté permitida en Supabase (Settings → Database → Connection pooling)

### Error: "Too many connections"
- Usa la connection string con pooling (puerto 6543) para la aplicación
- Usa la direct connection (puerto 5432) solo para migraciones

## 📊 Configuración recomendada para producción

| Entorno | URL a usar | Puerto |
|---------|-----------|--------|
| Desarrollo (migraciones) | `DIRECT_URL` | 5432 |
| Producción (app) | `DATABASE_URL` (con pooling) | 6543 |
| Vercel Deploy | `DATABASE_URL` (con pooling) | 6543 |

## 🔐 Seguridad

- **Nunca** commitees el archivo `.env` a Git
- Usa contraseñas diferentes para desarrollo y producción
- Habilita RLS en producción con el script `supabase-setup.sql`
- Configura backups automáticos en Supabase (Settings → Database → Backups)
