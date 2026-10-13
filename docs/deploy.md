# Como publicar

Passo a passo para publicar o banco e a API no Railway e o web na Vercel. Voltar ao [README](../README.md).

## Onde cada parte roda

| Parte | Serviço | Por quê |
|---|---|---|
| Banco (Postgres 16) | Railway, no mesmo projeto da API | A API conversa com o banco pela rede interna do Railway, sem latência entre provedores: cada visita gerada em `/simular` faz várias consultas, e o painel tem timeout de 10 s. |
| API (NestJS) | Railway | Processo sempre ligado: o preenchimento automático da demo roda a cada 5 min dentro da API. |
| Web (Next.js) | Vercel | Feito para Next.js; as funções do servidor ficam em US East, perto da API. |

## Passos

Publicado no painel em https://teste-boticario-woad.vercel.app e na API em https://testeboticario-production.up.railway.app, seguindo estes passos:

1. **GitHub:** criar o repositório e dar `git push`. O CI roda sozinho.
2. **Projeto no Railway:** criar o projeto na região **US East**, a mesma das funções da Vercel, e adicionar um serviço **PostgreSQL**. A API usa a `DATABASE_URL` da rede interna; o acesso público ao banco (TCP Proxy) pode ficar desligado.
3. **API no Railway:** um serviço ligado ao repositório, com a raiz do monorepo como diretório.
   - Build: `pnpm install --frozen-lockfile && pnpm --filter @wifi/api... build`
   - Start: `pnpm --filter @wifi/api exec prisma migrate deploy && SEED_IF_EMPTY=1 pnpm --filter @wifi/api seed && pnpm --filter @wifi/api start:prod`
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
4. **Dados de demonstração:** o próprio Start Command roda o seed dentro do Railway, ao lado do banco. Com `SEED_IF_EMPTY=1`, ele só cria a loja, o login e os 180 dias quando o banco ainda não tem visitas; nas partidas seguintes, imprime "Seed pulado" e não apaga nada. Daí em diante, o preenchimento automático mantém os dados em dia.
   - Rodar o seed da máquina local pela URL pública do banco não funcionou: gravar milhares de aparelhos pelo proxy do Railway estourou o tempo limite. Dentro do Railway leva segundos, e o banco não precisa ficar exposto.
5. **Web na Vercel:**
   - Root Directory: `apps/web`
   - Install Command: `cd ../.. && pnpm install --frozen-lockfile`
   - Build Command: `cd ../.. && pnpm --filter @wifi/web... build`
   - Variáveis:
     - `API_URL=https://<domínio da API>`, sem barra no fim;
     - `ENABLE_EXPERIMENTAL_COREPACK=1`, para a Vercel usar o pnpm 12 do `packageManager`.
   - Node.js 24 nas configurações do projeto (o `engines` do `package.json` pede `>=24.9`).
   - O web não precisa da `INGEST_API_KEY`.
6. **Conferir:**
   1. Abrir `https://<api>/health`.
   2. Seguir o roteiro "Para avaliar em 5 minutos" do README no painel publicado.
   3. Trocar os endereços locais da seção Acesso do README pelos publicados.
