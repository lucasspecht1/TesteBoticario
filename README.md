# Painel de Wi-Fi de Visitantes

Painel para o dono de uma loja O Boticário entender o fluxo de clientes a partir dos acessos ao Wi-Fi de visitantes. Desafio técnico para a vaga de desenvolvedor full-stack (Grupo Boticário), feito em 2 dias.

![Painel com 30 dias de dados](docs/painel.png)

## Links

O deploy (Neon, Railway, Vercel) **ainda não foi feito**: o repositório não tem remoto e as contas não foram criadas. A seção [Como publicar](#como-publicar) resume os passos. Enquanto isso, rodando localmente ([Como rodar](#como-rodar-localmente)):

| O quê | URL |
|---|---|
| Painel (web) | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |
| Login de demonstração | `dono@loja.demo` / `demo1234` |

## O problema e a leitura dele

O dono quer visibilidade sobre quem acessa o Wi-Fi de visitantes para decidir melhor. Leitura adotada: **o Wi-Fi é um sensor de fluxo da loja**; cada aparelho que conecta é um cliente presente. O painel responde perguntas de negócio, não lista conexões:

| Pergunta do dono | Métrica no painel | Decisão que habilita |
|---|---|---|
| Quando a loja enche? | Mapa de calor dia da semana × hora (média de visitas) | Escala de equipe, horário de ações |
| O movimento cresce? | Visitantes únicos e visitas, com variação vs. período anterior | Medir efeito de campanhas e datas |
| O cliente volta? | % de visitantes recorrentes; série diária novos × recorrentes | Fidelização, cupom de retorno |
| Quanto tempo fica? | Permanência mediana; distribuição em faixas | Proxy de interesse/atendimento |
| Quem posso contatar? | % que aceitou comunicações (opt-in LGPD) | Base de CRM |

O painel também mostra **insights em texto** gerados por regras (pico, dia mais fraco, tendência, recorrência baixa, opt-in baixo), cada um com a ação sugerida.

## O que o painel mostra

Períodos de 7, 30 ou 90 dias (filtro na URL: `/?range=30d`). Definições exatas:

- **Aparelho**: o MAC do celular, nunca guardado em claro (ver [Modelagem](#modelagem-de-dados)).
- **Visita**: uma ou mais conexões do mesmo aparelho em que a reconexão acontece em até **30 min** depois do fim da anterior (o celular cai e volta do Wi-Fi). Uma visita aberta (sem fim) absorve reconexões por até **12 h**. Isso torna a ingestão idempotente: reenviar o mesmo evento não duplica a visita.
- **Visitante único**: aparelho com ao menos uma visita no período.
- **Recorrente**: visita feita em um dia (local) posterior ao primeiro dia em que o aparelho foi visto. Visitante recorrente = aparelho com ao menos uma visita recorrente.
- **Permanência**: mediana das visitas **encerradas** (visitas abertas ficam fora).
- **Opt-in**: % dos visitantes com cadastro que aceitaram comunicações. O painel mostra só taxas, nunca dados pessoais.
- **Comparação**: o período atual é comparado "até o mesmo ponto" com o anterior (30 dias até agora vs. os 30 dias anteriores até o mesmo horário). Contagens e minutos variam em %, taxas em pontos percentuais.
- **Fuso**: todas as agregações por dia/hora usam `America/Sao_Paulo`.

Há ainda a página `/simular`, que gera movimento (N visitas nas últimas 2 h) e registra uma conexão manual, passando pela mesma ingestão real.

## Arquitetura

```mermaid
flowchart LR
  Portal[Portal Wi-Fi / Simulador] -- POST /connections + x-api-key --> API
  Browser -- cookie httpOnly --> Web[Next.js na Vercel]
  Web -- Bearer JWT --> API[NestJS no Railway]
  API --> DB[(Postgres no Neon)]
```

Monorepo pnpm:

| Pacote | Papel |
|---|---|
| `packages/shared` (`@wifi/shared`) | Schemas Zod e tipos do contrato (conexão, login, filtros, resposta de métricas). Usado pela API e pelo front: a validação é a mesma nos dois lados. |
| `apps/api` (`@wifi/api`) | NestJS + Prisma + Postgres. Módulos `connections` (ingestão), `metrics`, `auth`, `simulation`, `health`. As métricas são funções puras em TypeScript sobre as visitas do período, testáveis sem banco. |
| `apps/web` (`@wifi/web`) | Next.js (App Router) **apenas como front**. Server Components buscam os dados no servidor; server actions fazem login e escrita. |

Endpoints da API:

| Método | Rota | Proteção | Função |
|---|---|---|---|
| POST | `/connections` | `x-api-key` | Cadastro de conexão (simula o portal do Wi-Fi) |
| POST | `/auth/login` | limite de 10/min por e-mail | Login do dono, JWT de 8 h |
| GET | `/metrics?range=7d\|30d\|90d` | JWT | Métricas do painel |
| POST | `/simulate` | JWT | Gera N visitas nas últimas 2 h |
| GET | `/health` | nenhuma | Saúde da API e do banco |
| GET | `/docs` | nenhuma | Swagger |

**Por que o Next não fala com o banco.** Toda leitura e escrita passa pela API Nest: um único lugar com regras de negócio, validação e autorização, e o front pode ser trocado sem tocar nos dados. Os segredos ficam só no servidor: o JWT vai em cookie `httpOnly` (`painel_sessao`) e a `INGEST_API_KEY` só existe no servidor do Next; nenhum dos dois chega ao JavaScript do navegador.

## Modelagem de dados

Cinco tabelas (`apps/api/prisma/schema.prisma`):

| Tabela | Conteúdo |
|---|---|
| `Store` | Loja e seu fuso (`America/Sao_Paulo`). |
| `Device` | Aparelho: `macHash` único por loja, primeira e última vez visto. |
| `Visit` | Uma ida à loja: início, fim opcional. |
| `Lead` | Cadastro opcional no portal (1 por aparelho): nome, e-mail, `marketingOptIn`, `consentAt`. |
| `User` | O dono, vinculado à loja. |

Decisões:

- **HMAC do MAC (LGPD).** O MAC é um identificador pessoal. Guardamos `HMAC-SHA256(MAC_HASH_SECRET, mac normalizado)`. Um hash simples seria reversível por força bruta (o espaço de MACs é pequeno); com o segredo no servidor, o vazamento do banco não revela os aparelhos. Isso ainda permite reconhecer o mesmo aparelho entre visitas.
- **Índice `(storeId, startedAt)` em `Visit`.** Toda consulta do painel é "visitas da loja no período"; o índice a cobre. O índice `(deviceId, startedAt)` atende a busca da visita anterior do aparelho na ingestão.
- **`Lead.consentAt`.** O consentimento é uma prova: registramos quando foi dado. O horário é preservado em reenvios do mesmo evento e só muda quando o `marketingOptIn` muda.
- **`@@unique([storeId, macHash])`** em `Device` garante um registro por aparelho mesmo com requisições concorrentes (a criação usa `upsert`).

## Erros e falhas

**API**
- Validação Zod com mensagens por campo (400).
- Filtro global com formato único: `{statusCode, message, details?, path, timestamp}`.
- 401 para chave de ingestão ou token inválidos; 404/409 para erros conhecidos do Prisma; 500 genérico com log (sem vazar detalhes).
- Variáveis de ambiente validadas na inicialização (falha rápida com mensagem clara).
- `/health` checa também o banco.
- Login: limite de 10 tentativas por minuto por e-mail (429) e comparação com hash fictício para não revelar se o e-mail existe.
- Chave de ingestão comparada com `timingSafeEqual`.

**Front**
- `loading.tsx` (esqueleto) e `error.tsx` (mensagem + tentar de novo).
- Estado vazio com caminho para gerar dados.
- Sessão expirada (401 da API) volta ao login com aviso.
- Timeout de 10 s nas chamadas à API.
- Erros de formulário por campo, reaproveitando os schemas Zod do pacote compartilhado.

## Como rodar localmente

Requisitos: Node >= 22.12, pnpm 12 (`packageManager` em `package.json`) e Postgres 16.

```bash
# 1. Postgres 16: brew (createdb wifi) ou Docker (usuário postgres, senha postgres, banco wifi)
docker compose up -d

# 2. Variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# ajuste o usuário em DATABASE_URL de apps/api/.env (o exemplo usa o usuário local "lucas", sem senha;
# com o docker compose use postgresql://postgres:postgres@localhost:5432/wifi)

# 3. Dependências, contrato compartilhado, migrations e dados de demonstração
pnpm install
pnpm --filter @wifi/shared build
pnpm --filter @wifi/api exec prisma migrate dev
pnpm --filter @wifi/api seed

# 4. Sobe API (3001) e web (3000)
pnpm dev
```

O seed cria a loja `loja-demo`, o usuário `dono@loja.demo` / `demo1234` e 180 dias de movimento determinístico (horário comercial, fim de semana, sazonalidade, ~30% de retorno). Rodar de novo apaga e recria os dados da `loja-demo`.

## Testes

```bash
pnpm lint && pnpm typecheck
pnpm test        # 31 testes unitários (jest)
pnpm test:e2e    # 11 testes e2e da API contra um Postgres real
pnpm build
```

- **Unitários** (sem banco): regra de visita (30 min / 12 h), normalização e HMAC do MAC, métricas e insights, fuso horário, gerador de movimento.
- **E2E** (`apps/api/test`): `/health`, ingestão (401 sem chave, 400 por campo, evento repetido não duplica), login, `/metrics` com e sem token, período inválido.
- **Banco do e2e separado.** Os testes e2e apagam dados, então usam um banco próprio, `wifi_test`, configurado em `apps/api/.env.test`. Crie-o com `createdb wifi_test` e **edite o usuário** em `DATABASE_URL` (o arquivo usa o usuário local `lucas`, sem senha). Um guard recusa rodar se o host não for local ou se o nome do banco não terminar em `_test`; assim os dados do seed e bancos remotos ficam protegidos. `pretest:e2e` aplica as migrations nesse banco.
- **CI** (`.github/workflows/ci.yml`, GitHub Actions a cada push e PR): Postgres 16 como serviço (`wifi_test`), instala, builda o contrato, roda lint, tipos, testes unitários, e2e e build.

## Decisões e trade-offs

Atalhos deliberados, cada um com o limite e o próximo passo. Os seis primeiros estão marcados com `trade-off:` no código (`grep -rn "trade-off:" apps packages`); os demais foram identificados nas revisões e registrados aqui.

| Atalho | Limite | Próximo passo |
|---|---|---|
| Métricas agregadas em memória (`compute-metrics.ts`) | Ok até centenas de milhares de visitas por período | `GROUP BY` no Postgres ou tabela diária pré-calculada |
| Uma chave de ingestão = uma loja (`api-key.guard.ts`) | Só atende `DEFAULT_STORE_ID` | Tabela de chaves por loja |
| Início do dia local usa o deslocamento do fuso no instante `date` (`time.ts`) | Erra se houver horário de verão entre a meia-noite e `date` (o Brasil não tem desde 2019) | Cálculo de transição de fuso, se houver lojas em outros países |
| Gerador de movimento com UTC-3 fixo (`generator.ts`) | Só vale para fuso de Brasília | Usar `localParts` com o fuso da loja |
| `datetime-local` do formulário assume UTC-3 (`simular/actions.ts`) | Painel de uma loja só | Enviar o fuso da loja ao front |
| Eventos simultâneos do mesmo aparelho (`connections.service.ts`) | Dois primeiros eventos concorrentes podem criar duas visitas | Lock por aparelho (ex.: advisory lock) se a controladora enviar em paralelo |
| Evento atrasado fora de ordem | Pode criar uma visita sobreposta a outra | Reordenar/mesclar visitas ao receber eventos antigos |
| Limite de login por e-mail | Não impede tentativas espalhadas por vários e-mails | Limite também por IP e bloqueio progressivo |
| Mapa de calor conta o dia de hoje (parcial) como dia inteiro | Leve viés para baixo nas células do dia atual | Dividir pelo tempo decorrido do dia atual |
| Visitas geradas em "Simular dados" | Todas são aparelhos novos e ignoram o horário da loja | Reaproveitar aparelhos existentes |
| Seed grava direto no banco | Não passa pela regra de merge de reconexões | Passar pelo `ConnectionsService` (custo: seed mais lento) |

## Como publicar

Ainda não executado. Passos planejados:

1. **GitHub**: criar o repositório e dar `git push`; o CI roda sozinho.
2. **Banco (Neon)**: projeto `painel-wifi`, região São Paulo se disponível. Usar a connection string **direta** (sem `-pooler`), com `?sslmode=require`.
3. **API (Railway)**: deploy do repositório com
   - Build: `pnpm install --frozen-lockfile && pnpm --filter @wifi/api... build`
   - Start: `pnpm --filter @wifi/api exec prisma migrate deploy && pnpm --filter @wifi/api start:prod`
   - Healthcheck: `/health`
   - Variáveis: `DATABASE_URL` (Neon), `JWT_SECRET`, `INGEST_API_KEY`, `MAC_HASH_SECRET` (cada um com `openssl rand -hex 32`), `DEFAULT_STORE_ID=loja-demo`. O `PORT` é injetado pelo Railway. Gerar o domínio público.
4. **Seed de produção** (da máquina local, com os mesmos segredos de produção):
   ```bash
   cd apps/api && DATABASE_URL='<neon>' MAC_HASH_SECRET='<prod>' JWT_SECRET='<prod>' INGEST_API_KEY='<prod>' pnpm seed
   ```
5. **Web (Vercel)**: Root Directory `apps/web`; Build Command `cd ../.. && pnpm --filter @wifi/web... build`; Install Command `cd ../.. && pnpm install --frozen-lockfile`; variáveis `API_URL=https://<api>` (sem barra no fim) e `INGEST_API_KEY=<prod>`.
6. Conferir `https://<api>/health` e rodar o roteiro no painel publicado; depois atualizar a seção Links.

## Próximos passos

- Múltiplas lojas na interface (o modelo de dados já separa tudo por `storeId`; falta a chave de ingestão por loja e a escolha de loja na UI).
- Exportação de leads para CRM.
- Agregações pré-calculadas (hoje em memória).
- Modo escuro.
- Integração real com a controladora Wi-Fi (hoje o simulador faz o papel do portal).

## Documentação relacionada

- [`AI_USAGE.md`](AI_USAGE.md): como a IA foi usada, com exemplos reais.
- [`docs/ai-log.md`](docs/ai-log.md): diário factual, tarefa a tarefa.
- [`docs/superpowers/`](docs/superpowers/): spec e plano de implementação.
