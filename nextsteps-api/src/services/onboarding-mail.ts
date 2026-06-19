import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export interface OnboardingMailAttachment {
  filename: string;
  contentType: string;
  dataBase64: string;
}

export interface OnboardingMailInput {
  traineeName: string;
  personalEmail: string;
  batch: string;
  track: string;
  role: string;
  location: string;
  onboardingDate: string;
  reportingTime: string;
  attachment?: OnboardingMailAttachment;
}

export interface OnboardingMailResult {
  delivered: boolean;
  channel: 'smtp' | 'console';
  employeeId: string;
  hexEmail: string;
  subject: string;
  error?: string;
}

const isSmtpConfigured = (): boolean =>
  Boolean(env.SmtpHost && env.SmtpUser && env.SmtpPass && env.MailFrom);

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const generateEmployeeCredentials = (traineeName: string): { employeeId: string; hexEmail: string } => {
  const parts = traineeName.trim().split(/\s+/).filter(Boolean);
  const first = (parts[0] ?? 'maverick').toLowerCase().replace(/[^a-z]/g, '');
  const last = (parts[parts.length - 1] ?? 'trainee').toLowerCase().replace(/[^a-z]/g, '');
  const employeeId = `HW${Date.now().toString().slice(-6)}`;
  const hexEmail = `${first}.${last}@hexaware.com`;
  return { employeeId, hexEmail };
};

const formatDisplayDate = (isoDate: string): string => {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const buildOnboardingMailContent = (
  input: OnboardingMailInput,
  credentials: { employeeId: string; hexEmail: string },
): { subject: string; text: string; html: string } => {
  const displayDate = formatDisplayDate(input.onboardingDate);
  const subject = `Welcome to Hexaware — Onboarding on ${displayDate}`;

  const text = [
    `Dear ${input.traineeName},`,
    '',
    'Congratulations and welcome to Hexaware!',
    '',
    `We are delighted to confirm your onboarding as a ${input.role} under the NextSteps Maverick program.`,
    '',
    'Your onboarding details',
    `- Role: ${input.role}`,
    `- Batch: ${input.batch}`,
    `- Track: ${input.track}`,
    `- Onboarding date: ${displayDate}`,
    `- Reporting time: ${input.reportingTime}`,
    `- Location: ${input.location}`,
    '',
    'Your provisional credentials',
    `- Employee ID: ${credentials.employeeId}`,
    `- Hexaware email: ${credentials.hexEmail}`,
    '',
    'On your joining day, please report to the location above at the specified time with a valid photo ID.',
    input.attachment ? 'Additional documents are attached to this email for your reference.' : '',
    '',
    'We look forward to seeing you at the Maverick Nebula.',
    '',
    'Warm regards,',
    'Hexaware L&D Team',
    'NextSteps Platform',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.65;color:#1a1433;max-width:640px">
      <div style="background:linear-gradient(135deg,#4361ee,#7b5cf5);padding:28px 24px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#fff;font-size:22px">Welcome to Hexaware</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px">NextSteps Maverick Program — Onboarding Confirmation</p>
      </div>
      <div style="padding:24px;border:1px solid #e8e4f8;border-top:none;border-radius:0 0 12px 12px;background:#faf9ff">
        <p>Dear <strong>${input.traineeName}</strong>,</p>
        <p>Congratulations! We are delighted to confirm your onboarding as a <strong>${input.role}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
          <tr><td style="padding:8px 0;color:#666;width:140px">Role</td><td style="padding:8px 0"><strong>${input.role}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Batch</td><td style="padding:8px 0">${input.batch}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Track</td><td style="padding:8px 0">${input.track}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Onboarding date</td><td style="padding:8px 0"><strong>${displayDate}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Reporting time</td><td style="padding:8px 0"><strong>${input.reportingTime}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Location</td><td style="padding:8px 0">${input.location}</td></tr>
        </table>
        <div style="background:#f0ebff;border-left:4px solid #7b5cf5;padding:14px 16px;border-radius:8px;margin:20px 0">
          <p style="margin:0 0 8px;font-weight:700;color:#5b3fd4">Your provisional credentials</p>
          <p style="margin:4px 0"><span style="color:#666">Employee ID:</span> <strong>${credentials.employeeId}</strong></p>
          <p style="margin:4px 0"><span style="color:#666">Hexaware email:</span> <strong>${credentials.hexEmail}</strong></p>
        </div>
        <p>Please report to the location above on <strong>${displayDate}</strong> at <strong>${input.reportingTime}</strong> with a valid photo ID.</p>
        ${input.attachment ? '<p style="color:#555;font-size:13px">📎 Additional documents are attached to this email.</p>' : ''}
        <p style="margin-top:24px">We look forward to welcoming you to the Maverick Nebula.</p>
        <p style="color:#666;font-size:13px;margin-top:28px">Warm regards,<br><strong>Hexaware L&amp;D Team</strong><br>NextSteps Platform</p>
      </div>
    </div>
  `;

  return { subject, text, html };
};

const decodeAttachment = (attachment: OnboardingMailAttachment): Buffer => {
  const buffer = Buffer.from(attachment.dataBase64, 'base64');
  if (buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(`Attachment exceeds ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB limit`);
  }
  return buffer;
};

export const sendOnboardingMail = async (
  input: OnboardingMailInput,
): Promise<OnboardingMailResult> => {
  const credentials = generateEmployeeCredentials(input.traineeName);
  const { subject, text, html } = buildOnboardingMailContent(input, credentials);

  const mailOptions: nodemailer.SendMailOptions = {
    from: env.MailFrom,
    to: input.personalEmail,
    subject,
    text,
    html,
  };

  if (input.attachment?.dataBase64) {
    mailOptions.attachments = [
      {
        filename: input.attachment.filename,
        content: decodeAttachment(input.attachment),
        contentType: input.attachment.contentType || 'application/octet-stream',
      },
    ];
  }

  if (!isSmtpConfigured()) {
    console.log('[nextsteps-onboarding] SMTP not configured — onboarding mail for', input.personalEmail);
    console.log('[nextsteps-onboarding] Subject:', subject);
    console.log('[nextsteps-onboarding] Employee ID:', credentials.employeeId);
    console.log('[nextsteps-onboarding] Hex email:', credentials.hexEmail);
    if (input.attachment) {
      console.log('[nextsteps-onboarding] Attachment:', input.attachment.filename);
    }
    return {
      delivered: false,
      channel: 'console',
      ...credentials,
      subject,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.SmtpHost,
      port: env.SmtpPort,
      secure: env.SmtpSecure,
      auth: { user: env.SmtpUser, pass: env.SmtpPass },
      tls: env.SmtpTlsInsecure ? { rejectUnauthorized: false } : undefined,
    });

    await transporter.sendMail(mailOptions);

    return {
      delivered: true,
      channel: 'smtp',
      ...credentials,
      subject,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[nextsteps-onboarding] SMTP send failed:', message);
    console.log('[nextsteps-onboarding] Fallback credentials for', input.personalEmail);
    console.log('[nextsteps-onboarding] Employee ID:', credentials.employeeId);
    return {
      delivered: false,
      channel: 'console',
      ...credentials,
      subject,
      error: message,
    };
  }
};
