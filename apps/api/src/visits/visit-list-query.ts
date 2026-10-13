import { Prisma } from '@prisma/client';
import type { VisitsQuery } from '@wifi/shared';
import { toUtcTimestamp } from '../common/sql';

/** Tabelas da lista de visitas: visita (v), aparelho (d) e lead opcional (l). */
export const VISIT_LIST_JOINS = Prisma.sql`FROM "Visit" v JOIN "Device" d ON d.id = v."deviceId" LEFT JOIN "Lead" l ON l."deviceId" = d.id`;

/** Dia local de uma coluna timestamp (UTC) no fuso da loja. */
const toLocalDateSql = (column: Prisma.Sql, timeZone: string): Prisma.Sql =>
  Prisma.sql`((${column} AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone})::date`;

/**
 * Condição SQL "recorrente": a visita ocorreu num dia local posterior ao primeiro dia em que o
 * aparelho foi visto.
 */
export const buildReturningCondition = (timeZone: string): Prisma.Sql =>
  Prisma.sql`(${toLocalDateSql(Prisma.sql`d."firstSeenAt"`, timeZone)} < ${toLocalDateSql(Prisma.sql`v."startedAt"`, timeZone)})`;

/** Instantes que delimitam a lista: `from` (início do período), `now` e `inStoreSince` (corte de "na loja"). */
type VisitListBounds = { from: Date; now: Date; inStoreSince: Date };

/** Monta o WHERE da lista de visitas a partir dos filtros da query string. */
export function buildVisitListFilter(
  storeId: string,
  query: VisitsQuery,
  bounds: VisitListBounds,
  timeZone: string,
): Prisma.Sql {
  const { from, now, inStoreSince } = bounds;
  const returning = buildReturningCondition(timeZone);
  const conditions: Prisma.Sql[] = [
    Prisma.sql`v."storeId" = ${storeId}`,
    Prisma.sql`v."startedAt" <= ${toUtcTimestamp(now)}`,
  ];
  // "na loja" vale para quem chegou antes da meia-noite e ainda não saiu: o período não corta
  if (query.status !== 'in-store')
    conditions.push(Prisma.sql`v."startedAt" >= ${toUtcTimestamp(from)}`);
  if (query.status === 'in-store')
    conditions.push(
      Prisma.sql`v."endedAt" IS NULL AND v."startedAt" > ${toUtcTimestamp(inStoreSince)}`,
    );
  if (query.status === 'closed')
    conditions.push(Prisma.sql`v."endedAt" IS NOT NULL`);
  if (query.kind === 'new') conditions.push(Prisma.sql`NOT ${returning}`);
  if (query.kind === 'returning') conditions.push(returning);
  if (query.lead === 'optin')
    conditions.push(Prisma.sql`l."marketingOptIn" = true`);
  if (query.q) conditions.push(Prisma.sql`d."macHash" LIKE ${`${query.q}%`}`);
  return Prisma.join(conditions, ' AND ');
}
