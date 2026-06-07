/**
 * OAuth helper library for GitHub and Google authentication.
 *
 * This uses a simple OAuth 2.0 Authorization Code flow directly
 * (without Supabase Auth) to integrate with the existing custom
 * session/auth system.
 *
 * ─── Flow ──────────────────────────────────────────
 * 1. User clicks "Sign in with GitHub/Google"
 * 2. Frontend redirects to /api/v1/auth/oauth/{provider}
 * 3. Server redirects to the provider's OAuth consent page
 * 4. Provider redirects back to /api/v1/auth/oauth/callback/{provider}
 * 5. Server exchanges code for tokens, fetches user info,
 *    creates/finds user in DB, creates session, sets cookie,
 *    redirects back to dashboard
 */

export interface OAuthProvider {
  name: 'github' | 'google';
  authorizationUrl: string;
  tokenUrl: string;
  userUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  userEmailUrl?: string; // Google needs a separate call for email
}

/**
 * Get OAuth provider configuration based on environment variables.
 */
export function getOAuthProvider(provider: string): OAuthProvider {
  if (provider === 'github') {
    return {
      name: 'github',
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userUrl: 'https://api.github.com/user',
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      scopes: ['read:user', 'user:email'],
    };
  }

  if (provider === 'google') {
    return {
      name: 'google',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      scopes: ['openid', 'email', 'profile'],
    };
  }

  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

/**
 * Generate the redirect URI for a given provider.
 * This MUST match exactly what's registered in the OAuth app settings.
 *
 * Uses NEXT_PUBLIC_APP_URL first, then falls back to request URL detection
 * for production environments.
 */
export function getRedirectUri(provider: string, requestUrl?: string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return `${envUrl}/api/v1/auth/oauth/callback/${provider}`;
  }
  // Fallback: extract origin from the request URL (works in production)
  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.origin}/api/v1/auth/oauth/callback/${provider}`;
  }
  return `http://localhost:3000/api/v1/auth/oauth/callback/${provider}`;
}

/**
 * Generate a random state string for CSRF protection.
 */
export function generateState(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(32).toString('hex');
}

/**
 * Create the authorization URL to redirect the user to the provider.
 */
export function createAuthorizationUrl(provider: OAuthProvider): { url: string; state: string } {
  const state = generateState();
  const redirectUri = getRedirectUri(provider.name);
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider.scopes.join(' '),
    state,
  });

  return { url: `${provider.authorizationUrl}?${params.toString()}`, state };
}

/**
 * Exchange the authorization code for an access token.
 */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  requestUrl?: string,
): Promise<{ access_token: string; [key: string]: unknown }> {
  const redirectUri = getRedirectUri(provider.name, requestUrl);
  const body = new URLSearchParams({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OAuth error: ${data.error} - ${data.error_description || ''}`);
  }

  return data;
}

/**
 * Fetch the user's profile from the provider using the access token.
 */
export async function fetchUserFromProvider(
  provider: OAuthProvider,
  accessToken: string,
): Promise<{
  id: string;
  email: string;
  name: string;
  avatar_url: string;
}> {
  // Fetch primary user info
  const userResponse = await fetch(provider.userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!userResponse.ok) {
    throw new Error(`Failed to fetch user info: ${userResponse.status}`);
  }

  const userData = await userResponse.json();

  if (provider.name === 'github') {
    // GitHub might not return primary email in the user endpoint
    // We need to fetch emails separately if email is null or not verified
    let email = userData.email;

    if (!email) {
      try {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          const primary = emails.find((e: { primary: boolean }) => e.primary);
          if (primary) {
            email = primary.email;
          }
        }
      } catch {
        // Fallback: use a placeholder
        email = `github-${userData.id}@users.noreply.github.com`;
      }
    }

    return {
      id: String(userData.id),
      email: email || `github-${userData.id}@users.noreply.github.com`,
      name: userData.name || userData.login,
      avatar_url: userData.avatar_url || '',
    };
  }

  if (provider.name === 'google') {
    return {
      id: userData.id,
      email: userData.email || '',
      name: userData.name || '',
      avatar_url: userData.picture || '',
    };
  }

  throw new Error(`Unsupported provider: ${provider.name}`);
}
