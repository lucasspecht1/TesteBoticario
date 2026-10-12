# Painel de Wi-Fi de Visitantes — Spec

Data: 2026-10-12 · Prazo: 2 dias · Vaga: desenvolvedor full-stack (Grupo Boticário)

## 1. Problema

Dono de uma loja O Boticário quer visibilidade sobre os acessos dos clientes ao Wi-Fi de
visitantes para tomar decisões estratégicas. O Wi-Fi funciona como um **sensor de fluxo da
loja**: cada aparelho que conecta é um cliente presente.

Requisitos do desafio: frontend e backend publicados online; TypeScript obrigatório; dados
podem ser simulados via endpoint de cadastro; o que mostrar é decisão nossa.

Critérios avaliados: entendimento do problema, UI/UX, tratamento de erros, modelagem de
dados, qualidade/organização do código, boas práticas, full-stack, documentação, uso de IA.

## 2. Perguntas de negócio → métricas → decisões

| Pergunta do dono | Métrica no painel | Decisão que habilita |
|---|---|---|
| Quando a loja enche? | Mapa de calor dia da semana × hora (média de visitas) | Escala de equipe, horário de ações |
| O movimento cresce? | Visitantes únicos e visitas, com variação vs. período anterior | Medir efeito de campanhas e datas |
| O cliente volta? | % de visitantes recorrentes; série diária novos × recorrentes | Fidelização, cupom de retorno |
| Quanto tempo fica? | Permanência mediana; distribuição em faixas | Proxy de interesse/atendimento |
| Quem posso contatar? | % que aceitou comunicações (opt-in LGPD) | Base de CRM |

O painel também mostra **insights em texto** gerados por regras (pico, dia mais fraco,
tendência, recorrência baixa, opt-in baixo), cada um com a ação sugerida.

Períodos: 7, 30 ou 90 dias (filtro na URL). O período anterior é comparado "até o mesmo
ponto" (ex.: 30 dias até agora vs. os 30 dias anteriores até o mesmo horário).

## 3. Regras de domínio

- **Aparelho** = MAC do celular. Nunca guardamos o MAC em claro: `HMAC-SHA256(segredo, mac
  normalizado)` (LGPD; hash simples de MAC é reversível por força bruta).
- **Visita** = uma ou mais conexões do mesmo aparelho em que a reconexão acontece até
  **30 min** depois do fim da anterior (o celular cai e volta do Wi-Fi). Uma visita aberta
  (sem fim) absorve reconexões por até **12 h**. Isso também torna a ingestão idempotente:
  reenviar o mesmo evento não duplica visita.
- **Recorrente** = visita feita num dia (local) posterior ao primeiro dia em que o aparelho
  foi visto. Visitante recorrente no período = aparelho com ao menos uma visita recorrente.
- **Permanência** considera só visitas encerradas.
- **Lead** = cadastro opcional no portal do Wi-Fi (nome, e-mail, opt-in de marketing,
  data do consentimento). O painel mostra só taxas, nunca dados pessoais.
- Todas as agregações por dia/hora usam o **fuso da loja** (`America/Sao_Paulo`).

## 4. Arquitetura

Monorepo pnpm:

- `packages/shared` — schemas Zod + tipos do contrato (entrada de conexão, login, filtros,
  resposta de métricas). Usado pela API e pelo front.
- `apps/api` — NestJS + Prisma + Postgres. Módulos: `connections` (ingestão),
  `metrics` (agregações), `auth` (login JWT), `simulation` (gera movimento), `health`.
  Métricas são funções puras em TS sobre as visitas do período (testáveis sem banco).
- `apps/web` — Next.js (App Router) **apenas como front**: toda leitura e escrita passa pela
  API Nest. Server Components buscam os dados no servidor; o token fica em cookie httpOnly;
  a chave de ingestão fica só no servidor do Next (nunca vai ao navegador).

Endpoints:

| Método | Rota | Proteção | Função |
|---|---|---|---|
| POST | `/connections` | `x-api-key` | Cadastro de conexão (simula o portal do Wi-Fi) |
| POST | `/auth/login` | limite 10/min por e-mail | Login do dono → JWT 8 h |
| GET | `/metrics?range=7d\|30d\|90d` | JWT | Métricas do painel |
| POST | `/simulate` | JWT | Gera N visitas nas últimas 2 h |
| GET | `/health` | — | Saúde da API + banco |
| GET | `/docs` | — | Swagger |

Modelo de dados: `Store`, `Device` (macHash único por loja, primeira/última vez visto),
`Visit` (início, fim opcional; índices por loja+início e aparelho+início), `Lead` (1 por
aparelho, com consentimento), `User` (dono, vinculado à loja).

## 5. Erros e falhas

- API: validação Zod com mensagens por campo (400); filtro global com formato único
  `{statusCode, message, details?, path, timestamp}`; 401 para chave/token inválidos;
  404/409 para erros conhecidos do Prisma; 500 genérico com log; variáveis de ambiente
  validadas na inicialização (falha rápida); `/health` checa o banco.
- Front: `loading.tsx` (esqueleto), `error.tsx` (mensagem + tentar de novo), estado vazio
  com caminho para gerar dados, sessão expirada → volta ao login com aviso, timeout de 10 s
  nas chamadas, erros de formulário por campo.

## 6. Fora do escopo (documentado no README como próximos passos)

Múltiplas lojas na UI, exportação de leads para CRM, agregações pré-calculadas (hoje
agregamos em memória — ok até centenas de milhares de visitas/período), modo escuro,
integração real com controladora Wi-Fi.

## 7. Entregáveis

API publicada (Railway) + banco (Neon) + web publicada (Vercel); CI no GitHub Actions;
README (problema, decisões, arquitetura, como rodar, credenciais de demo, limitações);
`AI_USAGE.md` (como a IA foi usada, com exemplos reais registrados em `docs/ai-log.md`).
