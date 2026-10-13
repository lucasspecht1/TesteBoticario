# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dono (ou gerente) de uma loja O Boticário. Usa o painel tanto no computador, para analisar com calma, quanto no celular, para uma olhada rápida entre atendimentos. Não é analista de dados: quer respostas diretas para decidir escala de equipe, ações e campanhas.

## Product Purpose

Painel que transforma os acessos ao Wi-Fi de visitantes em visibilidade do fluxo da loja: quando a loja enche, se o movimento cresce, se o cliente volta, quanto tempo fica e quantos aceitaram comunicações (LGPD). Feito como teste técnico full-stack para o Grupo Boticário; sucesso é a banca entender o problema, confiar nos números e ver acabamento profissional.

## Positioning

O Wi-Fi como sensor de fluxo da loja: cada aparelho conectado é um cliente presente. As métricas vêm com comparação justa ("até o mesmo horário" do período anterior) e insights em texto com a ação sugerida.

## Operating Context

- Login do dono (conta demo `dono@loja.demo`), sessão de 8 h.
- Painel com filtro de período 7, 30 ou 90 dias (na URL).
- Análise de cada dia da semana (`/semana/<dia>`), tela Visitas (cada visita, ao vivo, com ficha do cliente) e tela Clientes (retenção por turma e reativação com CSV).
- Tela "Simular dados" para gerar movimento de teste e registrar uma conexão manualmente, porque não há integração real com a controladora Wi-Fi.
- Todas as agregações no fuso da loja (America/Sao_Paulo).

## Capabilities and Constraints

- Next.js 15 App Router + React 19 + Tailwind 4 + Recharts; toda leitura e escrita passa pela API Nest.
- Indicadores: visitantes únicos, visitas, % que voltaram, % de novos que voltaram, permanência mediana, % opt-in; cada um com variação vs. período anterior (% ou p.p.).
- Semana típica (sete colunas com barras por hora), série diária novos × recorrentes, distribuição de permanência por faixa, insights por regras.
- Estados obrigatórios: carregando, vazio (com caminho para gerar dados), erro (tentar de novo), sessão expirada, erros por campo nos formulários.
- Dados pessoais: o painel mostra clientes por apelido estável; primeiro nome só com consentimento; e-mail nunca na tela. Exceção deliberada: o CSV de reativação (tela Clientes) traz nome e e-mail só de quem aceitou receber comunicações, para essa finalidade.
- Tema: só claro (decisão do Lucas).

## Brand Commitments

- Identidade O Boticário, confirmada pelo Lucas como o padrão de estilo. Logo oficial (SVG do site boticario.com.br) no topo e no login.
- Evidência coletada do site oficial: texto DM Sans; display serifado Domaine (licenciado, usar substituto próximo); verde da marca `#4C765F` (selos, botões), verdes `#499D71`, `#007A54`, `#00857E`; texto `#212121`; fundo `#F2F2F2`; rosado `#D0C4C5`; cartões com canto 12px, busca em pílula 24px, selos 4px.
- Brand guidelines oBoticário (Behance, 2020, páginas 96-132 de manual interno), aplicado ao painel: verdes principais Jade `#007E78`, Quartzo `#6FA286`, Esmeralda `#009F67`, Verde-primavera `#93DA49`; neutros Cinza malva `#D0C4C5`, Musk `#B6A19B`, Veludo verde `#495141`; display Domaine Sans (substituta gratuita: Belleza), Arial como fonte de sistema; ânfora como ícone (sem arquivo oficial, não redesenhar); composição de blocos de cor lisos sobrepostos. Onde diverge do site atual (logo), vale o site.
- Verde principal da interface: `#4C765F` (site atual), preferido pelo Lucas ao Jade do guia. Jade fica fora da interface.
- Login: foto botânica real (monstera de Bart Zimny, Unsplash License, escolhida pelo Lucas) com véu verde e a frase direto sobre a foto (o card verde no meio da imagem foi descartado pelo Lucas). O fundo 3D ShaderGradient foi descartado antes.

## Evidence on Hand

- Dados são simulados (gerador da API); não inventar números fora do que a API devolve.
- Credenciais demo e README em `../README.md`.

## Product Principles

1. A resposta vem antes do gráfico: cada bloco responde uma pergunta do dono.
2. Comparação honesta: sempre dizer contra o que o número está sendo comparado.
3. Premium pela precisão, não pelo enfeite: a marca vive nos detalhes.
4. Funciona igual no celular e no computador.

## Accessibility & Inclusion

WCAG AA de contraste, navegação por teclado, tabelas reais nos dados tabulares, respeito a prefers-reduced-motion.
