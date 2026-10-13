import type { Request } from 'express';

/** Usuário autenticado pelo JWT. */
type AuthUser = { userId: string; storeId: string };
/** user: preenchido pelo JwtAuthGuard. storeId: preenchido pelo ApiKeyGuard. */
export type AppRequest = Request & { user?: AuthUser; storeId?: string };
