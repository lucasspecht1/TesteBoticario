import { computeRetention } from './retention';

const SP = 'America/Sao_Paulo';
// terça-feira, 13/10/2026, 12h em São Paulo
const now = new Date('2026-10-13T12:00:00-03:00');
const at = (s: string) => new Date(`${s}-03:00`);

describe('computeRetention', () => {
  const devices = [
    // turma da semana de 31/08 (segunda): 2 clientes novos
    {
      firstSeenAt: at('2026-09-01T10:00:00'),
      visits: [at('2026-09-01T10:00:00'), at('2026-09-05T15:00:00')],
    }, // voltou em 4 dias
    {
      firstSeenAt: at('2026-09-02T10:00:00'),
      visits: [at('2026-09-02T10:00:00'), at('2026-10-20T10:00:00')],
    }, // só volta depois de 60 dias (futuro, ignorado)
    // turma de 07/09: 1 cliente que volta em 20 dias
    {
      firstSeenAt: at('2026-09-08T10:00:00'),
      visits: [
        at('2026-09-08T10:00:00'),
        at('2026-09-08T18:00:00'),
        at('2026-09-28T10:00:00'),
      ],
    },
    // turma de 12/10 (semana atual): 1 cliente, ainda medindo
    {
      firstSeenAt: at('2026-10-12T10:00:00'),
      visits: [at('2026-10-12T10:00:00')],
    },
  ];
  const retention = computeRetention(devices, { now, weeks: 7, timeZone: SP });

  it('uma linha por semana, da mais recente para a mais antiga', () => {
    expect(retention.cohorts.map((cohort) => cohort.weekStart)).toEqual([
      '2026-10-12',
      '2026-10-05',
      '2026-09-28',
      '2026-09-21',
      '2026-09-14',
      '2026-09-07',
      '2026-08-31',
    ]);
  });

  it('volta em outro dia dentro de 7, 30 e 60 dias; mesmo dia não conta', () => {
    const aug31 = retention.cohorts.find(
      (cohort) => cohort.weekStart === '2026-08-31',
    )!;
    expect(aug31).toEqual({
      weekStart: '2026-08-31',
      newCustomers: 2,
      d7: 50,
      d30: 50,
      d60: null,
    });
    const sep7 = retention.cohorts.find(
      (cohort) => cohort.weekStart === '2026-09-07',
    )!;
    expect(sep7).toMatchObject({ newCustomers: 1, d7: 0, d30: 100 });
  });

  it('prazo que a turma ainda não completou fica nulo', () => {
    expect(retention.cohorts[0]).toEqual({
      weekStart: '2026-10-12',
      newCustomers: 1,
      d7: null,
      d30: null,
      d60: null,
    });
  });

  it('semana sem clientes novos: zero clientes e taxas nulas', () => {
    expect(
      retention.cohorts.find((cohort) => cohort.weekStart === '2026-09-21'),
    ).toEqual({
      weekStart: '2026-09-21',
      newCustomers: 0,
      d7: null,
      d30: null,
      d60: null,
    });
  });

  it('média ponderada pelas turmas que já completaram cada prazo', () => {
    // 7 dias: 31/08 (1 de 2) e 07/09 (0 de 1) → 1 de 3
    expect(retention.avg.d7).toBe(33.3);
    // 30 dias: 31/08 (1 de 2) e 07/09 (1 de 1) → 2 de 3
    expect(retention.avg.d30).toBe(66.7);
    expect(retention.avg.d60).toBeNull();
  });
});
