import { Client } from "pg";
import * as bcrypt from "bcryptjs";

const DB_URL = "postgresql://postgres:12345@localhost:5432/booking_system";

async function main() {
  console.log("🌱 Insertando datos de prueba en base de datos local...\n");

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Limpiar datos existentes
  console.log("🧹 Limpiando datos existentes...");
  await client.query("DELETE FROM appointments");
  await client.query("DELETE FROM payments");
  await client.query("DELETE FROM blocked_dates");
  await client.query("DELETE FROM business_hours");
  await client.query("DELETE FROM services");
  await client.query("DELETE FROM businesses");
  await client.query("DELETE FROM sessions");
  await client.query("DELETE FROM accounts");
  await client.query("DELETE FROM users");
  console.log("✅ Datos limpiados\n");

  // Generar hash de password
  const hashedPassword = await bcrypt.hash("password123", 12);

  // 1. Crear usuarios
  console.log("👥 Creando usuarios...");
  await client.query(`
    INSERT INTO users (id, email, "emailVerified", name, phone, password, role, "createdAt", "updatedAt") VALUES
    ('usr_admin_001', 'admin@bookingsystem.com', NOW(), 'Administrador', '+5219991234567', $1, 'SUPER_ADMIN', NOW(), NOW()),
    ('usr_dueno_001', 'dueno1@example.com', NOW(), 'Carlos Méndez', '+5219991111111', $1, 'BUSINESS_OWNER', NOW(), NOW()),
    ('usr_dueno_002', 'dueno2@example.com', NOW(), 'María López', '+5219992222222', $1, 'BUSINESS_OWNER', NOW(), NOW()),
    ('usr_dueno_003', 'dueno3@example.com', NOW(), 'Dr. Roberto Sánchez', '+5219993333333', $1, 'BUSINESS_OWNER', NOW(), NOW())
  `, [hashedPassword]);

  // Crear 10 clientes
  for (let i = 1; i <= 10; i++) {
    const names = ['Juan Pérez', 'Ana García', 'Luis Martínez', 'Sofía Hernández', 'Diego Rodríguez',
                   'Carmen López', 'Pedro Sánchez', 'Laura Ramírez', 'Miguel Torres', 'Elena Flores'];
    const name = names[(i - 1) % names.length];
    await client.query(`
      INSERT INTO users (id, email, "emailVerified", name, phone, password, role, "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), $3, $4, $5, 'CLIENT', NOW(), NOW())
    `, [`usr_client_${i.toString().padStart(3, '0')}`, `cliente${i}@example.com`, name, `+521999${(1000000 + i * 111).toString().padStart(7, '0')}`, hashedPassword]);
  }
  console.log("✅ 14 usuarios creados (1 admin, 3 dueños, 10 clientes)\n");

  // 2. Crear negocios
  console.log("🏢 Creando negocios...");
  await client.query(`
    INSERT INTO businesses (id, "ownerId", name, slug, description, address, phone, email, website, active, "createdAt", "updatedAt") VALUES
    ('biz_barberia_001', 'usr_dueno_001', 'Barbería El Corte Perfecto', 'barberia-el-corte-perfecto', 'Barbería especializada en cortes modernos y clásicos. Más de 10 años de experiencia.', 'Av. Reforma 123, Col. Centro, Mérida', '+529991234567', 'dueno1@example.com', 'https://barberia-el-corte-perfecto.com', true, NOW(), NOW()),
    ('biz_spa_001', 'usr_dueno_002', 'Spa Relajación Total', 'spa-relajacion-total', 'Centro de bienestar y spa con masajes terapéuticos, faciales y tratamientos corporales.', 'Calle 60 #200, Col. Centro, Mérida', '+529991234568', 'dueno2@example.com', 'https://spa-relajacion-total.com', true, NOW(), NOW()),
    ('biz_dental_001', 'usr_dueno_003', 'Consultorio Dental Sonrisa', 'consultorio-dental-sonrisa', 'Consultorio dental con tecnología de punta. Limpiezas, ortodoncia y estética dental.', 'Av. Itzáes 456, Col. Sambulá, Mérida', '+529991234569', 'dueno3@example.com', 'https://consultorio-dental-sonrisa.com', true, NOW(), NOW())
  `);
  console.log("✅ 3 negocios creados\n");

  // 3. Crear servicios
  console.log("💼 Creando servicios...");
  await client.query(`
    INSERT INTO services (id, "businessId", name, description, duration, price, currency, active, "maxBookingsPerSlot", "createdAt", "updatedAt") VALUES
    ('svc_barberia_001', 'biz_barberia_001', 'Corte de cabello', 'Corte profesional para caballero', 30, 200.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_barberia_002', 'biz_barberia_001', 'Corte + Barba', 'Corte de cabello y arreglo de barba', 45, 280.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_barberia_003', 'biz_barberia_001', 'Corte niño', 'Corte especial para niños', 20, 150.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_barberia_004', 'biz_barberia_001', 'Afeitado clásico', 'Afeitado con navaja y toalla caliente', 30, 180.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_spa_001', 'biz_spa_001', 'Masaje relajante 60min', 'Masaje corporal completo con aceites esenciales', 60, 800.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_spa_002', 'biz_spa_001', 'Masaje terapéutico 90min', 'Masaje profundo para aliviar tensiones musculares', 90, 1100.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_spa_003', 'biz_spa_001', 'Facial hidratante', 'Limpieza facial profunda con hidratación', 45, 600.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_spa_004', 'biz_spa_001', 'Tratamiento corporal', 'Exfoliación y envoltura corporal completa', 120, 1500.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_dental_001', 'biz_dental_001', 'Consulta general', 'Revisión general y diagnóstico', 30, 500.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_dental_002', 'biz_dental_001', 'Limpieza dental', 'Profilaxis y limpieza profesional', 45, 800.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_dental_003', 'biz_dental_001', 'Blanqueamiento', 'Tratamiento de blanqueamiento dental', 60, 2500.00, 'MXN', true, 1, NOW(), NOW()),
    ('svc_dental_004', 'biz_dental_001', 'Ortodoncia consulta', 'Consulta inicial de ortodoncia', 45, 600.00, 'MXN', true, 1, NOW(), NOW())
  `);
  console.log("✅ 12 servicios creados\n");

  // 4. Crear horarios
  console.log("🕐 Creando horarios...");
  await client.query(`
    INSERT INTO business_hours (id, "businessId", "dayOfWeek", "openTime", "closeTime", "isActive", "createdAt", "updatedAt") VALUES
    -- Barbería
    ('hrs_barb_mon', 'biz_barberia_001', 'MONDAY', '09:00', '20:00', true, NOW(), NOW()),
    ('hrs_barb_tue', 'biz_barberia_001', 'TUESDAY', '09:00', '20:00', true, NOW(), NOW()),
    ('hrs_barb_wed', 'biz_barberia_001', 'WEDNESDAY', '09:00', '20:00', true, NOW(), NOW()),
    ('hrs_barb_thu', 'biz_barberia_001', 'THURSDAY', '09:00', '20:00', true, NOW(), NOW()),
    ('hrs_barb_fri', 'biz_barberia_001', 'FRIDAY', '09:00', '21:00', true, NOW(), NOW()),
    ('hrs_barb_sat', 'biz_barberia_001', 'SATURDAY', '10:00', '21:00', true, NOW(), NOW()),
    ('hrs_barb_sun', 'biz_barberia_001', 'SUNDAY', '10:00', '14:00', true, NOW(), NOW()),
    -- Spa
    ('hrs_spa_mon', 'biz_spa_001', 'MONDAY', '10:00', '19:00', true, NOW(), NOW()),
    ('hrs_spa_tue', 'biz_spa_001', 'TUESDAY', '10:00', '19:00', true, NOW(), NOW()),
    ('hrs_spa_wed', 'biz_spa_001', 'WEDNESDAY', '10:00', '19:00', true, NOW(), NOW()),
    ('hrs_spa_thu', 'biz_spa_001', 'THURSDAY', '10:00', '19:00', true, NOW(), NOW()),
    ('hrs_spa_fri', 'biz_spa_001', 'FRIDAY', '10:00', '20:00', true, NOW(), NOW()),
    ('hrs_spa_sat', 'biz_spa_001', 'SATURDAY', '09:00', '20:00', true, NOW(), NOW()),
    -- Dental
    ('hrs_dent_mon', 'biz_dental_001', 'MONDAY', '08:00', '18:00', true, NOW(), NOW()),
    ('hrs_dent_tue', 'biz_dental_001', 'TUESDAY', '08:00', '18:00', true, NOW(), NOW()),
    ('hrs_dent_wed', 'biz_dental_001', 'WEDNESDAY', '08:00', '18:00', true, NOW(), NOW()),
    ('hrs_dent_thu', 'biz_dental_001', 'THURSDAY', '08:00', '18:00', true, NOW(), NOW()),
    ('hrs_dent_fri', 'biz_dental_001', 'FRIDAY', '08:00', '15:00', true, NOW(), NOW())
  `);
  console.log("✅ 18 horarios creados\n");

  // 5. Fechas bloqueadas
  console.log("🚫 Creando fechas bloqueadas...");
  await client.query(`
    INSERT INTO blocked_dates (id, "businessId", date, reason, "createdAt") VALUES
    ('blk_navidad_barb', 'biz_barberia_001', '2026-12-25', 'Navidad - Cerrado', NOW()),
    ('blk_anio_barb', 'biz_barberia_001', '2027-01-01', 'Año Nuevo - Cerrado', NOW()),
    ('blk_navidad_spa', 'biz_spa_001', '2026-12-25', 'Navidad - Cerrado', NOW()),
    ('blk_anio_spa', 'biz_spa_001', '2027-01-01', 'Año Nuevo - Cerrado', NOW()),
    ('blk_navidad_dent', 'biz_dental_001', '2026-12-25', 'Navidad - Cerrado', NOW())
  `);
  console.log("✅ 5 fechas bloqueadas creadas\n");

  // 6. Reservas pasadas
  console.log("📅 Creando reservas pasadas...");
  for (let i = 1; i <= 15; i++) {
    const clientIds = ['usr_client_001', 'usr_client_002', 'usr_client_003', 'usr_client_004', 'usr_client_005',
                       'usr_client_006', 'usr_client_007', 'usr_client_008', 'usr_client_009', 'usr_client_010'];
    const businesses = ['biz_barberia_001', 'biz_spa_001', 'biz_dental_001'];
    const services = [
      ['svc_barberia_001', 'svc_barberia_002', 'svc_barberia_003', 'svc_barberia_004'],
      ['svc_spa_001', 'svc_spa_002', 'svc_spa_003', 'svc_spa_004'],
      ['svc_dental_001', 'svc_dental_002', 'svc_dental_003', 'svc_dental_004']
    ];
    const statuses = ['COMPLETED', 'COMPLETED', 'CANCELLED', 'COMPLETED'];

    const clientId = clientIds[i % 10];
    const businessId = businesses[i % 3];
    const serviceId = services[i % 3][i % 4];
    const status = statuses[i % 4];
    const daysAgo = i * 3 + 1;

    await client.query(`
      INSERT INTO appointments (id, "clientId", "businessId", "serviceId", date, "startTime", "endTime", status, "clientName", "clientEmail", "clientPhone", notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, CURRENT_DATE - $5::int, '10:00', '10:30', $6::"AppointmentStatus", $7, $8, $9, $10, NOW() - ($5::int * INTERVAL '1 day'), NOW() - ($5::int * INTERVAL '1 day'))
    `, [`apt_past_${i.toString().padStart(3, '0')}`, clientId, businessId, serviceId, daysAgo, status,
         `Cliente ${i}`, `cliente${(i % 10) + 1}@example.com`, `+521999${(1000000 + i).toString().padStart(7, '0')}`,
         i % 3 === 0 ? 'Cliente regular, muy satisfecho' : null]);
  }
  console.log("✅ 15 reservas pasadas creadas\n");

  // 7. Reservas futuras
  console.log("📅 Creando reservas futuras...");
  for (let i = 1; i <= 20; i++) {
    const clientIds = ['usr_client_001', 'usr_client_002', 'usr_client_003', 'usr_client_004', 'usr_client_005',
                       'usr_client_006', 'usr_client_007', 'usr_client_008', 'usr_client_009', 'usr_client_010'];
    const businesses = ['biz_barberia_001', 'biz_spa_001', 'biz_dental_001'];
    const services = [
      ['svc_barberia_001', 'svc_barberia_002', 'svc_barberia_003', 'svc_barberia_004'],
      ['svc_spa_001', 'svc_spa_002', 'svc_spa_003', 'svc_spa_004'],
      ['svc_dental_001', 'svc_dental_002', 'svc_dental_003', 'svc_dental_004']
    ];
    const statuses = ['PENDING', 'CONFIRMED', 'CONFIRMED', 'CONFIRMED'];

    const clientId = clientIds[i % 10];
    const businessId = businesses[i % 3];
    const serviceId = services[i % 3][i % 4];
    const status = statuses[i % 4];
    const hour = (9 + (i % 8)).toString().padStart(2, '0');

    await client.query(`
      INSERT INTO appointments (id, "clientId", "businessId", "serviceId", date, "startTime", "endTime", status, "clientName", "clientEmail", "clientPhone", notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::int, $6, $7, $8::"AppointmentStatus", $9, $10, $11, $12, NOW(), NOW())
    `, [`apt_fut_${i.toString().padStart(3, '0')}`, clientId, businessId, serviceId, i + 1, `${hour}:00`, `${hour}:30`, status,
         `Cliente ${i}`, `cliente${(i % 10) + 1}@example.com`, `+521999${(1000000 + i).toString().padStart(7, '0')}`,
         i % 5 === 0 ? 'Primera visita' : null]);
  }
  console.log("✅ 20 reservas futuras creadas\n");

  // Resumen
  const counts = await client.query(`
    SELECT
      (SELECT count(*) FROM users) as usuarios,
      (SELECT count(*) FROM businesses) as negocios,
      (SELECT count(*) FROM services) as servicios,
      (SELECT count(*) FROM business_hours) as horarios,
      (SELECT count(*) FROM blocked_dates) as fechas_bloqueadas,
      (SELECT count(*) FROM appointments) as reservas
  `);
  const c = counts.rows[0];
  console.log("📊 Resumen:");
  console.log(`   👥 Usuarios: ${c.usuarios}`);
  console.log(`   🏢 Negocios: ${c.negocios}`);
  console.log(`   💼 Servicios: ${c.servicios}`);
  console.log(`   🕐 Horarios: ${c.horarios}`);
  console.log(`   🚫 Fechas bloqueadas: ${c.fechas_bloqueadas}`);
  console.log(`   📅 Reservas: ${c.reservas}`);

  await client.end();
  console.log("\n✅ ¡Seed completado!");
  console.log("\n🔑 Credenciales de prueba:");
  console.log("   Admin:     admin@bookingsystem.com / password123");
  console.log("   Negocio 1: dueno1@example.com / password123");
  console.log("   Cliente 1: cliente1@example.com / password123");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
