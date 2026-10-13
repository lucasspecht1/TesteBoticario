# Rodar e testar

Como subir o projeto na sua máquina e o que cada suíte de teste cobre. Voltar ao [README](../README.md).

## Como rodar localmente

Requisitos: Node >= 24.9, pnpm 12 (`packageManager` em `package.json`) e Docker.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm dev   # Postgres + migrations + dados de demonstração, API (3001) e web (3000)
```

O `pnpm dev` começa com `docker compose run --rm --build seed`: sobe o Postgres 16 (usuário e senha `postgres`) com os dados na pasta `db/` (fora do git), aplica as migrations e, **se o banco estiver vazio**, cria a loja `loja-demo`, o login `dono@loja.demo` / `demo1234` e 180 dias de movimento determinístico (horário comercial, fim de semana, sazonalidade, ~30% de retorno), terminando no dia em que o banco foi criado. Na primeira vez o Docker constrói a imagem do seed (1 a 2 min); depois o passo leva poucos segundos e não mexe nos dados. `docker compose up -d` sozinho também deixa o banco pronto, e `pnpm dev:app` sobe só API e web.

Com `DEMO_AUTOFILL=true` (já no `.env.example`), a API mantém a loja demo atual: ao subir e a cada 5 min, gera as visitas que faltam desde a última até agora, no mesmo ritmo do seed e com ~30% de clientes que já existiam, e encerra cada visita aberta quando passa a permanência sorteada para ela (a mesma distribuição do seed, então a permanência típica e "na loja agora" continuam realistas). Assim a demonstração publicada não para no dia do seed. Os testes e o CI rodam com ela desligada.

- **Recomeçar do zero:** `docker compose down && sudo rm -rf db` (os arquivos da pasta são do usuário do Postgres no container) e `pnpm dev` de novo.
- **Recriar só os dados da `loja-demo`**, com o banco de pé: `pnpm --filter @wifi/api seed` (apaga e recria o histórico).
- **Sem Docker** (Postgres do brew, por exemplo): `createdb wifi`, ajuste o usuário/senha em `DATABASE_URL` de `apps/api/.env` e `apps/api/.env.test` (os exemplos usam `postgres:postgres`, como o `docker-compose.yml`), rode `pnpm --filter @wifi/api exec prisma migrate deploy && pnpm --filter @wifi/api seed` e suba com `pnpm dev:app`. O banco dos testes, `wifi_test`, é criado sozinho pelo `pretest:e2e`.

## Testes

```bash
pnpm --filter @wifi/shared build   # contrato compartilhado (o pnpm dev já faz isso)
pnpm format:check && pnpm lint && pnpm typecheck
pnpm test        # 68 testes unitários da API (jest) e 3 checagens do front (node --test)
pnpm test:e2e    # 34 testes e2e da API contra um Postgres real (o banco do docker compose precisa estar de pé)
pnpm build
```

- **Unitários** (sem banco): regra de visita (30 min / 12 h), normalização e HMAC do MAC, métricas (incluindo novos que voltaram e a análise por dia da semana) e insights (incluindo horário mais vazio), regras do cliente (apelido, primeiro nome só com consentimento, na loja agora, segmento, intervalo entre visitas), retenção por turma, CSV seguro (separador, aspas e injeção de fórmula), fuso horário, gerador de movimento, preenchimento da demo (~30% de clientes que voltam, um aparelho por MAC, visitas abertas encerradas na permanência sorteada com a mesma distribuição do gerador).
- **Front, cálculos da tela** (`apps/web/lib/*.check.mts`, no `pnpm test` e no CI com o executor de testes nativo do Node, `node --test`): semana típica, comparação de hoje até o mesmo horário, leitura do dia (faixa de reforço e horário vazio) e escala sugerida.
- **E2E** (`apps/api/test`): `/health`, ingestão (401 sem chave, 400 por campo, evento repetido não duplica), login, `/metrics` com e sem token, período inválido, `/simulate` e `/simulate/connection` (401 sem token, 201 com token), `/metrics/weekday` (401 sem token, 400 com dia fora de 0 a 6, 200 com o formato esperado), `/visits` e `/customers/:id` (401, 400 na busca, 200 sem e-mail nem MAC na resposta, 404 para cliente inexistente), retenção e reativação (401, 12 turmas, só sumidos com consentimento e sem e-mail na lista, CSV com o e-mail de quem aceitou e sem o de quem não aceitou), preenchimento automático da demo (não gera nada sem histórico, completa desde a última visita com parte dos clientes voltando, encerra a visita aberta cuja permanência já passou e avança o "visto por último", refaz sem erro uma rodada interrompida, só sorteia como cliente que volta quem foi visto nos últimos 90 dias). A suíte faz um login só e reaproveita o token, porque o limite de 10 logins por minuto continua ativo.
- **Banco do e2e separado.** Os testes e2e apagam dados, então usam um banco próprio, `wifi_test`, configurado em `apps/api/.env.test`; o `pretest:e2e` (`prisma migrate deploy`) cria esse banco se ele não existir e aplica as migrations. O arquivo usa `postgres:postgres`, como o `docker-compose.yml`, então ajuste o usuário em `DATABASE_URL` se o seu Postgres for diferente. Um guard recusa rodar se o host não for local ou se o nome do banco não terminar em `_test`; assim os dados do seed e bancos remotos ficam protegidos.
- **CI** (`.github/workflows/ci.yml`, GitHub Actions a cada push e PR): Postgres 16 como serviço (`wifi_test`), instala, builda o contrato, roda formatação (Prettier), lint (inclusive `no-explicit-any` e tipos de retorno explícitos nas exportações), tipos, testes unitários (API e checagens do front), e2e e build.
