---
name: Painel da loja O Boticário
description: Painel de fluxo de clientes pelo Wi-Fi, em relatório + semana + visitas, na identidade O Boticário (verde #4C765F, Belleza e DM Sans).
colors:
  brand: "#4C765F"
  brand-strong: "#3A5C4A"
  brand-deep: "#495141"
  brand-soft: "#E6EEE9"
  quartzo: "#6FA286"
  esmeralda: "#009F67"
  primavera: "#93DA49"
  rose: "#D0C4C5"
  rose-soft: "#EBE2E3"
  musk: "#B6A19B"
  reforco-resto: "#B5CDBF"
  mauve: "#6E5853"
  ink: "#212121"
  ink-2: "#4A4A4A"
  ink-3: "#666666"
  paper: "#F2F2F2"
  card: "#FFFFFF"
  line: "#E3E3E3"
  down: "#A8463B"
  down-soft: "#F7E9E7"
typography:
  display:
    fontFamily: "Belleza, DM Sans, Helvetica, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.1
  display-number:
    fontFamily: "Belleza, DM Sans, Helvetica, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1
  kpi-number:
    fontFamily: "Belleza, DM Sans, Helvetica, sans-serif"
    fontSize: "2.4rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "DM Sans, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  reading:
    fontFamily: "DM Sans, Helvetica, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "DM Sans, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  chip: "4px"
  card: "12px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-strong}"
  range-tab:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  range-tab-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
  nav-link-active:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-strong}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  day-column-busiest:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "16px"
  day-pill:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  day-pill-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
  day-column-weakest:
    backgroundColor: "{colors.rose-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  delta-up:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-strong}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  delta-down:
    backgroundColor: "{colors.down-soft}"
    textColor: "{colors.down}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  panel-staffing:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "24px"
  field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "10px 14px"
  filter-pill:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  filter-pill-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
  search-field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px 8px 36px"
  chip-live:
    backgroundColor: "{colors.primavera}"
    textColor: "{colors.brand-deep}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  chip-novo:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  chip-recorrente:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-strong}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  chip-fiel:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  chip-sumido:
    backgroundColor: "{colors.rose-soft}"
    textColor: "{colors.mauve}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  page-number-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    size: "36px"
---

# Design System: Painel da loja O Boticário

## Overview

**Creative North Star: "O Relatório da Semana"**

O painel abre dizendo como foi o período numa frase, com o número de visitantes em verde dentro dela, e logo em seguida mostra o que fazer na semana: sete colunas, de segunda a domingo, cada uma com média, barras por hora e pico. Cada coluna é um link: tocar num dia abre a análise daquele dia da semana (horas, escala, comparação com os outros dias). Não há grade de cartões de KPI no topo; os indicadores vêm depois, numa régua única. A resposta vem antes do gráfico. Ao lado, a página Visitas lista cada ida à loja (entrada, saída, duração) e o perfil de cada cliente, sempre por apelido: privacidade é regra de design, não detalhe de dados.

A identidade é a de O Boticário, confirmada pelo Lucas: fundo cinza-claro, cartões brancos de 12px, um único verde de ação (#4C765F, preferido ao Jade do guia), Belleza leve nos títulos e números, DM Sans no texto. A superfície é calma e precisa; a marca vive nos detalhes (selos de 4px, pílulas, sombra tingida de Veludo verde), não em enfeite. Só tema claro.

**Key Characteristics:**
- Manchete em frase com o número em verde; filtro de período em pílula à direita.
- Colunas da semana são links para a análise do dia (/semana/[dia]), que responde em verde cheio "para a escala de <dia>".
- Semana em 7 colunas: mais cheio em verde cheio, mais fraco em rosado (Cinza malva), hoje contornado em Verde-primavera.
- Verde #4C765F é a única cor de ação; os demais verdes só aparecem em dados e no login.
- Cartões brancos de 12px, sombra tingida de verde, sem bordas.
- Visitas: faixa ao vivo (Na loja agora), período em pílulas e os demais filtros num botão "Filtros" com painel, tudo na URL, tabela no desktop e cartões no celular, perfil do cliente por apelido.
- Entrada única em sequência (.rise) e contagem animada nos números, respeitando prefers-reduced-motion.

## Colors

Paleta de varejo de beleza contida: um verde de ação sobre neutros quentes, com Musk e Cinza malva como apoio.

### Primary
- **Verde Boticário** (brand): botões, aba ativa, número da manchete, barras de pico, coluna do dia mais cheio, foco, cursor dos campos.
- **Verde profundo** (brand-strong): hover do botão, texto sobre brand-soft (nav ativa, variação positiva).
- **Verde névoa** (brand-soft): fundo da nav ativa, selo de variação positiva, anel do foco nos campos, seleção de texto.

### Secondary
- **Veludo verde** (brand-deep): texto sobre Verde-primavera, tom da sombra, bloco do login.
- **Quartzo** (quartzo): barras fora do pico (45% de opacidade) nas colunas comuns.
- **Cinza malva** (rose) e **Cinza malva clareado** (rose-soft): dia mais fraco (fundo rose-soft, barras rose, pico mauve).
- **Malva** (mauve): texto e barras de pico sobre o dia mais fraco, selo de ocorrência mais fraca e linha tracejada da média de todos os dias (#6E5853 no gráfico, um tom acima do mauve para contraste sobre branco).
- **Musk** (musk): série "recorrentes" no gráfico diário e na lista de ocorrências do dia.
- **Verde névoa de dado** (reforco-resto, #B5CDBF): horas fora da faixa de reforço no gráfico de movimento por hora; só existe em JS (Recharts), ao lado de brand.

### Tertiary
- **Verde-primavera** (primavera): contorno da coluna de hoje, selo "Hoje" e tudo que é "agora": ponto pulsante de "Na loja agora" e selo "Na loja há X" (primavera a 70%, texto brand-deep). Reservado a isso e ao login.
- **Esmeralda** (esmeralda): apenas bloco do login.
- **Vermelho queda** (down / down-soft): variação negativa, erros de campo.

### Neutral
- **Papel** (paper, #F2F2F2): fundo da página, hover de itens, trilho das barras.
- **Cartão** (card): superfícies.
- **Tinta** (ink, ink-2, ink-3): texto principal, secundário, apoio.
- **Linha** (line): divisores e bordas de campo.

### Named Rules
**The One Action Green Rule.** Só #4C765F (e seu hover) indica ação ou destaque de dado. Jade do guia fica fora da interface.

**The Verde-primavera Reserve Rule.** Verde-primavera marca "hoje" e "agora", e nada mais no painel: coluna da semana, selo "Hoje, até agora" na lista do dia, ponto ao vivo e selo "Na loja há X" em Visitas. Nunca para ação, filtro ou dado histórico.

**The Segment Tone Rule.** O segmento do cliente tem tom fixo, do mais frio ao mais quente: Novo em paper, Recorrente em brand-soft, Fiel em brand cheio (o único selo sólido), Sumido em rose-soft/mauve (informação de risco leve, nunca vermelho). Cada selo vem com sua regra em texto ao lado.

**The Weakest Is Mauve Rule.** O dia mais fraco é rosado, nunca vermelho: é informação de escala, não erro. Vermelho (down) é só para queda e erro.

## Typography

**Display Font:** Belleza (com DM Sans, Helvetica). Substituta gratuita da Domaine Sans do guia.
**Body Font:** DM Sans (com Helvetica, Arial).

**Character:** Belleza leve, sem serifa de alto contraste, dá o ar de marca em manchetes e números; DM Sans carrega tudo que se lê.

### Hierarchy
- **Display** (400, 2.25rem em mobile, 3.75rem a partir de sm, 1.1): manchete do período e título do login (2.25rem a 3rem). Títulos de página (Visitas, nome do cliente) usam 2.25rem e 3rem a partir de sm.
- **Display number** (400, 2.25rem, 1): média de cada coluna de dia, tabular.
- **KPI number** (400, 2.4rem, 1, tracking apertado): valores da régua e da faixa ao vivo de Visitas; sufixo em 0,55em na cor ink-3.
- **Title** (600, 1rem): títulos de seção e de cartão.
- **Reading** (400, 1.125rem, 1.625): frases de insight, largura máxima 3xl.
- **Body** (400, 0.875rem): subtítulos, campos, botões (600).
- **Stat number** (400, 1.875rem, 1.25): régua de 4 números do perfil do cliente, tabular.
- **Panel number** (400, 1.875rem, 1.25): janelas de horário no painel de escala ("15h às 19h"), em Belleza sobre brand.
- **Label** (500, 0.75rem): selos, dicas, notas, selo "Hoje" e escala de horas sob as barras (todos em 12px; os antigos 11px e 10px foram corrigidos). Só o texto interno do Recharts (eixos) segue em 11px.

### Named Rules
**The Belleza For Numbers Rule.** Belleza só em manchete, título de página (nome do dia, "Visitas", nome ou apelido do cliente, "Página não encontrada") e números grandes; títulos de seção e interface em DM Sans.

**The Tabular Rule.** Todo número comparável (médias, deltas, escala de horas) usa tabular-nums.

## Layout

Contêiner de 7xl (80rem) com padding de 16px (24px a partir de sm), seções empilhadas com 40px entre blocos. Ordem fixa: manchete, semana, leitura do período, régua de KPIs, série diária + permanência, Últimas visitas. A análise do dia (/semana/[dia]) empilha: voltar, título + abas, seletor de 7 dias, gráfico por hora (2/3) ao lado do painel de escala (1/3) em lg, régua de 4 KPIs (2 colunas, 4 em lg), lista de ocorrências (2/3) e permanência (1/3). O seletor de dias é grade de 7 no celular e linha com quebra a partir de sm. A página Simular usa duas colunas em lg (Gerar movimento e Testar a regra de visita) e, abaixo, o cadastro manual recolhido num `<details>` em cartão (resumo com título e descrição, CaretDown que gira ao abrir). Os atalhos de movimento são cartões de seleção de 12px (aria-pressed): selecionado em fundo brand-soft com borda e anel brand e um check branco em círculo brand no canto; os demais com borda line e hover só em borda quartzo. Escolher um atalho limpa o campo de quantidade e digitar desmarca o atalho; "Gerar" fica desabilitado até haver escolha; o roteiro da regra de visita usa passos com círculo numerado que vira check em brand, fundo brand-soft no passo feito e paper no atual, e o id da visita num selo de 4px para mostrar que os passos 1 e 2 caem na mesma visita.

A manchete usa grade [conteúdo | auto]; em telas pequenas o filtro desce para a esquerda e não estica. A semana é 2 colunas no celular (o domingo ocupa as duas) e 7 colunas em lg, com 12px de vão. A régua de KPIs é 2, 3 e 6 colunas, com divisores verticais só em lg e horizontais abaixo disso; os rótulos têm altura mínima de 40px para alinhar os números. Série diária ocupa 2/3 e permanência 1/3 em lg, com 24px de vão. Visitas empilha: título e frase, período em pílula, botão "Filtros" e etiquetas dos filtros ativos à esquerda, busca à direita, faixa ao vivo (3 células, divisores verticais em sm e horizontais abaixo), tabela de 7 colunas a partir de md (lista de cartões abaixo disso, com duração e total de visitas à direita) e paginação. O perfil do cliente empilha voltar, título com segmento, régua de 4 números (2 colunas, 4 em lg) e o histórico em cartão. O cabeçalho é fixo, 64px, branco a 90% com blur, e rótulos da nav somem em telas pequenas (ficam só ícone, com texto para leitor de tela).

## Elevation & Depth

Híbrido discreto: o fundo é plano em #F2F2F2 e os cartões brancos flutuam por uma sombra difusa tingida de Veludo verde, nunca preta. Não há bordas em cartões; o cabeçalho usa linha de 1px.

### Shadow Vocabulary
- **Cartão** (`0 1px 2px rgb(73 81 65 / 0.05), 0 8px 24px -12px rgb(73 81 65 / 0.16)`): cartões, colunas de dia, régua de KPIs, abas de período.
- **Cartão elevado** (`0 2px 4px rgb(73 81 65 / 0.06), 0 16px 32px -14px rgb(73 81 65 / 0.28)`): só no hover das colunas da semana, junto com subida de 2px.
- **Tooltip do gráfico** (`0 8px 24px -8px rgb(73 81 65 / .28)`): só no Recharts.

### Named Rules
**The Lift On Link Rule.** Cartão que é link sobe 2px (-translate-y-0.5) e troca para a sombra elevada em 300ms, ease-out-expo; no active volta ao lugar. Cartão que não é link não se move.

**The Tinted Shadow Rule.** Toda sombra usa o RGB do Veludo verde (73 81 65). Nunca sombra preta nem deslocada dura.

## Shapes

Três cantos, cada um com função: cartões, colunas e campos em 12px; botões, abas e itens de nav em pílula; selos (variação, "Hoje") em 4px, como os selos de desconto do site. Barras por hora têm topo de 2px. Ícones são Phosphor (SVG), em 18px na nav e 12px nos deltas; 16px no botão de remover. O símbolo "B" multicolorido (app/icon.png 256px e app/apple-icon.png 180px, fornecido pelo usuário, só recortado e redimensionado) é usado apenas como ícone do navegador/app; a interface continua no sistema verde #4C765F.

## Components

### Buttons
- **Shape:** pílula.
- **Primary:** fundo brand, texto branco 600, 14px, padding 10px 20px.
- **Hover / Active:** fundo brand-strong; active reduz a escala para 0,98.
- **Pending:** opacidade 70%, cursor de espera, spinner e rótulo de espera ("pendingLabel").

### Range tabs
Grupo em pílula branca com sombra de cartão e padding de 4px; aba ativa em brand com texto branco; inativas em ink-2 com hover em paper. O grupo tem largura do conteúdo, nunca estica. O período vai na URL (?range=).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** branco; padding 20px (24px a partir de sm).
- **Shadow Strategy:** sombra de cartão. Título 600 16px, subtítulo ink-3 14px.

### Day column (assinatura)
Link (aria-label "<Dia>: ver a análise do dia") para /semana/[dia] mantendo o período. No hover sobe e ganha sombra elevada; um CaretRight de 14px (50% de opacidade, 100% no hover, desliza 2px) aparece em todas menos hoje. Cartão por dia da semana: nome, média em Belleza 36px, "visitas num dia típico", barras por hora (altura 48px, 64px em lg, mínimo 3%), escala de horas sob as barras, "Pico das Xh às Yh" (janela de 1 hora). Mais cheio: fundo brand, texto e barras brancas (pico branco pleno, resto 35%). Mais fraco: fundo rose-soft, rótulo e pico em mauve. Demais: branco, pico brand, resto quartzo a 45%. Hoje: anel de 2px em primavera com offset de 2px, selo "Hoje" em primavera/brand-deep e linha "até agora contra o típico" (verde forte acima, down abaixo, neutro dentro de 5%). Barras decorativas são aria-hidden; o texto leva a informação.

### Day analysis (assinatura)
Página /semana/[dia]: link "Voltar para a semana" (pílula com seta, hover em card), título em Belleza com o dia no plural, abas de período e seletor de dias. Seletor: 7 pílulas (Seg a Dom), ativa em brand com texto branco e aria-current, demais em card com sombra de cartão. Gráfico "Movimento por hora": barras de topo 4px em brand na faixa de reforço e #B5CDBF nas demais horas, linha tracejada (4 4, 2px) mauve para a média de todos os dias, legenda em texto. Painel "Para a escala de <dia>": cartão sólido bg-brand, texto branco, três blocos separados por linha branca a 20% (reforço de equipe, mais vazio, comparação com os outros dias), cada horário em Belleza 30px. Lista "Cada <dia> do período": data tabular, barra empilhada novos (brand) e recorrentes (musk), selos de 4px (Melhor em brand-soft, mais fraco/fraca em rose-soft/mauve, "Hoje, até agora" em primavera/brand-deep). Régua de 4 KPIs com Delta e "vs. outros dias"; cartão de permanência do dia. Regras de cálculo (lib/day.ts): faixa de reforço = horas contíguas em torno do pico com pelo menos 60% dele; janela mais vazia = 2 horas de menor movimento com tráfego, nunca dentro da faixa de reforço.

### Not found
Cartão centralizado (px 24, py 56): círculo de 48px em brand-soft com Compass duotone 24px em brand, título Belleza 30px "Página não encontrada", texto ink-3 e botão primário em pílula "Voltar para o painel". Usado na raiz e dentro do painel.

### Delta
Selo de 4px com seta (Phosphor), valor tabular e texto "subiu/caiu/estável" para leitor de tela. Positivo brand-soft, negativo down-soft, estável paper. Sem base: texto "sem base de comparação".

### Inputs / Fields
- **Style:** rótulo 500 acima, campo branco, borda de 1px em line, 12px, padding 10px 14px.
- **Focus:** borda brand e anel de 3px em brand-soft.
- **Error:** borda down, mensagem de 12px em down abaixo, ligada por aria-describedby; dica em ink-3.

### Navigation
Cabeçalho com logo oficial (SVG de boticario.com.br), divisor e "Painel da loja". Itens em pílula com ícone (Painel com ChartLineUp, Visitas com UsersThree, Clientes com HeartStraight, Simular dados com Flask); Visitas fica ativo em /visitas/*; Painel continua ativo em /semana/*: ativo em brand-soft/brand-strong com ícone preenchido; inativo em ink-2 com hover em paper. Link "Pular para o conteúdo" visível ao foco.

### Últimas visitas (painel)
Último bloco do painel, em largura total, num cartão branco único (como os de cima): no topo, título "Últimas visitas" com o ponto ao vivo em primavera e "N na loja agora" à esquerda e o botão contornado "Ver todas" (borda line, texto brand-strong, hover em borda brand e fundo brand-soft) à direita; abaixo, recuada das bordas com a mesma margem lateral do título (24px; 20px no celular), a mesma tabela da tela Visitas (modo `bare`, sem cartão próprio, faixa cinza dos títulos com cantos de 8px) com as 6 visitas mais recentes, ou cartões no celular. "Ver todas" abre /visitas dos últimos 7 dias.

### Tabela de visitas
Cabeçalho das colunas com fundo paper a 70% e texto ink-3 em 12px; linhas separadas por divisórias suaves (line a 60%), sem borda forte; hover da linha em paper a 60%. A mesma tabela serve à tela Visitas (em cartão próprio) e às Últimas visitas do painel (modo `bare`, dentro do cartão do bloco).

### Escala sugerida (análise do dia)
Cartão branco depois do gráfico por hora: linha do tempo de 40px com cantos de 8px dividida em faixas proporcionais às horas, cada faixa com o número de pessoas e um ícone User (1 pessoa em paper, 2 em brand-soft, 3 em quartzo, 4 ou mais em brand), escala de horas nas pontas; abaixo, a lista das faixas em até 3 colunas com divisórias suaves (horário à esquerda; pessoas em 600 e "até N clientes ao mesmo tempo" em ink-3 à direita) e uma nota de método em 12px.

### Amanhã (painel) e ao vivo
Sob o título da semana, uma linha de texto: "Amanhã, <dia>:" em 600, visitas esperadas e pico, e o link "Ver a escala sugerida" em brand-strong com seta. Painel e Visitas recarregam os dados a cada 30 s com a aba visível e dizem "atualizado às HH:MM". Com 40 pessoas ou mais na loja, um aviso em down-soft/down com UsersThree ("Loja cheia agora: N clientes. Chame reforço para o atendimento.") aparece acima dos números ao vivo e dentro do cartão Últimas visitas.

### Clientes (retenção e reativação)
Página /clientes (item "Clientes", ícone HeartStraight). Cartão "Clientes novos voltam?": três médias em blocos paper/70 de 12px (rótulo 12px ink-3, valor em Belleza 3xl) e a tabela de turmas com a faixa cinza de títulos em cantos de 8px; cada célula de taxa é um bloco de 6px pintado por color-mix de brand com paper, proporcional à maior taxa do mesmo prazo (texto branco acima de 50%); prazo ainda aberto mostra "ainda medindo" em 12px ink-3. Cartão "Clientes para reativar": frase com o total e a regra do consentimento, botão primário "Exportar lista (CSV)" com DownloadSimple, lista com primeiro nome (link para a ficha), apelido em 12px e, à direita, "N dias sem vir" com a última visita em ink-3; paginação numerada. No celular, a tabela de turmas cabe na tela sem rolagem (colunas fixas, 12px, "medindo" em vez de "ainda medindo", médias com rótulo curto) e cada sumido vira duas linhas alinhadas à esquerda: nome e apelido; dias sem vir, data curta e visitas.

### Filter pills e menu de filtros (Visitas)
Só o Período fica à mostra, num grupo de pílulas (`role="group"` com rótulo, pílula branca com sombra de cartão e padding de 4px, como as abas de período, mas feitas de links). Situação, Tipo de cliente e Cadastro ficam no botão "Filtros": pílula com Funnel que vira bg-brand com contador branco quando há filtro ativo, e abre um painel em cartão branco de 12px com sombra elevada; um grupo por filtro, opção ativa em brand-soft com Check, "Limpar filtros" no fim. O painel fecha ao escolher, ao clicar fora e com Esc, e no celular ocupa a largura da tela. Cada filtro ativo aparece ao lado do botão como etiqueta brand-soft removível (X). Tudo é link: o filtro vive na URL, mudar um filtro volta à página 1 e valores padrão não entram na URL.

### Search field
Pílula branca de 256px com borda line, lupa (MagnifyingGlass 16px, ink-3) à esquerda, foco em borda brand e anel de 3px em brand-soft, botão "Buscar" primário ao lado e "Limpar busca" como link discreto. Erro: borda down e mensagem de 12px em down (role="alert", aria-describedby); a lista continua sem a busca inválida. É a única entrada em pílula; formulários seguem os 12px de Inputs / Fields.

### Live strip
Cartão único de 3 células (Na loja agora, Visitas hoje, Permanência típica hoje), rótulo ink-3 e valor em Belleza 2.4rem tabular; no celular, rótulo e valor lado a lado. "Na loja agora" leva ponto de primavera de 10px com anel que pulsa (animate-ping só com motion-safe), aria-hidden: o número já diz tudo.

### Visits table e customer list
Tabela em cartão: cabeçalho de 12px ink-3 com linha line, linhas divididas por line, hover em paper a 60%, caption para leitor de tela. Colunas: Cliente, Entrada, Saída, Duração, Tipo, Visitas, Cadastro; horas tabulares, com o dia em ink-3 quando o período passa de hoje. Cliente é link (nome em brand-strong sublinhado no hover). Saída: "Na loja há X" (selo chip-live) ou "sem saída registrada" em ink-3. Cadastro: CheckCircle preenchido em brand-strong com "Aceitou contato", ou "Sem cadastro" em ink-3. No celular vira lista de cartões com a mesma informação.

### Chips de visita e de segmento
Selos de 4px, 12px 600, padding 2px 6px. Tipo: Novo em paper/ink-2 e Recorrente em brand-soft/brand-strong. Segmento (perfil): Novo, Recorrente, Fiel (brand cheio, texto branco) e Sumido (rose-soft/mauve), sempre seguidos da regra em texto ink-3 ("4 visitas ou mais nos últimos 90 dias"). "Na loja há X": primavera a 70% com texto brand-deep.

### Pagination
Números em círculos de 36px (pílula), janela de 5 em volta da atual; atual em brand com texto branco e aria-current="page", demais em ink-2 com hover em card; carets de 16px para anterior/próxima, apagados (ink-3 a 50%, aria-hidden) nos extremos. À esquerda, "Página X de Y · N visitas" em ink-3.

### Customer profile
Voltar para visitas (pílula com seta), título Belleza com o primeiro nome (só com consentimento) ou "Cliente <APELIDO>", linha com apelido, selo de segmento e a regra, linha de consentimento (CheckCircle em brand, ou "Sem cadastro com consentimento: o nome não aparece."), régua de 4 números em Belleza 1.875rem (Visitas, Permanência típica, Intervalo entre visitas, Primeira visita) e cartão "Histórico de visitas" com lista dividida por line.

### Loading
Cada página envolve seus dados em Suspense com `key` derivado dos parâmetros de busca, para que mudar só um filtro mostre o esqueleto e navegue de fato. Esqueletos (PanelSkeleton, PageSkeleton) são blocos em cartão e barras line com animate-pulse, `role="status"` e aria-label. Não há loading.tsx global.

### Insight reading
Lista ordenada de frases em 18px, separadas por linhas, largura máxima 48rem; sem cartão.

### KPI ruler
Um único cartão dividido em seis células: rótulo, valor em Belleza, delta, dica. Substitui o grid de cartões.

### Charts
Movimento por hora: ver Day analysis. Série diária empilhada (novos em brand, recorrentes em Musk, grade em line, eixo ink-3). Permanência em barras finas de 6px cuja largura é a parcela do total, com percentual e contagem, e a base declarada abaixo. Cores do Recharts ficam duplicadas em JS porque SVG não lê as variáveis do Tailwind.

### Login: foto botânica
Painel esquerdo com uma foto de folhas de monstera com gotas (Bart Zimny, Unsplash License; origem em public/login-monstera.webp.json) em tela cheia, com véu brand a 20% em multiply e degradê de Veludo verde: leve no topo (logo branco) e forte embaixo. A frase de abertura fica direto sobre a foto, no pé do painel e alinhada à esquerda, sem card: um traço curto primavera (48 × 4 px) acima, frase em Belleza branca (4xl, 5xl a partir de sm), subtítulo em DM Sans branco a 85% e uma sombra de texto difusa tingida de Veludo para a leitura sobre as partes claras da folha. O crédito da foto não aparece na tela: fica como comentário no HTML (a Unsplash License não exige crédito visível). A foto assenta de um leve zoom (1,06 → 1) em 2,4 s ao carregar, só com movimento permitido. Formulário à direita.

### Motion
- **.rise:** entrada de 0,7s (ease-out-expo, translateY 10px) escalonada em 60ms por bloco via `--i`; só com prefers-reduced-motion: no-preference e visível por padrão.
- **CountUp:** 900ms, ease-out de quarta potência; começa com o valor final no HTML e não anima em reduced-motion.
- Transições de cor em 200ms em abas e nav.
- Hover das colunas da semana: transform e sombra em 300ms, ease-out-expo.

## Do's and Don'ts

### Do:
- **Do** abrir cada tela com a resposta em frase, antes do gráfico.
- **Do** dizer contra o que cada número é comparado ("até o mesmo horário" do período anterior).
- **Do** usar 12px nos cartões e campos, pílula em botões e abas, 4px nos selos.
- **Do** tingir sombras com Veludo verde (73 81 65).
- **Do** manter a informação em texto quando houver barras decorativas (aria-hidden) e dar rótulo de leitor de tela às setas.
- **Do** declarar a base de cálculo sob gráficos de proporção.
- **Do** usar tabular-nums em números comparáveis.
- **Do** dar à tela de detalhe a resposta prática primeiro ("Para a escala de <dia>") e manter "Painel" ativo na nav em /semana/*.
- **Do** identificar cliente por apelido estável (6 primeiros hex do HMAC do MAC); o primeiro nome só aparece com consentimento de marketing, e o e-mail nunca.
- **Do** pôr filtros em links na URL; deixar à mostra só o filtro mais usado (período) e agrupar os outros num menu, com os ativos como etiquetas removíveis; envolver dados em Suspense com key dos parâmetros.
- **Do** explicar cada segmento de cliente com sua regra em texto.

### Don't:
- **Don't** voltar ao grid de cartões de KPI no topo; indicadores ficam na régua.
- **Don't** usar vermelho para o dia mais fraco; é rosado.
- **Don't** usar Jade nem outro verde como cor de ação; só #4C765F.
- **Don't** criar tema escuro (decisão confirmada: só claro).
- **Don't** redesenhar a ânfora; não há arquivo oficial. O logo é o SVG oficial.
- **Don't** reintroduzir o fundo 3D (ShaderGradient) nem pôr card sobre a foto do login; a frase fica direto sobre a foto, no pé do painel.
- **Don't** mostrar e-mail, MAC ou nome sem consentimento; o cliente aparece por apelido. Fora de Visitas, Clientes e da ficha do cliente, só taxas.
- **Don't** usar primavera para filtro, ação ou histórico; é só "hoje" e "agora".
- **Don't** mover cartões que não são links; o hover de subida é sinal de que o cartão leva a algum lugar.
- **Don't** levar as cores do símbolo "B" do favicon para a interface.

## Open ceiling notes (do acabamento)
- O motivo de blocos de cor lisos aparece só no login; o painel não o repete.
- Na leitura do período em desktop, o lado direito fica vazio (texto limitado a 48rem).
- Não canonizado: o ponto pulsante é exclusivo de "Na loja agora" (não vira animação genérica); valores avulsos (#c9c9c9 no hover de campo e na barra de rolagem, cores hex duplicadas no gráfico, fontes de 11px dentro do Recharts) ficam como acabamento da build, não como tokens.
