import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProvider, createAuthorizationUrl } from '@/lib/oauth';

// GET /api/v1/auth/oauth/:provider
// Redirects the user to the OAuth provider's consent page.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerName } = await params;

  // Validate provider
  if (providerName !== 'github' && providerName !== 'google') {
    return NextResponse.redirect(
      new URL('/login?error=unsupported_provider', _request.url),
    );
  }

  try {
    const provider = getOAuthProvider(providerName);

    // Verify the provider is configured
    if (!provider.clientId || !provider.clientSecret) {
      console.error(`OAuth ${providerName} is not configured. Missing client ID or secret.`);
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', _request.url),
      );
    }

    const { url, state } = createAuthorizationUrl(provider);

    // Store the state in a cookie for CSRF validation on callback
    const response = NextResponse.redirect(url);

    response.cookies.set(`oauth_state_${providerName}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_error', _request.url),
    );
  }
}
