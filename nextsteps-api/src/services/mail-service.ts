import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export interface SendAuthEmailInput {
  to: string;
  fullName: string;
  magicLinkUrl: string;
  otp: string;
  expiresMinutes: number;
}

export interface SendAuthEmailResult {
  delivered: boolean;
  channel: 'smtp' | 'console';
  error?: string;
}

const isSmtpConfigured = (): boolean =>
  Boolean(env.SmtpHost && env.SmtpUser && env.SmtpPass && env.MailFrom);

export const sendAuthEmail = async (
  input: SendAuthEmailInput,
): Promise<SendAuthEmailResult> => {
  const subject = 'Your NextSteps sign-in code';
  const text = [
    `Hi ${input.fullName},`,
    '',
    `Your 6-digit sign-in code: ${input.otp}`,
    '',
    `Or open this magic link (expires in ${input.expiresMinutes} minutes):`,
    input.magicLinkUrl,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#1a1433">
      <h2 style="color:#7b5cf5">NextSteps — Maverick Nebula</h2>
      <p>Hi ${input.fullName},</p>
      <p>Use this code to sign in:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:0.25em;color:#7b5cf5">${input.otp}</p>
      <p>Or click your magic link (expires in ${input.expiresMinutes} minutes):</p>
      <p><a href="${input.magicLinkUrl}">${input.magicLinkUrl}</a></p>
      <p style="color:#666;font-size:13px">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  if (!isSmtpConfigured()) {
    console.log('[nextsteps-auth] SMTP not configured — sign-in details for', input.to);
    console.log('[nextsteps-auth] OTP:', input.otp);
    console.log('[nextsteps-auth] Magic link:', input.magicLinkUrl);
    return { delivered: false, channel: 'console' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SmtpHost,
      port: env.SmtpPort,
      secure: env.SmtpSecure,
      auth: {
        user: env.SmtpUser,
        pass: env.SmtpPass,
      },
      tls: env.SmtpTlsInsecure ? { rejectUnauthorized: false } : undefined,
    });

    await transporter.sendMail({
      from: env.MailFrom,
      to: input.to,
      subject,
      text,
      html,
    });

    return { delivered: true, channel: 'smtp' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[nextsteps-auth] SMTP send failed:', message);
    console.log('[nextsteps-auth] Fallback OTP for', input.to, ':', input.otp);
    console.log('[nextsteps-auth] Fallback magic link:', input.magicLinkUrl);
    return { delivered: false, channel: 'console', error: message };
  }
};
