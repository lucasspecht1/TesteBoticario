import { Prisma } from '@prisma/client';
import { LAPSED_DAYS, MIN_VISITS_TO_LAPSE } from '@wifi/shared';
import { toUtcTimestamp } from '../common/sql';
import { DAY_MS } from '../common/time';

/** Linha da consulta de sumidos usada no CSV (inclui o e-mail). */
export type LapsedRow = {
  leadName: string;
  email: string | null;
  totalVisits: number;
  lastVisitAt: Date;
};

/** Ordena do cliente que sumiu há menos tempo para o que sumiu há mais. */
export const LAPSED_ORDER = Prisma.sql`ORDER BY max(v."startedAt") DESC`;

/** Sumidos que aceitaram contato: `MIN_VISITS_TO_LAPSE`+ visitas e a última há mais de `LAPSED_DAYS` dias. */
export function buildLapsedQuery(storeId: string, now: Date): Prisma.Sql {
  const cutoff = new Date(now.getTime() - LAPSED_DAYS * DAY_MS);
  return Prisma.sql`
      SELECT d.id, d."macHash", l.name AS "leadName", l.email,
        count(v.id)::int AS "totalVisits", max(v."startedAt") AS "lastVisitAt"
      FROM "Device" d
      JOIN "Lead" l ON l."deviceId" = d.id AND l."marketingOptIn" = true
      JOIN "Visit" v ON v."deviceId" = d.id
      WHERE d."storeId" = ${storeId}
      GROUP BY d.id, l.name, l.email
      HAVING count(v.id) >= ${Prisma.raw(String(MIN_VISITS_TO_LAPSE))} AND max(v."startedAt") < ${toUtcTimestamp(cutoff)}`;
}
