/*
 * Regras de negócio compartilhadas: a API as aplica e o painel as mostra nos textos.
 * Só entram aqui valores usados pelos dois lados; constantes de um módulo ficam no próprio módulo.
 */

/** Tamanho do apelido do cliente (começo do HMAC do MAC), em caracteres hexadecimais. */
export const ALIAS_LENGTH = 6;
/** Máximo de visitas por pedido de simulação. */
export const SIMULATE_MAX_VISITS = 200;
/** Janela, em horas, das visitas geradas pelo botão "Gerar movimento". */
export const RECENT_WINDOW_HOURS = 2;
/** Nova conexão até este tempo (minutos) depois da saída continua na mesma visita. */
export const MERGE_GAP_MINUTES = 30;
/** Visita sem saída registrada aceita novas conexões por até este tempo (horas). */
export const MAX_OPEN_VISIT_HOURS = 12;
/** Visita aberta há mais que isto (horas) não conta como "na loja": a saída não foi registrada. */
export const IN_STORE_MAX_HOURS = 4;
/** Cliente com 2+ visitas sem aparecer há mais que isto (dias) é "sumido". */
export const LAPSED_DAYS = 30;
/** Janela (dias) em que se contam as visitas para classificar o cliente como "fiel". */
export const LOYAL_WINDOW_DAYS = 90;
/** Visitas dentro de `LOYAL_WINDOW_DAYS` necessárias para o cliente ser "fiel". */
export const LOYAL_MIN_VISITS = 4;
/** Quantidade mínima de visitas para um cliente poder ser "sumido" (com 1 visita ele é "novo"). */
export const MIN_VISITS_TO_LAPSE = 2;
/** Duração da sessão do painel (token da API e cookie), em segundos: 8 h. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
