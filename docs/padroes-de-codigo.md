# Padrões de código

Regras que todo o código do projeto segue. Valem para a API (`apps/api`), o front (`apps/web`) e o contrato compartilhado (`packages/shared`). Quando uma regra não cabe num caso, a exceção é comentada no próprio código.

## Idioma

- **Identificadores em inglês** (variáveis, funções, componentes, tipos, arquivos).
- **Texto para o usuário em português** (rótulos, mensagens de erro, frases de insight).
- **Comentários e documentação em português**, como o resto do projeto.
- Segmentos de URL ficam em português (`/visitas`, `/semana/sabado`), porque são parte da interface.

## Nomes

- O nome diz **o que a coisa é ou faz**, não como é feita: `visitorsToday`, não `t` nem `val`.
- Nada de abreviação ou letra solta. Exceções aceitas: `i` como índice de laço curto e o parâmetro de callbacks de uma linha quando o tipo deixa óbvio (ex.: `rows.map((row) => …)` é preferível, mas `(_, i)` é aceitável).
- Booleanos começam com `is`, `has`, `can` ou `should`.
- Funções começam com verbo (`computeRetention`, `formatDuration`); componentes React são substantivos (`WeekColumns`).
- Unidades no nome quando há ambiguidade: `IN_STORE_MAX_MS`, `durationMinutes`, `medianDwellMinutes`.
- Constantes de módulo em `UPPER_SNAKE_CASE`; o resto em `camelCase`; tipos e componentes em `PascalCase`.

## Funções e componentes

- **Uma responsabilidade.** Se a descrição precisa de "e", provavelmente são duas funções.
- **Curtas:** como referência, até ~40 linhas por função e ~80 linhas de JSX por componente. Acima disso, extrair partes com nome próprio.
- **Sem números mágicos:** limites, prazos e tamanhos viram constantes nomeadas, com a regra de negócio no comentário.
- **Onde ficam as constantes:**
  - no topo do arquivo, logo depois dos imports, nunca entre funções nem dentro delas;
  - regra de negócio usada pela API e pelo painel vai para `packages/shared/src/constants.ts`;
  - constante de um módulo só fica no próprio módulo; quando o bloco passa de umas 8 constantes, vai para um arquivo ao lado (ex.: `simulation/generator-params.ts`, `simular/rule-steps.ts`, `charts/chart-theme.ts`);
  - não existe um arquivo único com todas as constantes do projeto: só vão para `constants.ts` as regras usadas pelos dois lados, e o resto mora perto de quem o usa;
  - listas e padrões que fazem parte dos schemas do contrato (`RANGE_DAYS`, `VISIT_STATUSES`…) ficam junto dos schemas, em `packages/shared/src/index.ts`.
- **Cálculo separado de apresentação:** regra de negócio fica em função pura (`lib/` no front, funções puras na API), testável sem banco e sem React.
- **Sem efeitos escondidos:** funções que leem ou gravam no banco ficam nos services; funções puras não fazem I/O.
- Tipos de retorno explícitos em funções exportadas; nada de `any`; asserção não nula (`!`) só com comentário do porquê.

## Reaproveitamento

- **Nada duplicado:** lógica ou marcação que aparece em dois lugares vira função ou componente compartilhado (formatação de datas e números, paginação, indicador "ao vivo", selos, cálculo de mediana e porcentagem, conversão de dia local).
- **Classes do Tailwind repetidas** (superfície de cartão, botão pílula, selo) viram constantes ou componentes; classes condicionais usam o helper `cx` em vez de templates longos.
- Antes de criar um helper, procurar se já existe um.

## Documentação

- **Toda exportação** (função, componente, tipo, constante) tem TSDoc de uma ou duas linhas dizendo para que serve e, quando não é óbvio, a unidade, o formato ou a regra de negócio.
- **Comentários explicam o porquê**, não o quê: decisões, limites conhecidos (`trade-off:`), regras de negócio, armadilhas de framework.
- Nada de comentário que repete o código, nem código comentado.

## Erros

- Erros conhecidos viram mensagens para o usuário com o próximo passo ("Tente de novo", "Corrija os campos destacados").
- Nada de `catch` vazio; quando um erro é ignorado de propósito, o comentário diz por quê.

## Testes

- Regra de negócio nova vem com teste escrito antes (unitário na API, checagem `lib/*.check.mts` no front).
- Descrição do teste diz o comportamento esperado, em português.

## Formatação e ferramentas

- **Prettier** em todos os pacotes (`pnpm format`); o CI roda `pnpm format:check`.
- **ESLint** sem avisos (`pnpm lint`) e **TypeScript estrito** (`pnpm typecheck`).
