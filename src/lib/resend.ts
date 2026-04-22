// src/lib/resend.ts
// ============================================================
// RESEND EMAIL SERVICE
// Sends OTP emails and notifications
// ============================================================

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SocietyOS";

// ─── Send OTP Email ──────────────────────────────────────────
export async function sendOTPEmail(
  email: string,
  otp: string,
  userName?: string,
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: `${otp} — Your SocietyOS Login Code`,
      html: generateOTPEmailHTML(otp, userName),
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// ─── Send Bill Notification ──────────────────────────────────
export async function sendBillNotificationEmail(
  email: string,
  data: {
    userName: string;
    flatNumber: string;
    amount: number;
    dueDate: string;
    billNumber: string;
  },
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: `Maintenance Bill ${data.billNumber} — ₹${data.amount} Due`,
      html: generateBillEmailHTML(data),
    });
    return !error;
  } catch {
    return false;
  }
}

// ─── Email Templates ─────────────────────────────────────────

function generateOTPEmailHTML(otp: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #f4f4f5; margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white;
                  border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background: #18181b; padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
            🏢 SocietyOS
          </h1>
          <p style="color: #a1a1aa; margin: 8px 0 0; font-size: 14px;">
            Housing Society Management
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 40px 32px;">
          <p style="color: #3f3f46; font-size: 16px; margin: 0 0 24px;">
            Hello ${userName || "there"},
          </p>
          <p style="color: #52525b; font-size: 15px; margin: 0 0 32px; line-height: 1.6;">
            Your one-time login code for SocietyOS is:
          </p>

          <!-- OTP Box -->
          <div style="background: #f4f4f5; border-radius: 12px;
                      padding: 24px; text-align: center; margin: 0 0 32px;">
            <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px;
                         color: #18181b; font-family: monospace;">
              ${otp}
            </span>
          </div>

          <p style="color: #71717a; font-size: 13px; margin: 0 0 8px;">
            ⏱ This code expires in <strong>10 minutes</strong>
          </p>
          <p style="color: #71717a; font-size: 13px; margin: 0;">
            🔐 Never share this code with anyone.
               SocietyOS will never ask for your OTP.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e4e4e7; padding: 20px 32px;
                    background: #fafafa;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
            If you didn't request this code, please ignore this email.
            <br>© 2024 SocietyOS. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

function generateBillEmailHTML(data: {
  userName: string;
  flatNumber: string;
  amount: number;
  dueDate: string;
  billNumber: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; background: #f4f4f5;
                 margin: 0; padding: 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: white;
                  border-radius: 12px; padding: 32px;">
        <h2 style="color: #18181b;">🏢 Maintenance Bill Generated</h2>
        <p>Hello ${data.userName},</p>
        <p>Your maintenance bill has been generated.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Bill Number</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.billNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Flat</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.flatNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Amount</td>
            <td style="padding: 8px 0; font-weight: 600; color: #dc2626;">
              ₹${data.amount.toLocaleString("en-IN")}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Due Date</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.dueDate}</td>
          </tr>
        </table>
        <p style="color: #71717a; font-size: 13px; margin-top: 24px;">
          Please pay before the due date to avoid late fees.
        </p>
      </div>
    </body>
    </html>
  `;
}
