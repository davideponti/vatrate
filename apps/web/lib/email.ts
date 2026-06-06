import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY || '';

  if (!apiKey) {
    throw new Error(
      '⚠️ RESEND_API_KEY not set in .env.local',
    );
  }

  _resend = new Resend(apiKey);
  return _resend;
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
 * Send an email via Resend (free plan: 100 emails/day).
 *
 * - Use `type: 'transactional'` for password resets (from noreply@vatrate.eu)
 * - Use `type: 'info'` for informational emails (from info@vatrate.eu)
 *
 * Configure in .env.local:
 *   RESEND_API_KEY=re_...   (from https://resend.com)
 *
 * First time setup:
 *   1. Sign up at https://resend.com
 *   2. Add domain vatrate.eu and verify it with a TXT record
 *   3. Get your API key from the dashboard
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const fromConfig = FROM_ADDRESSES[params.type || 'transactional'];

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: `${fromConfig.name} <${fromConfig.email}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html.replace(/<[^>]*>/g, ''),
    });

    if (error) {
      throw error;
    }

    console.log(
      `📧 [${params.type || 'transactional'}] Email sent to ${params.to}: "${params.subject}" (id: ${data?.id})`,
    );
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    throw error;
  }
}
