# Como publicar

Passo a passo para publicar o banco e a API no Railway e o web na Vercel. Voltar ao [README](../README.md).

## Onde cada parte roda

| Parte | Serviço | Por quê |
|---|---|---|
| Banco (Postgres 16) | Railway, no mesmo projeto da API | A API conversa com o banco pela rede interna do Railway, sem latência entre provedores: cada visita gerada em `/simular` faz várias consultas, e o painel tem timeout de 10 s. |
| API (NestJS) | Railway | Processo sempre ligado: o preenchimento automático da demo roda a cada 5 min dentro da API. |
| Web (Next.js) | Vercel | Feito para Next.js; as funções do servidor ficam em US East, perto da API. |

## Passos

Ainda não executado. Passos planejados:

1. **GitHub:** criar o repositório e dar `git push`. O CI roda sozinho.
2. **Projeto no Railway:** criar o projeto na região **US East**, a mesma das funções da Vercel, e adicionar um serviço **PostgreSQL**. O Railway gera as variáveis de conexão do banco: `DATABASE_URL` para a rede interna e `DATABASE_PUBLIC_URL` para acessar de fora.
3. **API no Railway:** um serviço ligado ao repositório, com a raiz do monorepo como diretório.
   - Build: `pnpm install --frozen-lockfile && pnpm --filter @wifi/api... build`
   - Start: `pnpm --filter @wifi/api exec prisma migrate deploy && pnpm --filter @wifi/api start:prod`
   - Healthcheck: `/health`
   - Variáveis:
     - `DATABASE_URL=${{Postgres.DATABASE_URL}}` (referência ao banco do mesmo projeto);
     - `JWT_SECRET`, `INGEST_API_KEY` e `MAC_HASH_SECRET`, cada um gerado com `openssl rand -hex 32`;
     - `DEFAULT_STORE_ID=loja-demo`;
     - `DEMO_AUTOFILL=true`, sem a qual a demo publicada para no dia do seed.
   - O `PORT` é injetado pelo Railway. Gerar o domínio público.
   - **Uma instância só e sem o modo Serverless:**
     - com duas instâncias, cada uma geraria as visitas da demo e elas sairiam duplicadas;
     - com o serviço dormindo, o preenchimento automático para.
4. **Seed de produção**, uma vez, da máquina local, pela URL pública do banco e com os mesmos segredos da API:
   ```bash
   cd apps/api && DATABASE_URL='<DATABASE_PUBLIC_URL>' MAC_HASH_SECRET='<prod>' JWT_SECRET='<prod>' INGEST_API_KEY='<prod>' pnpm seed
   ```
   Rodar só uma vez: o seed apaga e recria o histórico da loja demo. Daí em diante, o preenchimento automático mantém os dados em dia.
5. **Web na Vercel:**
   - Root Directory: `apps/web`
   - Install Command: `cd ../.. && pnpm install --frozen-lockfile`
   - Build Command: `cd ../.. && pnpm --filter @wifi/web... build`
   - Variáveis:
     - `API_URL=https://<domínio da API>`, sem barra no fim;
     - `ENABLE_EXPERIMENTAL_COREPACK=1`, para a Vercel usar o pnpm 12 do `packageManager`.
   - O web não precisa da `INGEST_API_KEY`.
6. **Conferir:**
   1. Abrir `https://<api>/health`.
   2. Seguir o roteiro "Para avaliar em 5 minutos" do README no painel publicado.
   3. Trocar os endereços locais da seção Acesso do README pelos publicados.
