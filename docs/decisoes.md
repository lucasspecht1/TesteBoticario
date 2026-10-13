# Decisões, limites e próximos passos

Os atalhos que tomei de propósito, o que faria a seguir e uma recomendação para medir campanhas. Voltar ao [README](../README.md).

## Decisões e trade-offs

Atalhos deliberados, cada um com o limite e o próximo passo. Os dez primeiros estão marcados com `trade-off:` no código (`grep -rn "trade-off:" apps packages`); os demais foram identificados nas revisões e registrados aqui.

| Atalho | Limite | Próximo passo |
|---|---|---|
| Métricas agregadas em memória (`compute-metrics.ts`) | Ok até centenas de milhares de visitas por período | `GROUP BY` no Postgres ou tabela diária pré-calculada |
| Uma chave de ingestão = uma loja (`api-key.guard.ts`) | Só atende `DEFAULT_STORE_ID` | Tabela de chaves por loja |
| Início do dia local usa o deslocamento do fuso no instante `date` (`time.ts`) | Erra se houver horário de verão entre a meia-noite e `date` (o Brasil não tem desde 2019) | Cálculo de transição de fuso, se houver lojas em outros países |
| Gerador de movimento com UTC-3 fixo (`generator-params.ts`) | Só vale para fuso de Brasília | Usar `localParts` com o fuso da loja |
| `datetime-local` do formulário assume UTC-3 (`simular/actions.ts`) | Painel de uma loja só | Enviar o fuso da loja ao front |
| Eventos simultâneos do mesmo aparelho (`connections.service.ts`) | Dois primeiros eventos concorrentes podem criar duas visitas | Lock por aparelho (ex.: advisory lock) se a controladora enviar em paralelo |
| Preenchimento automático da demo grava direto no banco (`demo-autofill.service.ts`) | Não passa pela regra de reconexão; a visita aberta (inclusive as de "Simular dados") é encerrada por uma permanência sorteada, não por um evento real de saída; depois de dias com a API desligada, a primeira rodada passa de 30% de clientes que voltam (o gerador já repete aparelhos dentro da janela) | Alimentar a demo pela ingestão real, como uma controladora simulada |
| Uma rodada do preenchimento grava clientes novos e clientes que voltam em duas etapas, sem transação (`demo-autofill.service.ts`) | Uma queda entre as duas deixa a janela sem as visitas de quem volta (nada duplica) | Gravar as duas partes numa transação |
| Janela mais vazia com largura fixa de 2 h (`lib/day.ts` e `insights.ts`) | A mesma ideia é calculada no front e na API | Levar o cálculo para um lugar só, ajustando os dois lados juntos até lá |
| Resposta de sucesso da API não é revalidada no front (`lib/api.ts`) | O tipo vem do contrato compartilhado, sem checagem em tempo de execução | Validar a resposta com os schemas Zod de `@wifi/shared` |
| Evento atrasado fora de ordem | Pode criar uma visita sobreposta a outra | Reordenar/mesclar visitas ao receber eventos antigos |
| Limite de login por e-mail | Não impede tentativas espalhadas por vários e-mails | Limite também por IP e bloqueio progressivo |
| Média por hora (semana típica) conta o dia de hoje (parcial) como dia inteiro | Leve viés para baixo no dia da semana atual | Dividir pelo tempo decorrido do dia atual |
| Lista de visitas com paginação por `OFFSET` e contagem de visitas por cliente em subconsulta | Ok para dezenas de milhares de visitas por período | Paginação por cursor e contagem pré-calculada no `Device` |
| "Na loja agora" usa visita aberta há menos de 4 h | Quem sai sem a controladora registrar a saída some da contagem depois de 4 h | Receber o evento de saída da controladora real |
| "Hoje vs. típico" estima visitantes pela curva de visitas por hora | Supõe que hoje segue o formato de um dia típico | Série por hora de visitantes únicos na API |
| Visitas geradas em "Simular dados" | Todas são aparelhos novos e ignoram o horário da loja | Reaproveitar aparelhos existentes |
| Seed grava direto no banco | Não passa pela regra de merge de reconexões | Passar pelo `ConnectionsService` (custo: seed mais lento) |

## Próximos passos

Pensados da cadeira do gerente, em ordem de valor para o negócio:

- **Conversão**: cruzar o fluxo com as vendas do PDV (visitantes × cupons). É a métrica mais pedida por franqueado; muita gente e pouca venda aponta problema de atendimento ou vitrine.
- **Permanência × ticket médio**: se quem fica mais de 15 min compra mais, o foco vira segurar o cliente na loja (consultoria, degustação).
- **Alerta no celular** quando o dia está anormalmente fraco até o meio-dia (já existe a comparação até o mesmo horário).
- **Comparação com a rede**: a mesma loja contra outras da região.
- Múltiplas lojas na interface (o modelo de dados já separa tudo por `storeId`; falta a chave de ingestão por loja e a escolha de loja na UI).
- Exportação de leads para CRM.
- Agregações pré-calculadas (hoje em memória).
- Modo escuro.
- Integração real com a controladora Wi-Fi (hoje o simulador faz o papel do portal).

## Recomendação: medir o efeito de campanhas

Uma pergunta natural do gerente é "a campanha funcionou?". Pedi à IA o cadastro de campanhas com o efeito no gráfico e tirei antes da entrega, porque a conta simples (média durante a campanha contra a média dos outros dias) engana: o movimento varia muito por dia da semana (sábado tem mais que o dobro de domingo), então uma campanha de fim de semana sempre parece um sucesso. Com dados simulados, o "efeito" seria só ruído.

O que eu faria:

1. **Comparar com o esperado para os mesmos dias.** Para cada dia da campanha, o esperado é a média do mesmo dia da semana nas semanas sem campanha; o efeito é o realizado contra esse esperado, com a faixa de variação normal (desvio entre semanas) para não chamar ruído de resultado.
2. **Separar novos e recorrentes**: campanha boa traz cliente novo e, depois, faz ele voltar (a métrica de novos que voltaram já existe).
3. **Não depender de cadastro manual**: puxar as campanhas do calendário de marketing da rede, que já existe, em vez de pedir que o gerente lembre de marcar.
