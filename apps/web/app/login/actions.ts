'use server';

import { loginSchema, SESSION_TTL_SECONDS } from '@wifi/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { describeActionError } from '@/lib/action-errors';
import { api, HTTP_STATUS } from '@/lib/api';
import { LOGIN_PATH, SESSION_COOKIE } from '@/lib/session';

/** Estado do formulário de login: a mensagem de erro, quando houver. */
export type LoginState = { error?: string };

/** Entra com e-mail e senha: guarda o token em cookie httpOnly e vai para o painel. */
export async function login(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'Informe um e-mail válido e a senha.' };
  try {
    const { accessToken } = await api.login(parsed.data.email, parsed.data.password);
    (await cookies()).set(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
  } catch (error) {
    return {
      error: describeActionError(error, {
        messageByStatus: {
          [HTTP_STATUS.unauthorized]: 'E-mail ou senha incorretos.',
          [HTTP_STATUS.tooManyRequests]: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
        },
        fallback: 'Não foi possível entrar agora. Tente de novo.',
      }),
    };
  }
  redirect('/');
}

/** Sai: apaga o cookie de sessão e volta para o login. */
export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect(LOGIN_PATH);
}
