// src/lib/email.ts
// Email service integration (Resend provider).

import { Resend } from "resend";

interface SendStaffInvitationEmailParams {
  to: string;
  inviterName: string;
  organizationName: string;
  invitationId: string;
  role: string;
  expiresAt: Date | string;
}

export async function sendStaffInvitationEmail({
  to,
  inviterName,
  organizationName,
  invitationId,
  role,
  expiresAt,
}: SendStaffInvitationEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const invitationUrl = `${baseUrl}/accept-invitation/${invitationId}`;
  const formattedExpiry = new Date(expiresAt).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const subject = `You're invited to join ${organizationName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
          .badge { display: inline-block; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
          h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
          .highlight { color: #f8fafc; font-weight: 600; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
          .meta { background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; font-size: 12px; color: #64748b; margin-top: 24px; }
          .footer { font-size: 11px; color: #475569; text-align: center; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color:#ffffff; margin:0 0 24px 0;">Mise</h2>
          <span class="badge">Team Invitation</span>
          <h1>Join ${organizationName}</h1>
          <p>
            You've been invited by <span class="highlight">${inviterName}</span> to join 
            <span class="highlight">${organizationName}</span> as 
            <span class="highlight">${role.toUpperCase()}</span>.
          </p>
          <p>
            Click below to create your account and join the team:
          </p>
          <div class="btn-container">
            <a href="${invitationUrl}" class="btn">Create Your Account</a>
          </div>
          <div class="meta">
            <strong>Invitation URL:</strong> <a href="${invitationUrl}" style="color:#60a5fa;">${invitationUrl}</a><br/>
            <strong>Expires on:</strong> ${formattedExpiry}
          </div>
          <div class="footer">
            Mise Restaurant Operations Platform · If you did not expect this invitation, you can ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const data = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Mise <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      });
      console.log(`[Email] Invitation email sent via Resend to ${to}:`, data);
      return { success: true, invitationUrl, data };
    } catch (err: any) {
      console.error(`[Email] Error sending email via Resend to ${to}:`, err);
      return { success: false, invitationUrl, error: err.message };
    }
  } else {
    console.log(`[Email Mock] RESEND_API_KEY is not set. Simulated sending invitation email to ${to}`);
    console.log(`[Email Mock] Subject: ${subject}`);
    console.log(`[Email Mock] Invitation URL: ${invitationUrl}`);
    return { success: true, invitationUrl, mocked: true };
  }
}
