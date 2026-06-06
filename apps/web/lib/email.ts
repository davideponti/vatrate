import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  // Default to Gmail SMTP (free service)
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    throw new Error(
      '⚠️ SMTP not configured. Set SMTP_USER and SMTP_PASS in .env.local',
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return _transporter;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** 'transactional' (noreply@vatrate.eu) or 'info' (info@vatrate.eu) */
  type?: 'transactional' | 'info';
}

const FROM_ADDRESSES: Record<string, { email: string; name: string }> = {
  transactional: {
    email: 'noreply@vatrate.eu',
    name: 'VATRate',
  },
  info: {
    email: 'info@vatrate.eu',
    name: 'VATRate',
  },
};

/**
 * Send an email via SMTP (default: Gmail SMTP, free).
 *
 * - Use `type: 'transactional'` for password resets (from noreply@vatrate.eu)
 * - Use `type: 'info'` for informational emails (from info@vatrate.eu)
 *
 * Configure in .env.local:
 *   SMTP_USER=tua.email@gmail.com
 *   SMTP_PASS=xxxx xxxx xxxx xxxx   (Gmail App Password)
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const fromConfig = FROM_ADDRESSES[params.type || 'transactional'];

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${fromConfig.name}" <${fromConfig.email}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    });
    console.log(
      `📧 [${params.type || 'transactional'}] Email sent to ${params.to}: "${params.subject}"`,
    );
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
