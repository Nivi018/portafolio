# Guion de Demo

## Preparación

```bash
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000/login` e ingresa con:

```text
demo@financeapp.dev
DemoPass123!
```

## Recorrido de 4 minutos

1. **Dashboard**: presenta saldo total, comparación mensual, flujo de seis meses y distribución de gasto.
2. **Cuentas**: muestra cuenta principal y ahorro; realiza una transferencia para demostrar transacciones dobles y balance consistente.
3. **Movimientos**: registra un gasto y explica validación Zod, ownership por usuario y actualización del saldo.
4. **Presupuestos**: crea un límite por categoría y explica el cálculo de gasto, restante y excedente.
5. **Metas**: crea una meta y realiza una aportación desde una cuenta.
6. **Recurrencias**: agenda un gasto mensual y explica que un scheduler protegido lo materializa como movimiento real.
7. **Reportes**: cambia el rango de fechas y muestra agregaciones por categoría.

## Mensajes técnicos clave

- Monorepo Turborepo con apps separadas para Next.js y Hono.
- Arquitectura hexagonal: dominio aislado, puertos como interfaces y Prisma/Better Auth como adaptadores.
- Better Auth usa cookies HTTP-only; el frontend no guarda tokens en `localStorage`.
- La API valida usuario propietario en cada caso de uso.
- Pruebas unitarias con repositorios in-memory y prueba de integración real con PostgreSQL.

## Capturas recomendadas para el portafolio

1. Dashboard desktop con gráficos y presupuesto.
2. Vista móvil de navegación inferior y movimientos.
3. Formulario de movimiento con categorías y cuentas.
4. Reporte por rango con pie chart.
5. Estructura del monorepo y diagrama hexagonal del README.
