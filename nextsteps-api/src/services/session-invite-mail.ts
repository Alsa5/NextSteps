import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export interface SessionInviteRecipient {
  email: string;
  name: string;
}

export interface SessionInviteInput {
  title: string;
  batchId: string;
  meetLink: string;
  scheduledAt: string;
  trainerName: string;
  trainerEmail: string;
  recipients: SessionInviteRecipient[];
  sessionType: 'pre-onboarding' | 'training';
}

export interface SessionInviteResult {
  delivered: boolean;
  channel: 'smtp' | 'console';
  sentCount: number;
  error?: string;
}

const isSmtpConfigured = (): boolean =>
  Boolean(env.SmtpHost && env.SmtpUser && env.SmtpPass && env.MailFrom);

const formatScheduled = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
};

const buildInviteContent = (input: SessionInviteInput, recipientName: string) => {
  const when = formatScheduled(input.scheduledAt);
  const sessionLabel =
    input.sessionType === 'pre-onboarding'
      ? 'Pre-Onboarding Orientation'
      : 'Training Session';

  const subject = `NextSteps ${sessionLabel}: ${input.title} — ${when}`;

  const text = [
    `Hi ${recipientName},`,
    '',
    `You are invited to a ${sessionLabel.toLowerCase()} for batch ${input.batchId}.`,
    '',
    `Session: ${input.title}`,
    `When: ${when}`,
    `Trainer: ${input.trainerName}`,
    '',
    `Join Google Meet: ${input.meetLink}`,
    '',
    'Please join on time. A session transcript and AI summary will be available in NextSteps after the session.',
    '',
    '— NextSteps L&D',
  ].join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <h2 style="color:#4361EE;margin-bottom:8px">${sessionLabel}</h2>
      <p>Hi ${recipientName},</p>
      <p>You are invited to <strong>${input.title}</strong> for batch <strong>${input.batchId}</strong>.</p>
      <table style="margin:16px 0;font-size:14px">
        <tr><td style="padding:4px 12px 4px 0;color:#666">When</td><td><strong>${when}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Trainer</td><td>${input.trainerName}</td></tr>
      </table>
      <p>
        <a href="${input.meetLink}" style="display:inline-block;background:linear-gradient(135deg,#4361EE,#7B5CF5);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Join Google Meet
        </a>
      </p>
      <p style="font-size:12px;color:#888;margin-top:24px">Link: <a href="${input.meetLink}">${input.meetLink}</a></p>
    </div>
  `;

  return { subject, text, html };
};

export const sendSessionInvites = async (
  input: SessionInviteInput,
): Promise<SessionInviteResult> => {
  const uniqueRecipients = new Map<string, SessionInviteRecipient>();
  uniqueRecipients.set(input.trainerEmail.toLowerCase(), {
    email: input.trainerEmail,
    name: input.trainerName,
  });
  for (const r of input.recipients) {
    uniqueRecipients.set(r.email.toLowerCase(), r);
  }

  const recipients = [...uniqueRecipients.values()];

  if (!isSmtpConfigured()) {
    console.log('\n--- Session invite (console) ---');
    for (const r of recipients) {
      const { subject, text } = buildInviteContent(input, r.name);
      console.log(`To: ${r.email}\nSubject: ${subject}\n${text}\n---`);
    }
    return { delivered: false, channel: 'console', sentCount: recipients.length };
  }

  const transporter = nodemailer.createTransport({
    host: env.SmtpHost,
    port: env.SmtpPort,
    secure: env.SmtpSecure,
    auth: { user: env.SmtpUser, pass: env.SmtpPass },
    tls: env.SmtpTlsInsecure ? { rejectUnauthorized: false } : undefined,
  });

  let sentCount = 0;
  try {
    for (const r of recipients) {
      const { subject, text, html } = buildInviteContent(input, r.name);
      await transporter.sendMail({
        from: env.MailFrom,
        to: r.email,
        subject,
        text,
        html,
      });
      sentCount += 1;
    }
    return { delivered: true, channel: 'smtp', sentCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SMTP send failed';
    return { delivered: false, channel: 'smtp', sentCount, error: message };
  }
};
