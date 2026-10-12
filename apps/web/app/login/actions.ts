'use server';

import { loginSchema } from '@wifi/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/session';

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Informe um e-mail válido e a senha.' };
  try {
    const { accessToken } = await api.login(parsed.data.email, parsed.data.password);
    (await cookies()).set(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 3600,
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { error: 'E-mail ou senha incorretos.' };
    if (e instanceof ApiError && e.status === 429) return { error: 'Muitas tentativas. Aguarde um minuto e tente de novo.' };
    return { error: e instanceof ApiError ? e.message : 'Não foi possível entrar agora. Tente de novo.' };
  }
  redirect('/');
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
