# Uso de IA no projeto

Conduzi este projeto do começo ao fim e usei a IA como ferramenta de execução. Entendi o problema, defini a estratégia, tomei as decisões de produto, de arquitetura e de design, e revisei cada entrega. A IA escreveu o código e os testes seguindo o plano que aprovei, e o processo de revisão que montei conferiu esse trabalho. O registro tarefa a tarefa está no diário [`ai-log.md`](ai-log.md); a spec e o plano estão em [`planejamento/`](planejamento/).

## Como trabalhei com a IA

1. **Problema antes do código.**
   - Li o desafio e fixei a leitura que guia o painel: o Wi-Fi como sensor do fluxo da loja, respondendo perguntas de dono, não listando conexões.
   - Pedi à IA propostas de métricas, modelagem e stack. Escolhi Next.js + NestJS.
2. **Spec e plano aprovados antes de qualquer linha.**
   - A spec liga cada pergunta do dono a uma métrica e a uma decisão.
   - O plano divide o trabalho em tarefas pequenas, com os testes previstos.
   - Revisei os dois antes da execução.
3. **Execução com revisão independente.** Defini o processo: para cada tarefa, um agente de IA implementa com os testes escritos antes, e outro agente, sem o histórico do primeiro, revisa contra a spec. O achado volta para correção, e a tarefa só é aceita depois disso.
4. **Validação na cadeira do gerente.**
   - Pedi à IA que usasse o painel no papel de gerente de loja e dissesse o que faltava. Dessa lista, escolhi o que entrava: hoje contra o típico até o mesmo horário, novos que voltaram, análise de cada dia da semana, escala sugerida, tabela de visitas, retenção e reativação.
   - O que não se sustentava eu tirei. As campanhas, por exemplo, ficaram prontas e eu as tirei: achei a função fraca, e a IA confirmou que a medição enganava por causa da variação entre os dias da semana.
5. **Design guiado pela marca.**
   - Pedi a identidade O Boticário e mandei a IA medir o site oficial e o brand guidelines.
   - Comparei as composições montadas e escolhi a estrutura.
6. **Código limpo como regra.** Pedi uma revisão rígida de todo o código. A régua foi escrita em [`padroes-de-codigo.md`](padroes-de-codigo.md), um revisor independente apontou 65 pontos, e as regras automatizáveis passaram a ser checadas pelo ESLint e pelo Prettier no CI.
7. **Avaliação franca antes da entrega.** Pedi à IA uma crítica honesta do projeto como um avaliador faria. Daí vieram:
   - o preenchimento automático da demo, para os dados publicados não pararem no dia do seed;
   - a correção do alarme falso de manhã;
   - as checagens do front no CI;
   - a limpeza do que não devia chegar ao avaliador.

## Ferramentas

- **Claude Code** com o modelo Claude Opus 5.5, para orquestrar: spec, plano, distribuição das tarefas e revisão final.
- **Subagentes** do Claude Code (Sonnet e Haiku), um para implementar e outro para revisar cada tarefa.
- **No design:** as skills impeccable (comparação de estruturas, detector e revisor final), taste-skill (filtro contra interface genérica de IA) e web-design-guidelines da Vercel (acessibilidade e UX).
- **Playwright**, para medir o site da marca, capturar telas e clicar nos fluxos no build de produção.

## Decisões que foram minhas

| Tema | Decisão |
|---|---|
| Leitura do problema | O Wi-Fi como sensor de fluxo; o painel responde "quando enche, se cresce, se o cliente volta, quanto fica, quem posso contatar". |
| Stack e escopo | Next.js + NestJS + Prisma + Postgres em monorepo com contrato Zod compartilhado; prazo de 2 dias; loja única na interface. |
| Processo | Spec e plano antes do código; testes antes da implementação; revisão independente por tarefa. |
| Identidade visual | Padrão da marca O Boticário, logo oficial, só tema claro, verde `#4C765F` do site atual no lugar do Jade do guia. |
| Estrutura do painel | manchete do período e a semana típica, escolhida entre as composições comparadas. |
| Funcionalidades | Análise detalhada ao tocar num dia; tabela de visitas com entrada, saída e duração; "Últimas visitas" no painel; filtros agrupados; geração de movimento por atalho ou quantidade. |
| Privacidade | Cliente por apelido na tela e e-mail só no CSV de reativação, de quem aceitou contato (a proposta foi da IA e eu aprovei). |
| O que saiu | Campanhas (medição enganosa por dia da semana), a composição em linha do tempo e o card verde do login. |
| Qualidade | Revisão rígida de clean code; constantes perto de quem as usa, em vez de um arquivo global (a forma foi recomendação da IA, que aprovei). |
| Demo publicada | Um comando só para subir o banco com a demo, e o preenchimento automático dos dados (a IA apontou a necessidade e eu aprovei o desenho). |

## Onde a IA errou e como foi pego

O processo de revisão existe porque a IA erra com confiança. Os principais casos:

| Erro da IA | Como foi pego e corrigido |
|---|---|
| A proteção dos testes e2e era burlável e os testes apagavam o banco de desenvolvimento. | Revisão da tarefa. Banco de teste próprio e guarda que só aceita host local e nome terminado em `_test`. |
| O consentimento (`consentAt`) era sobrescrito a cada reenvio, o que contraria a LGPD. | Revisão da tarefa. Agora só muda quando o aceite muda. |
| A página de simulação gravava dados sem login (usava a chave de ingestão no servidor do Next). | Revisão final. Rota nova protegida por JWT; o front deixou de conhecer a chave. |
| Os filtros não navegavam em produção desde a primeira versão (`loading.tsx` no Next 15.5). | Testando o build de produção clicando. Trocado por `<Suspense key>`. |
| A consulta SQL usava o fuso errado: "hoje" mostrava 155 visitas contra 414 do contador. | Conferência de números entre telas. Datas levadas a UTC, conferido contra o banco. |
| O primeiro redesign usava uma fonte serifada; o guia da marca mostrava a Domaine **Sans**. | Comparação com o brand guidelines. Trocada pela Belleza. |
| Os relatórios dos agentes afirmavam quatro mudanças que não tinham sido feitas. | Revisor independente. Corrigido e conferido no código; as regras viraram ESLint para não depender de relatório. |
| O cartão de hoje mostrava "100% abaixo do típico" logo depois de abrir, com 0 visitantes. | Avaliação franca. A comparação só aparece quando o esperado chega a 5 visitantes. |

Os pontos que a revisão levantou e eu decidi não corrigir estão em [`decisoes.md`](decisoes.md), cada um com o limite e o próximo passo.

## Como garanti a qualidade

- **Nada foi aceito por relatório.** A IA rodou as verificações (68 testes unitários, 34 e2e contra Postgres real, lint, tipos, build, `curl` na API e cliques no navegador), e eu revisei o resultado e as telas.
- **O CI no GitHub Actions** repete o mesmo conjunto a cada push.
- **Antes e depois de cada mudança grande**, prints de todas as telas no desktop e no celular, comparados, para garantir que nada mudou sem querer.
