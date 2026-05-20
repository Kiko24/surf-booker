import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = "Surf Booker <onboarding@resend.dev>";

type BookingNotification = {
  ownerEmail: string;
  schoolName: string;
  studentName: string;
  className: string;
  date: string;
  time: string;
};

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
    console.error("Failed to send email notification:", err);
  }
}
