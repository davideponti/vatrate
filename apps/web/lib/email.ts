import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const fromName = process.env.SMTP_FROM_NAME || 'VATRate';

  if (!user || !pass) {
    throw new Error(
      '⚠️ SMTP credentials not set. Configure SMTP_USER and SMTP_PASS in .env.local',
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
}

/**
 * Send an email via SMTP.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@vatrate.eu';
  const fromName = process.env.SMTP_FROM_NAME || 'VATRate';

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    });
    console.log(`📧 Email sent to ${params.to}: "${params.subject}"`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
