-- ============================================
-- Script SQL para Supabase
-- Ejecutar después de crear el proyecto en Supabase
-- ============================================

-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Configurar Row Level Security (RLS)
-- Las tablas se crearán con Prisma, solo configuramos RLS

-- ============================================
-- IMPORTANTE: Ejecutar las migraciones de Prisma primero:
--   npx prisma migrate deploy
--   o
--   npx prisma db push
-- ============================================

-- ============================================
-- Row Level Security Policies
-- (Ejecutar después de que Prisma cree las tablas)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Policy: Los negocios activos son visibles públicamente
CREATE POLICY "Active businesses are public" ON businesses
    FOR SELECT USING (active = true);

CREATE POLICY "Owners can update their business" ON businesses
    FOR UPDATE USING (auth.uid()::text = "ownerId");

-- Policy: Los servicios activos son visibles públicamente
CREATE POLICY "Active services are public" ON services
    FOR SELECT USING (active = true);

-- Policy: Los horarios son visibles públicamente
CREATE POLICY "Business hours are public" ON business_hours
    FOR SELECT USING (true);

-- Policy: Las citas son visibles para el cliente y el negocio
CREATE POLICY "Clients can view own appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = "clientId");

CREATE POLICY "Business owners can view their appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses
            WHERE businesses.id = appointments."businessId"
            AND businesses."ownerId" = auth.uid()::text
        )
    );

-- Policy: Cualquiera puede crear citas (después se valida en el backend)
CREATE POLICY "Anyone can create appointments" ON appointments
    FOR INSERT WITH CHECK (true);

-- ============================================
-- Índices adicionales para optimización
-- ============================================

CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(date, status);
CREATE INDEX IF NOT EXISTS idx_services_business_active ON services("businessId", active);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses("ownerId");

-- ============================================
-- Función helper para verificar disponibilidad
-- ============================================

CREATE OR REPLACE FUNCTION check_business_open(
    p_business_id TEXT,
    p_date DATE,
    p_start_time TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_day_of_week TEXT;
    v_open_time TEXT;
    v_close_time TEXT;
    v_is_active BOOLEAN;
    v_is_blocked BOOLEAN;
BEGIN
    -- Obtener día de la semana
    v_day_of_week := TRIM(TO_CHAR(p_date, 'DAY'));
    v_day_of_week := CASE v_day_of_week
        WHEN 'SUNDAY' THEN 'SUNDAY'
        WHEN 'MONDAY' THEN 'MONDAY'
        WHEN 'TUESDAY' THEN 'TUESDAY'
        WHEN 'WEDNESDAY' THEN 'WEDNESDAY'
        WHEN 'THURSDAY' THEN 'THURSDAY'
        WHEN 'FRIDAY' THEN 'FRIDAY'
        WHEN 'SATURDAY' THEN 'SATURDAY'
    END;

    -- Verificar si está bloqueado
    SELECT EXISTS (
        SELECT 1 FROM blocked_dates
        WHERE "businessId" = p_business_id
        AND date = p_date
    ) INTO v_is_blocked;

    IF v_is_blocked THEN
        RETURN FALSE;
    END IF;

    -- Verificar horario
    SELECT "openTime", "closeTime", "isActive"
    INTO v_open_time, v_close_time, v_is_active
    FROM business_hours
    WHERE "businessId" = p_business_id
    AND "dayOfWeek" = v_day_of_week;

    IF NOT FOUND OR NOT v_is_active THEN
        RETURN FALSE;
    END IF;

    RETURN p_start_time >= v_open_time AND p_start_time < v_close_time;
END;
$$ LANGUAGE plpgsql;
