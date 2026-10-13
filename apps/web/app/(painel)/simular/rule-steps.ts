import { MERGE_GAP_MINUTES } from '@wifi/shared';
import { MINUTES_PER_HOUR } from '@/lib/units';

// Roteiro da regra de visita: três conexões do mesmo aparelho, em minutos a partir do início do teste.
const FIRST_STAY_MINUTES = 20;
const RECONNECT_GAP_MINUTES = 10; // menor que MERGE_GAP_MINUTES: soma à mesma visita
const RECONNECT_STAY_MINUTES = 20;
const RETURN_GAP_MINUTES = 120; // maior que MERGE_GAP_MINUTES: visita nova
const RETURN_STAY_MINUTES = 5;

const RECONNECT_START = FIRST_STAY_MINUTES + RECONNECT_GAP_MINUTES;
const RECONNECT_END = RECONNECT_START + RECONNECT_STAY_MINUTES;
const RETURN_START = RECONNECT_END + RETURN_GAP_MINUTES;

/** O teste começa 3 h atrás, para o último passo não cair no futuro. */
export const RULE_TEST_OFFSET_HOURS = 3;

/** Número de um passo do roteiro (1, 2 ou 3). */
export type RuleStepNumber = 1 | 2 | 3;

/** Um passo do roteiro: textos da tela e os minutos de entrada e saída da conexão. */
export type RuleStep = {
  title: string;
  detail: string;
  expect: string;
  enterMinutes: number;
  exitMinutes: number;
};

/** Os três passos, em ordem: conecta, reconecta dentro da janela e volta depois dela. */
export const RULE_STEPS: readonly RuleStep[] = [
  {
    title: 'Cliente conecta',
    detail: `Entra na loja e fica ${FIRST_STAY_MINUTES} minutos.`,
    expect: 'Vira uma visita nova.',
    enterMinutes: 0,
    exitMinutes: FIRST_STAY_MINUTES,
  },
  {
    title: `Reconecta ${RECONNECT_GAP_MINUTES} min depois`,
    detail: 'O celular caiu do Wi-Fi e voltou.',
    expect: `Soma à mesma visita: reconexão em até ${MERGE_GAP_MINUTES} min.`,
    enterMinutes: RECONNECT_START,
    exitMinutes: RECONNECT_END,
  },
  {
    title: `Volta ${RETURN_GAP_MINUTES / MINUTES_PER_HOUR} horas depois`,
    detail: 'Saiu e voltou mais tarde.',
    expect: `Vira outra visita: passou de ${MERGE_GAP_MINUTES} min.`,
    enterMinutes: RETURN_START,
    exitMinutes: RETURN_START + RETURN_STAY_MINUTES,
  },
];
