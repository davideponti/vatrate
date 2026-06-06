import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || '';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!host || !user || !pass) {
    throw new Error(
      '⚠️ SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local',
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
 * Send an email via SMTP.
 *
 * - Use `type: 'transactional'` for password resets (default)
 * - Use `type: 'info'` for informational emails
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
