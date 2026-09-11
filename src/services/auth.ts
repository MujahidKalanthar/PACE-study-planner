import { createClient } from '@supabase/supabase-js';
import { AuthUser } from '../types';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

const LOCAL_AUTH_KEY = 'pace_student_auth_user_v3';

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
          avatar: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at,
          emailConfirmed: Boolean(session.user.email_confirmed_at || session.user.confirmed_at),
        };
      }
    } catch (e) {
      console.warn('Supabase auth session check warning:', e);
    }
  }

  // Check local storage auth session
  try {
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.id && parsed?.email) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
  if (!email || !password) {
    return { user: null, error: 'Please provide both email and password.' };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || email.trim(),
          name: data.user.user_metadata?.full_name || email.trim().split('@')[0],
          createdAt: data.user.created_at,
          emailConfirmed: Boolean(data.user.email_confirmed_at || data.user.confirmed_at),
        };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
        return { user };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Login failed' };
    }
  }

  // Local authentication session fallback when Supabase is not configured
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters.' };
  }

  const cleanEmail = email.trim();
  const user: AuthUser = {
    id: `local_user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: cleanEmail,
    name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    createdAt: new Date().toISOString(),
    emailConfirmed: true,
  };
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  return { user };
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<{ user: AuthUser | null; error?: string; unconfirmed?: boolean }> {
  if (!name.trim()) return { user: null, error: 'Please enter your full name.' };
  if (!email || !password) return { user: null, error: 'Please provide email and password.' };
  if (password.length < 6) return { user: null, error: 'Password must be at least 6 characters.' };

  const cleanEmail = email.trim();
  const cleanName = name.trim();

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const isConfirmed = Boolean(data.user.email_confirmed_at || data.user.confirmed_at);
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: cleanName,
          createdAt: data.user.created_at,
          emailConfirmed: isConfirmed,
        };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
        return { user, unconfirmed: !isConfirmed };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Sign up failed' };
    }
  }

  const user: AuthUser = {
    id: `local_user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: cleanEmail,
    name: cleanName,
    createdAt: new Date().toISOString(),
    emailConfirmed: true,
  };
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  return { user };
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) return { success: false, error: 'Please provide your email address.' };

  if (supabase) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend confirmation email.' };
    }
  }

  return { success: true };
}

export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) return { success: false, error: 'Please enter your email.' };

  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed' };
    }
  }

  return { success: true };
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }
  localStorage.removeItem(LOCAL_AUTH_KEY);
}

