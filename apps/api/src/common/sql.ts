import { Prisma } from '@prisma/client';

/**
 * Instante como timestamp sem fuso em UTC, para comparar com as colunas do banco (que são
 * `timestamp` sem fuso, gravadas em UTC). Um parâmetro Date chegaria como timestamptz e o
 * Postgres o converteria pelo fuso da sessão; aqui ele é levado a UTC explicitamente.
 */
export const toUtcTimestamp = (date: Date): Prisma.Sql =>
  Prisma.sql`(${date.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
