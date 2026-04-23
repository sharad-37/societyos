// src/lib/resend.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SocietyOS";

// ─── Email Override ───────────────────────────────────────────
// Handles Resend free tier restriction
// Free tier can ONLY send to your verified email
// This redirects ALL emails to your real email
function getActualRecipient(intendedEmail: string): string {
  const override =
    process.env.RESEND_TO_OVERRIDE || process.env.DEV_EMAIL_OVERRIDE;

  if (override) {
    console.log(`📧 Email redirect: ${intendedEmail} → ${override}`);
    return override;
  }

  return intendedEmail;
}

// ─── Send OTP Email ───────────────────────────────────────────
export async function sendOTPEmail(
  email: string,
  otp: string,
  userName?: string,
): Promise<boolean> {
  try {
    const recipient = getActualRecipient(email);

    console.log(`📧 Sending OTP to: ${recipient}`);
    console.log(`🔑 OTP Code: ${otp}`);

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [recipient],
      subject: `${otp} — Your SocietyOS Login Code`,
      html: generateOTPEmailHTML(otp, userName, email, recipient),
    });

    if (error) {
      console.error("❌ Resend error:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("✅ Email sent. ID:", data?.id);
    return true;
  } catch (err) {
    console.error("❌ Email exception:", err);
    return false;
  }
}

// ─── Send Bill Notification ───────────────────────────────────
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
    const recipient = getActualRecipient(email);

    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [recipient],
      subject: `Maintenance Bill ${data.billNumber} — ₹${data.amount} Due`,
      html: generateBillEmailHTML(data),
    });

    if (error) {
      console.error("Bill email error:", error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ─── OTP Email Template ───────────────────────────────────────
function generateOTPEmailHTML(
  otp: string,
  userName?: string,
  originalEmail?: string,
  actualRecipient?: string,
): string {
  const isRedirected =
    originalEmail && actualRecipient && originalEmail !== actualRecipient;

  const redirectBanner = isRedirected
    ? `
    <div style="
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #92400e;
    ">
      <strong>📬 Demo Notice:</strong>
      OTP requested by <strong>${originalEmail}</strong>
      — redirected here for testing.
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
      'Segoe UI', sans-serif;
      background: #f5f5f7;
      margin: 0;
      padding: 24px;
    ">
      <div style="
        max-width: 460px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      ">

        <!-- Header -->
        <div style="
          background: #1c1c1e;
          padding: 32px;
          text-align: center;
        ">
          <div style="
            width: 56px; height: 56px;
            background: #0071e3;
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
          ">
            <span style="font-size: 28px;">🏢</span>
          </div>
          <h1 style="
            color: white;
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.5px;
          ">
            SocietyOS
          </h1>
          <p style="
            color: #8e8e93;
            margin: 6px 0 0;
            font-size: 13px;
          ">
            Housing Society Management
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">

          ${redirectBanner}

          <p style="
            color: #1c1c1e;
            font-size: 16px;
            margin: 0 0 6px;
            font-weight: 500;
          ">
            Hello ${userName || "there"} 👋
          </p>

          <p style="
            color: #6e6e73;
            font-size: 14px;
            margin: 0 0 28px;
            line-height: 1.5;
          ">
            Your one-time login code for SocietyOS:
          </p>

          <!-- OTP Box -->
          <div style="
            background: #f5f5f7;
            border-radius: 16px;
            padding: 28px 24px;
            text-align: center;
            margin: 0 0 28px;
          ">
            <span style="
              font-size: 44px;
              font-weight: 800;
              letter-spacing: 14px;
              color: #1c1c1e;
              font-family: 'SF Mono', 'Courier New', monospace;
              text-indent: 14px;
              display: inline-block;
            ">
              ${otp}
            </span>
          </div>

          <!-- Info -->
          <div style="space-y: 8px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              background: #f0fdf4;
              border-radius: 10px;
              padding: 10px 14px;
              margin-bottom: 8px;
            ">
              <span>⏱</span>
              <p style="color: #166534; font-size: 13px; margin: 0;">
                Expires in <strong>10 minutes</strong>
              </p>
            </div>
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              background: #fff7ed;
              border-radius: 10px;
              padding: 10px 14px;
            ">
              <span>🔐</span>
              <p style="color: #9a3412; font-size: 13px; margin: 0;">
                Never share this code with anyone
              </p>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="
          border-top: 1px solid #e5e5ea;
          padding: 16px 32px;
          background: #fafafa;
          text-align: center;
        ">
          <p style="
            color: #8e8e93;
            font-size: 11px;
            margin: 0;
            line-height: 1.5;
          ">
            If you didn't request this, ignore this email.
            <br>© 2024 SocietyOS. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}
// ─── Send Receipt Email ───────────────────────────────────────
export async function sendReceiptEmail(
  email: string,
  data: {
    receiptNumber: string;
    billNumber: string;
    residentName: string;
    flatNumber: string;
    amount: number;
    lateFee: number;
    totalAmount: number;
    paymentMethod: string;
    paymentDate: string;
    billingMonth: string;
    billingYear: number;
  },
): Promise<boolean> {
  try {
    const recipient = getActualRecipient(email);

    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [recipient],
      subject: `✅ Payment Receipt ${data.receiptNumber} — SocietyOS`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, sans-serif; background: #f5f5f7; margin: 0; padding: 24px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: #1c1c1e; padding: 28px 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">
                🏢 SocietyOS
              </h1>
              <p style="color: #8e8e93; margin: 6px 0 0; font-size: 13px;">Payment Receipt</p>
            </div>
            <div style="padding: 32px;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; margin-bottom: 8px;">✅</div>
                <p style="color: #166534; font-weight: 700; font-size: 18px; margin: 0;">Payment Confirmed!</p>
                <p style="color: #166534; font-size: 28px; font-weight: 800; margin: 8px 0 0;">
                  Rs. ${data.totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                ${[
                  ["Receipt No.", data.receiptNumber],
                  ["Bill Number", data.billNumber],
                  ["Resident", data.residentName],
                  ["Flat", data.flatNumber],
                  ["Period", `${data.billingMonth} ${data.billingYear}`],
                  ["Method", data.paymentMethod.replace(/_/g, " ")],
                  [
                    "Date",
                    new Date(data.paymentDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  ],
                ]
                  .map(
                    ([label, value], i) => `
                  <tr style="border-bottom: 1px solid ${i % 2 === 0 ? "#f2f2f7" : "#fff"};">
                    <td style="padding: 10px 0; color: #6e6e73; font-size: 13px;">${label}</td>
                    <td style="padding: 10px 0; font-weight: 600; text-align: right; font-size: 13px;">${value}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </table>
              <div style="background: #f5f5f7; border-radius: 12px; padding: 14px; margin-top: 20px; text-align: center;">
                <p style="color: #6e6e73; font-size: 12px; margin: 0;">
                  📄 Download your detailed PDF receipt from the SocietyOS app
                </p>
              </div>
            </div>
            <div style="border-top: 1px solid #e5e5ea; padding: 16px; text-align: center;">
              <p style="color: #8e8e93; font-size: 11px; margin: 0;">© 2024 SocietyOS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return !error;
  } catch {
    return false;
  }
}
// ─── Bill Email Template ──────────────────────────────────────
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
    <body style="
      font-family: -apple-system, sans-serif;
      background: #f5f5f7;
      margin: 0; padding: 24px;
    ">
      <div style="
        max-width: 460px; margin: 0 auto;
        background: white; border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      ">
        <div style="background: #1c1c1e; padding: 28px 32px;">
          <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 700;">
            🏢 Maintenance Bill
          </h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #1c1c1e; margin: 0 0 16px; font-size: 15px;">
            Hello ${data.userName},
          </p>
          <p style="color: #6e6e73; margin: 0 0 24px; font-size: 14px;">
            Your maintenance bill has been generated.
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f2f2f7;">
              <td style="padding: 12px 0; color: #6e6e73; font-size: 14px;">Bill Number</td>
              <td style="padding: 12px 0; font-weight: 600; text-align: right; font-size: 14px;">${data.billNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f2f2f7;">
              <td style="padding: 12px 0; color: #6e6e73; font-size: 14px;">Flat</td>
              <td style="padding: 12px 0; font-weight: 600; text-align: right; font-size: 14px;">${data.flatNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f2f2f7;">
              <td style="padding: 12px 0; color: #6e6e73; font-size: 14px;">Amount Due</td>
              <td style="padding: 12px 0; font-weight: 700; text-align: right; font-size: 20px; color: #ff3b30;">
                ₹${data.amount.toLocaleString("en-IN")}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #6e6e73; font-size: 14px;">Due Date</td>
              <td style="padding: 12px 0; font-weight: 600; text-align: right; font-size: 14px;">${data.dueDate}</td>
            </tr>
          </table>
          <div style="
            margin-top: 24px; background: #fff7ed;
            border-radius: 12px; padding: 14px;
          ">
            <p style="color: #9a3412; font-size: 13px; margin: 0;">
              ⚠️ Late payments incur a 2% late fee after the due date.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
