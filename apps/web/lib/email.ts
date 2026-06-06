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
 * ⚠️ IMPORTANT: Until your domain (vatrate.eu) is verified on Resend,
 *    Resend will only send from "onboarding@resend.dev".
 *    To fix: go to https://resend.com → Domains → verify vatrate.eu
 *    The TXT record takes a few minutes to propagate after adding it.
 *
 *    For now, we fallback to onboarding@resend.dev so emails still work
 *    during domain verification.
 *
 * Configure in .env.local:
 *   RESEND_API_KEY=re_...   (from https://resend.com)
 *
 * And on Vercel:
 *   Project Settings → Environment Variables → add RESEND_API_KEY
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
      // If domain not yet verified, fall back to Resend's default sender
      if (
        error.message?.includes('not verified') ||
        error.message?.includes('domain')
      ) {
        console.warn(
          '⚠️ Domain not yet verified on Resend. Falling back to onboarding@resend.dev',
        );
        const { data: data2, error: error2 } = await resend.emails.send({
          from: 'VATRate <onboarding@resend.dev>',
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text || params.html.replace(/<[^>]*>/g, ''),
        });
        if (error2) throw error2;
        console.log(
          `📧 [${params.type || 'transactional'}] Email sent via Resend default sender to ${params.to} (id: ${data2?.id})`,
        );
        return;
      }
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
