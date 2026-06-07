import { NextRequest, NextResponse } from 'next/server';
import { getOAuthProvider, exchangeCodeForToken, fetchUserFromProvider } from '@/lib/oauth';
import { getSupabaseClient } from '@/lib/supabase';
import { createSession } from '@/lib/session';
import { createApiKeyForUser } from '@/lib/api-key';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

// GET /api/v1/auth/oauth/callback/:provider
// Handles the OAuth provider's callback after user authorization.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerName } = await params;

  // Validate provider
  if (providerName !== 'github' && providerName !== 'google') {
    return NextResponse.redirect(
      new URL('/login?error=unsupported_provider', request.url),
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle provider error (user denied access, etc.)
  if (error) {
    console.warn(`OAuth ${providerName} error:`, error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_${error}`, request.url),
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_request', request.url),
    );
  }

  // CSRF: Validate state matches the cookie
  const storedState = request.cookies.get(`oauth_state_${providerName}`)?.value;

  if (!storedState || storedState !== state) {
    console.error(`OAuth ${providerName} state mismatch. Possible CSRF attack.`);
    return NextResponse.redirect(
      new URL('/login?error=csrf_detected', request.url),
    );
  }

  try {
    const provider = getOAuthProvider(providerName);

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(provider, code);
    const accessToken = tokenData.access_token as string;

    if (!accessToken) {
      throw new Error('No access token returned');
    }

    // Fetch user info from provider
    const oauthUser = await fetchUserFromProvider(provider, accessToken);

    if (!oauthUser.email) {
      return NextResponse.redirect(
        new URL('/login?error=email_required', request.url),
      );
    }

    // Check if user already exists with this OAuth account
    const { data: existingOAuthUser } = await getSupabaseClient()
      .from('users')
      .select('id, email, oauth_provider, oauth_id, avatar_url, display_name')
      .eq('oauth_provider', providerName)
      .eq('oauth_id', oauthUser.id)
      .single();

    // Also check if user exists with this email for merging accounts
    const { data: existingEmailUser } = await getSupabaseClient()
      .from('users')
      .select('id, email, oauth_provider, oauth_id, avatar_url, display_name')
      .eq('email', oauthUser.email)
      .single();

    let userId: string;

    if (existingOAuthUser) {
      // User already linked this OAuth account → log them in
      userId = existingOAuthUser.id;
    } else if (existingEmailUser && !existingEmailUser.oauth_id) {
      // Email exists but has no OAuth → link this OAuth account
      userId = existingEmailUser.id;
      await getSupabaseClient()
        .from('users')
        .update({
          oauth_provider: providerName,
          oauth_id: oauthUser.id,
          avatar_url: oauthUser.avatar_url || existingEmailUser.avatar_url,
          display_name: oauthUser.name || existingEmailUser.display_name,
        })
        .eq('id', userId);
    } else {
      // New user: create account
      const displayName = oauthUser.name || oauthUser.email.split('@')[0];

      const { data: newUser, error: createError } = await getSupabaseClient()
        .from('users')
        .insert({
          email: oauthUser.email,
          oauth_provider: providerName,
          oauth_id: oauthUser.id,
          avatar_url: oauthUser.avatar_url,
          display_name: displayName,
          email_verified: true, // OAuth providers verify emails
          plan: 'free',
          requests_limit: 30000,
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('Failed to create user:', createError);
        return NextResponse.redirect(
          new URL('/signup?error=account_creation_failed', request.url),
        );
      }

      userId = newUser.id;

      // Create default API key for new OAuth user
      await createApiKeyForUser(userId, 'Default', 'live').catch((err: Error) => {
        console.error('Failed to create API key for OAuth user:', err);
      });
    }

    // Create session
    const token = await createSession(userId);

    // Determine redirect
    const redirectTo = '/dashboard';

    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    // Set session cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set CSRF token cookie
    const csrfToken = generateCsrfToken();
    setCsrfCookie(response, csrfToken);

    // Clear the OAuth state cookie
    response.cookies.set(`oauth_state_${providerName}`, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error(`OAuth ${providerName} callback error:`, error);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_callback_error`, request.url),
    );
  }
}
