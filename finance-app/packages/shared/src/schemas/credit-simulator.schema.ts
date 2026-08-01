import { z } from 'zod'

export const creditSimulatorSchema = z.object({
  principal: z.number().finite().positive('El capital debe ser positivo'),
  annualRate: z.number().finite().min(0, 'La tasa anual no puede ser negativa').max(1000, 'La tasa anual es demasiado alta'),
  termMonths: z.number().int().min(1, 'El plazo debe ser de al menos un mes').max(1200, 'El plazo es demasiado largo'),
  monthlyExtraPayment: z.number().finite().nonnegative('El pago adicional no puede ser negativo').optional(),
})

export type CreditSimulatorInput = z.infer<typeof creditSimulatorSchema>
