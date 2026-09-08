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

const LOCAL_AUTH_KEY = 'pace_student_auth_user_v2';

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
        };
      }
    } catch (e) {
      console.warn('Supabase auth session check warning:', e);
    }
  }

  // Fallback to local storage auth user
  try {
    const stored = localStorage.getItem(LOCAL_AUTH_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }

  // Default initial demo logged-in user so student can explore seamlessly
  return {
    id: 'user_arjun_singh',
    email: 'arjun.singh@example.com',
    name: 'Arjun Singh',
    createdAt: new Date().toISOString(),
  };
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
  if (!email || !password) {
    return { user: null, error: 'Please provide both email and password.' };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          createdAt: data.user.created_at,
        };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
        return { user };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Login failed' };
    }
  }

  // Local simulated authentication fallback
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters.' };
  }

  const user: AuthUser = {
    id: `user_${Date.now()}`,
    email,
    name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  return { user };
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
  if (!name.trim()) return { user: null, error: 'Please enter your full name.' };
  if (!email || !password) return { user: null, error: 'Please provide email and password.' };
  if (password.length < 6) return { user: null, error: 'Password must be at least 6 characters.' };

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          name: name.trim(),
          createdAt: data.user.created_at,
        };
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
        return { user };
      }
    } catch (err: any) {
      return { user: null, error: err.message || 'Sign up failed' };
    }
  }

  const user: AuthUser = {
    id: `user_${Date.now()}`,
    email,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  return { user };
}

export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email) return { success: false, error: 'Please enter your email.' };

  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
