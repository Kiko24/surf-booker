import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL ?? "Surf Booker <onboarding@resend.dev>";

type BookingNotification = {
  ownerEmail: string;
  schoolName: string;
  studentName: string;
  className: string;
  date: string;
  time: string;
};

type StudentInvite = {
  email: string;
  studentName: string;
  schoolName: string;
  inviteLink: string;
};

export async function sendStudentInvite(opts: StudentInvite): Promise<void> {
  const { email, studentName, schoolName, inviteLink } = opts;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Bem-vindo(a) à ${schoolName} — define a tua password`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#FF6B35">Bem-vindo(a) à ${schoolName}!</h2>
          <p>Olá <strong>${studentName}</strong>,</p>
          <p>O teu professor adicionou-te à plataforma <strong>Alaia</strong> para poderes gerir as tuas aulas e reservas.</p>
          <p>Para começares, clica no botão abaixo e define a tua palavra-passe:</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${inviteLink}" style="display:inline-block;background-color:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold">
              Definir palavra-passe
            </a>
          </div>
          <p style="color:#666;font-size:14px">Se não esperavas este convite, ignora este email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#999;font-size:12px">Alaia — Plataforma de gestão para escolas de surf</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send invite email");
  }
}

export async function sendBookingNotification(opts: BookingNotification): Promise<void> {
  const { ownerEmail, schoolName, studentName, className, date, time } = opts;

  try {
    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `Nova reserva — ${schoolName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#FF6B35">Nova reserva!</h2>
          <p><strong>${studentName}</strong> inscreveu-se em <strong>${className}</strong></p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px 0;color:#666">Data</td><td style="padding:8px 0">${date}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Hora</td><td style="padding:8px 0">${time}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Escola</td><td style="padding:8px 0">${schoolName}</td></tr>
          </table>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send email notification");
  }
}

type CancellationNotification = {
  studentEmail: string;
  studentName: string;
  schoolName: string;
  className: string;
  date: string;
  time: string;
};

export async function sendCancellationNotification(opts: CancellationNotification): Promise<void> {
  const { studentEmail, studentName, schoolName, className, date, time } = opts;

  try {
    await resend.emails.send({
      from: FROM,
      to: studentEmail,
      subject: `Aula cancelada — ${schoolName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#FF6B35">Aula cancelada</h2>
          <p>Olá <strong>${studentName}</strong>,</p>
          <p>A aula de <strong>${className}</strong> marcada para <strong>${date}</strong> às <strong>${time}</strong> foi cancelada.</p>
          <p style="color:#666;margin-top:16px">Se tiveres dúvidas, contacta a escola.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px 0;color:#666">Data</td><td style="padding:8px 0">${date}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Hora</td><td style="padding:8px 0">${time}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Escola</td><td style="padding:8px 0">${schoolName}</td></tr>
          </table>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send cancellation email");
  }
}
