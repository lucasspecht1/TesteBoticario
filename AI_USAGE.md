# Uso de IA neste projeto

Relato do que a IA fez, do que foi corrigido e do que foi decisão minha. A fonte factual é o diário [`docs/ai-log.md`](docs/ai-log.md), escrito ao fim de cada tarefa; a spec e o plano estão em [`docs/superpowers/`](docs/superpowers/).

## Ferramentas

- **Claude Code** (CLI da Anthropic) com o modelo **Claude Opus 5.5** como orquestrador: leitura do desafio, proposta de métricas, spec, plano, distribuição das tarefas e revisão final.
- Subagentes do Claude Code (modelos Sonnet e Haiku) para implementar cada tarefa e, separadamente, para revisá-la.

## Fluxo

1. **Leitura do desafio (PDF)** e proposta de métricas de negócio, modelagem e stack.
2. **Spec** (`docs/superpowers/specs/2026-10-12-painel-wifi-design.md`): problema, perguntas do dono → métricas → decisões, regras de domínio, arquitetura, erros, fora de escopo. Revisada antes de codar.
3. **Plano com TDD** (`docs/superpowers/plans/2026-10-12-painel-wifi.md`): tarefas pequenas com o código e os testes previstos.
4. **Execução tarefa a tarefa**: um subagente implementador por tarefa; um subagente revisor independente confere o resultado contra a spec e o plano; achados relevantes voltam para o implementador em rodadas de correção (limitadas); só então a tarefa é aceita.
5. **Revisão final** do conjunto e esta documentação.

O deploy (Neon, Railway, Vercel) foi adiado e ainda não aconteceu; está descrito no README.

## Decisões humanas

| Decisão | Detalhe |
|---|---|
| Stack | A IA propôs a stack; escolhi **Next.js + NestJS** no lugar de Vite + Fastify. |
| Prazo e escopo | Defini o prazo de 2 dias e o escopo (loja única na UI, agregação em memória, itens adiados listados no README). |
| Deploy | Decidi adiar o deploy e a publicação no GitHub. |
| Aprovação | Spec e plano foram revisados antes de qualquer código. |

Não há registro, no diário, de outras decisões humanas por tarefa (cada entrada traz "decisão humana: nenhuma" quando foi o caso).

## O que a IA fez bem

- **Contrato compartilhado**: schemas Zod em `@wifi/shared` usados pela API e pelo front, inclusive para erros por campo no formulário.
- **Regra de visita em funções puras** (reconexão em 30 min, visita aberta por até 12 h), com os testes escritos antes: vistos falhar e depois passar (13 testes na ingestão e 13 nas métricas, na época da tarefa).
- **Métricas como funções puras** (fuso da loja via `Intl`, períodos atual/anterior, deltas, mapa de calor, faixas de permanência, insights em português), testáveis sem banco.
- **Segurança de base**: MAC com HMAC-SHA256, `timingSafeEqual` na chave de ingestão, login com hash fictício e limite por e-mail, cookie `httpOnly`.
- **Verificação manual** além dos testes: `curl` na ingestão (201, `merged:true`, 401, 400), seed de 180 dias (8802 aparelhos, 12615 visitas), formulários do front enviados sem JavaScript para checar erros por campo.

## Onde a IA errou ou precisou de correção

Quase tudo abaixo foi pego pela revisão independente, não pelo implementador.

| Problema | Como foi tratado |
|---|---|
| **Guard do e2e burlável e risco de apagar dados de desenvolvimento.** O plano trazia uma checagem por substring na URL do banco, burlável (ex.: parâmetro `?host=`); os testes e2e rodavam no banco de desenvolvimento e o apagavam. | Banco dedicado `wifi_test` (`apps/api/.env.test`) e guard que interpreta a URL: host local e nome do banco terminando em `_test`. Duas rodadas de correção. |
| **`consentAt` sobrescrito em reenvios** (violaria o sentido do consentimento na LGPD). | Preservado: só é gravado na criação ou quando `marketingOptIn` muda. |
| **Corrida na criação do aparelho** (find-then-create gerava erro de unicidade `P2002` e resposta 500 sob requisições concorrentes). | Trocado por `device.upsert`, com ajuste monótono de primeira/última vez visto. Verificado com 4 POSTs concorrentes. |
| **`.env.example` do web não versionado**: o `.gitignore` do scaffold ignorava `.env*`. | Arquivo passou a ser versionado; também foram removidas sobras do scaffold e apertado o matcher do middleware. |
| **Formulário React 19 apagava os campos em caso de erro** (reset automático do formulário). | Formulário passou a manter os valores; erros aparecem no campo certo, inclusive o do `lead` aninhado. |
| **Versões diferentes do plano**: pnpm 12 (plano previa 10), `allowBuilds` em vez de `onlyBuiltDependencies`, `postinstall: prisma generate` falhando sem o schema, `@nestjs/jwt` 12 só ESM (o Jest não carregava). | Adaptações mínimas: `packageManager` e `allowBuilds` ajustados, schema criado antes do `pnpm add`, `test:e2e` com `--experimental-vm-modules`, `engines` Node >= 22.12. |
| **`lint` da API com `--fix`**, que alteraria o código no CI em vez de falhar. | Virou `lint:fix`; `lint` agora só verifica. |
| **"Barras do gráfico diário invisíveis" foi diagnóstico errado da IA controladora.** Ela atribuiu o problema a `fill="var(--color-novo)"` em atributo SVG, mas era artefato do print: a captura de página inteira redimensionou a viewport e pegou a animação das barras do Recharts em altura 0. Uma checagem posterior em Chrome headless mostrou que `var()` funciona em atributo SVG. | Mantida a troca para cores hex literais numa constante, por ser inofensiva; o diagnóstico e o comentário do código foram corrigidos. |
| **Estouro horizontal em 375 px.** Itens de grid sem `min-w-0` não encolhiam; também só apareceu no navegador headless. | `min-w-0` no `Card`; só o mapa de calor rola na horizontal. |
| **`pnpm dev` não subia a API e o README só servia ao usuário `lucas`.** A API não tinha script `dev` e os `.env` de exemplo traziam o usuário local. Achado pela revisão final. | Script `dev` na API; exemplos com `postgres:postgres` como no `docker-compose.yml`. |
| **Ingestão sem login.** A página `/simular` chamava `POST /connections` com a `INGEST_API_KEY` no servidor do Next, então qualquer pessoa com o cookie (sem validação do JWT no middleware) gravava dados. Achado pela revisão final. | Rota `POST /simulate/connection` protegida por JWT; o web deixou de conhecer a chave. |
| **Contagem de testes errada em um relatório de revisão** (o revisor contou diferente). | Verificado rodando a suíte (13/13) antes de aceitar. |

Pontos que a revisão apontou e **não foram corrigidos** (documentados como trade-offs no README): evento atrasado fora de ordem pode criar visita sobreposta, eventos simultâneos do mesmo aparelho podem duplicar visita, limite de login por e-mail não cobre tentativas espalhadas, mapa de calor conta o dia parcial de hoje como inteiro, visitas do simulador são sempre aparelhos novos e o seed ignora a regra de merge.

## Como a qualidade foi garantida

- **Testes primeiro** nas partes de regra de negócio (visita, métricas, gerador), vistos falhar antes de passar.
- **31 testes unitários e 18 e2e** contra Postgres real, mais lint, tipos (`strict: true`) e build em todos os pacotes.
- **Revisão independente por tarefa**, com rodadas de correção registradas; observações menores adiadas ficaram listadas no controle de execução.
- **CI** no GitHub Actions (`.github/workflows/ci.yml`) com o mesmo conjunto de verificações. O workflow ainda não rodou: não há remoto.
- **Limites da IA**: a revisão é feita por outro modelo, não por uma pessoa; por isso os agentes de IA executaram as verificações (testes, `curl`, formulários, navegador headless) em vez de apenas aceitar relatórios, e eu revisei o resultado.

## Referências

- Diário factual: [`docs/ai-log.md`](docs/ai-log.md)
- Spec e plano: [`docs/superpowers/`](docs/superpowers/)
