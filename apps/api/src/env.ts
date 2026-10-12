import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // sem .env: usa as variáveis do ambiente (produção/CI)
}

const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  INGEST_API_KEY: z.string().min(24),
  MAC_HASH_SECRET: z.string().min(32),
  DEFAULT_STORE_ID: z.string().min(1).default('loja-demo'),
  PORT: z.coerce.number().default(3001),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    'Variáveis de ambiente inválidas:',
    z.flattenError(parsed.error).fieldErrors,
  );
  process.exit(1);
}
export const env = parsed.data;
