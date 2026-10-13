# Problema e métricas

Como li o desafio, que perguntas do dono o painel responde e a definição exata de cada número. Voltar ao [README](../README.md).

## O problema e a leitura dele

O dono quer visibilidade sobre quem acessa o Wi-Fi de visitantes para decidir melhor. Leitura adotada: **o Wi-Fi é um sensor de fluxo da loja**; cada aparelho que conecta é um cliente presente. O painel responde perguntas de negócio, não lista conexões:

| Pergunta do dono | Métrica no painel | Decisão que habilita |
|---|---|---|
| Como foi o período? | Manchete com os visitantes do período e a variação vs. o anterior | Leitura em 3 segundos |
| Quando a loja enche? | Semana típica: uma coluna por dia (média, barras por hora, horário de pico, dia mais cheio e mais fraco) | Escala de equipe, horário de ações |
| Hoje está bom? | No cartão de hoje: visitantes até agora vs. o típico desse dia **até o mesmo horário** | Reagir no próprio dia |
| O movimento cresce? | Visitantes únicos e visitas, com variação vs. período anterior; série diária | Acompanhar a tendência |
| Como é um dia específico da semana? | Ao tocar num dia: movimento por hora contra a média de todos os dias, faixa de reforço de equipe, horário vazio, indicadores do dia contra os outros dias e cada ocorrência do dia no período | Escala hora a hora daquele dia |
| Quem está na loja e quem veio? | No painel, **Últimas visitas** (as 6 mais recentes e quantos estão na loja agora, com "Ver todas"); na tela **Visitas**, quantos estão na loja agora, e uma tabela com cada visita (cliente, entrada, saída, duração, novo ou recorrente, total de visitas, cadastro), com filtros e ficha do cliente | Atendimento, relacionamento |
| Quantas pessoas escalar? | Na análise do dia, **escala sugerida** por faixa de horário; no painel, a linha **Amanhã** (visitas esperadas e pico) com link para ela | Montar a escala da semana |
| A loja está cheia agora? | Tela Visitas e painel se atualizam sozinhos a cada 30 s e mostram um aviso de **loja cheia** (a partir de 40 pessoas, ajustável em `apps/web/lib/crowd.ts`) | Chamar reforço na hora |
| A loja fideliza quem vem pela primeira vez? | Tela **Clientes**: retenção por turma semanal de clientes novos (% que voltou em 7, 30 e 60 dias) e a média de cada prazo | Medir atendimento e programas de retorno |
| Quem vale chamar de volta? | Tela **Clientes**: sumidos que aceitaram contato, com **exportação em CSV** para campanha | Reativação |
| Quando a loja fica vazia? | Insight com a janela de 2 h mais vazia da semana | Treinamento, reposição, ação de horário |
| O cliente volta? | % de visitantes recorrentes; % de **novos que voltaram**; série diária novos × recorrentes | Fidelização, cupom de retorno |
| Quanto tempo fica? | Permanência mediana; distribuição em faixas | Proxy de interesse/atendimento |
| Quem posso contatar? | % que aceitou comunicações (opt-in LGPD) | Base de CRM |

O painel também mostra **insights em texto** gerados por regras (pico, dia mais fraco, horário mais vazio, tendência, recorrência baixa, opt-in baixo), cada um com a ação sugerida.

## O que o painel mostra

Períodos de 7, 30 ou 90 dias (filtro na URL: `/?range=30d`). Definições exatas:

- **Aparelho**: o MAC do celular, nunca guardado em claro (ver [Modelagem de dados](arquitetura.md#modelagem-de-dados)).
- **Visita**: uma ou mais conexões do mesmo aparelho em que a reconexão acontece em até **30 min** depois do fim da anterior (o celular cai e volta do Wi-Fi). Uma visita aberta (sem fim) absorve reconexões por até **12 h**. Isso torna a ingestão idempotente: reenviar o mesmo evento não duplica a visita.
- **Visitante único**: aparelho com ao menos uma visita no período.
- **Recorrente**: visita feita em um dia (local) posterior ao primeiro dia em que o aparelho foi visto. Visitante recorrente = aparelho com ao menos uma visita recorrente.
- **Novos que voltaram** (`newReturnRate`): dos aparelhos vistos pela primeira vez dentro do período, % que voltou num dia local seguinte, ainda dentro do período. Mede se o primeiro atendimento fideliza; o período anterior é medido do mesmo jeito, até o mesmo ponto.
- **Hoje vs. típico**: visitantes de hoje até agora contra a média desse dia da semana no período, proporcional à parte do dia que costuma já ter passado (curva de visitas por hora). Evita comparar um dia pela metade com um dia inteiro. A porcentagem só aparece quando o esperado até agora chega a 5 visitantes: logo depois de abrir, o esperado é uma fração de visitante e 0 contra 0,5 viraria "100% abaixo".
- **Análise do dia** (`/semana/segunda`, `/semana/sabado`…): a faixa de reforço é o trecho contínuo em volta do pico com pelo menos 60% do movimento do pico; o horário vazio é a janela de 2 h com menos movimento fora dessa faixa. Os indicadores do dia são comparados com a média dos outros dias do mesmo período, não com o período anterior.
- **Visitas e clientes** (`/visitas`): "na loja agora" = visita sem saída que começou há menos de 4 h (depois disso, conta como "sem saída registrada"). Segmento do cliente: **novo** (1 visita), **fiel** (4 ou mais visitas em 90 dias), **sumido** (já voltou, mas não aparece há mais de 30 dias) e **recorrente** (o resto).
- **Privacidade na tabela de visitas (LGPD)**: o cliente aparece por um apelido estável (os 6 primeiros caracteres do HMAC do MAC, que não revelam o aparelho). O primeiro nome só aparece para quem se cadastrou e aceitou contato; e-mail e MAC nunca saem da API (um teste e2e garante isso).
- **Escala sugerida**: pela lei de Little, clientes ao mesmo tempo ≈ visitas por hora × permanência típica; 1 pessoa para cada 2 clientes simultâneos (atendimento consultivo, constante `CLIENTS_PER_ATTENDANT` em `lib/day.ts`) e pelo menos 1 nas horas com movimento. **Amanhã** usa a média do mesmo dia da semana no período: é uma projeção pela média, não um modelo de previsão.
- **Retenção por turma**: turma = clientes vistos pela primeira vez numa semana (segunda a domingo, dia local); voltou = outra visita num dia seguinte dentro de 7, 30 ou 60 dias. Um prazo só é medido quando todos da turma já tiveram esse tempo (antes disso aparece "ainda medindo"); a média é ponderada pelo tamanho das turmas. São 12 semanas, para as mais antigas já completarem 60 dias.
- **Clientes para reativar**: 2 ou mais visitas, a última há mais de 30 dias, e cadastro com consentimento para comunicações.
- **Exceção de privacidade (CSV de reativação)**: o arquivo exportado leva nome e **e-mail**, porque sem contato não há reativação. Só entram clientes que aceitaram receber comunicações da loja, e o uso é exatamente esse. Na tela continuam só apelido e primeiro nome. O arquivo neutraliza fórmulas de planilha (injeção de CSV) e sai com BOM para o Excel abrir os acentos certos.
- **Horário mais vazio**: a janela de 2 h com a menor média de visitas, só entre horas em que a loja costuma ter movimento (horas sem nenhuma visita contam como loja fechada).
- **Permanência**: mediana das visitas **encerradas** (visitas abertas ficam fora).
- **Opt-in** (`optInRate`): visitantes que aceitaram receber comunicações ÷ todos os visitantes únicos do período (quem não se cadastrou conta como não aceitou). O painel mostra só taxas, nunca dados pessoais.
- **Comparação**: o período atual é comparado "até o mesmo ponto" com o anterior (30 dias até agora vs. os 30 dias anteriores até o mesmo horário). Contagens e minutos variam em %, taxas em pontos percentuais.
- **Fuso**: todas as agregações por dia/hora usam `America/Sao_Paulo`.

Há ainda a página `/simular`, para quem avalia o teste, com três ferramentas que passam pela mesma ingestão real, autenticadas pelo login do dono (`/simulate`, `/simulate/connection`):

- **Gerar movimento**: escolha um atalho (movimento fraco, hora do rush, loja lotada) **ou** digite uma quantidade de 1 a 200 (escolher um limpa o outro) e clique em Gerar; as visitas caem nas últimas 2 h.
- **Testar a regra de visita**: três cliques com um aparelho de teste novo. Conecta (visita nova), reconecta 10 min depois (soma à mesma visita, com o mesmo id) e volta 2 h depois (visita nova), mostrando a resposta da API.
- **Cadastro manual (avançado)**, recolhido: uma conexão com MAC, horários e cadastro do cliente, para ver a validação campo a campo; com link para o Swagger da API.
