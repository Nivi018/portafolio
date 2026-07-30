import { Resend } from "resend";
import { formatDate, formatTime } from "@/lib/utils";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@bookingsystem.com";

export interface BookingEmailData {
  to: string;
  clientName: string;
  businessName: string;
  serviceName: string;
  date: Date;
  startTime: string;
  endTime: string;
  notes?: string;
}

/**
 * Envía email de confirmación de reserva
 */
export async function sendBookingConfirmation(data: BookingEmailData) {
  if (!resend) {
    console.warn("⚠️ Resend no configurado, email no enviado");
    return { success: false, error: "Resend no configurado" };
  }

  const html = generateBookingEmailHTML(data);
  const text = generateBookingEmailText(data);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Confirmación de reserva - ${data.businessName}`,
      html,
      text,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}

/**
 * Envía email de cancelación
 */
export async function sendCancellationEmail(data: BookingEmailData) {
  if (!resend) {
    console.warn("⚠️ Resend no configurado, email no enviado");
    return { success: false, error: "Resend no configurado" };
  }

  const html = `
    <h2>Reserva cancelada</h2>
    <p>Hola <strong>${data.clientName}</strong>,</p>
    <p>Tu reserva en <strong>${data.businessName}</strong> ha sido cancelada.</p>
    <p>Detalles:</p>
    <ul>
      <li>Servicio: ${data.serviceName}</li>
      <li>Fecha: ${formatDate(data.date)}</li>
      <li>Hora: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</li>
    </ul>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Reserva cancelada - ${data.businessName}`,
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error enviando email:", error);
    return { success: false, error };
  }
}

function generateBookingEmailHTML(data: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .detail-row:last-child { border-bottom: none; }
        .label { color: #64748b; }
        .value { font-weight: 600; color: #0f172a; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">¡Reserva Confirmada!</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${data.clientName}</strong>,</p>
        <p>Tu reserva ha sido creada exitosamente. Aquí están los detalles:</p>

        <div class="details">
          <div class="detail-row">
            <span class="label">Negocio:</span>
            <span class="value">${data.businessName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Servicio:</span>
            <span class="value">${data.serviceName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fecha:</span>
            <span class="value">${formatDate(data.date)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Hora:</span>
            <span class="value">${formatTime(data.startTime)} - ${formatTime(data.endTime)}</span>
          </div>
          ${
            data.notes
              ? `<div class="detail-row">
              <span class="label">Notas:</span>
              <span class="value">${data.notes}</span>
            </div>`
              : ""
          }
        </div>

        <p>Te recomendamos llegar 5 minutos antes de tu cita.</p>
        <p>Si necesitas cancelar o reprogramar, contacta directamente con el negocio.</p>
      </div>
      <div class="footer">
        <p>BookingSystem - Sistema de Reservas</p>
      </div>
    </body>
    </html>
  `;
}

function generateBookingEmailText(data: BookingEmailData): string {
  return `
Reserva Confirmada

Hola ${data.clientName},

Tu reserva ha sido creada exitosamente.

Detalles:
- Negocio: ${data.businessName}
- Servicio: ${data.serviceName}
- Fecha: ${formatDate(data.date)}
- Hora: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
${data.notes ? `- Notas: ${data.notes}` : ""}

Te recomendamos llegar 5 minutos antes de tu cita.

BookingSystem - Sistema de Reservas
  `.trim();
}
