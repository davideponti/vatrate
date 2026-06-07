const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

interface SendEmailParams {
  type?: 'transactional' | 'broadcast';
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Resend API.
 * All email content is pre-sanitized by the caller.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email not sent.');
    console.log(`📧 Would send to ${params.to}: ${params.subject}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'VATRate <noreply@vatrate.eu>',
      reply_to: 'support@vatrate.eu',
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorText}`);
  }
}

/**
 * Validate that RESEND_API_KEY is properly configured.
 * Called at server startup.
 */
export function validateEmailConfig(): boolean {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is not set. Email functionality will be disabled.');
    return false;
  }
  return true;
}
