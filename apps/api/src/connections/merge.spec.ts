import { mergedEnd, shouldMerge } from './merge';

const t = (hhmm: string) => new Date(`2026-10-10T${hhmm}:00-03:00`);

describe('shouldMerge', () => {
  it('sem visita anterior cria nova', () => {
    expect(shouldMerge(null, t('14:00'))).toBe(false);
  });
  it('reconexão até 30 min após o fim soma à visita', () => {
    expect(
      shouldMerge({ startedAt: t('14:00'), endedAt: t('14:20') }, t('14:50')),
    ).toBe(true);
  });
  it('reconexão depois de 30 min é visita nova', () => {
    expect(
      shouldMerge({ startedAt: t('14:00'), endedAt: t('14:20') }, t('14:51')),
    ).toBe(false);
  });
  it('visita aberta absorve reconexão', () => {
    expect(
      shouldMerge({ startedAt: t('14:00'), endedAt: null }, t('16:00')),
    ).toBe(true);
  });
  it('visita aberta há mais de 12 h não absorve', () => {
    expect(
      shouldMerge(
        { startedAt: new Date('2026-10-10T08:00:00-03:00'), endedAt: null },
        new Date('2026-10-10T20:01:00-03:00'),
      ),
    ).toBe(false);
  });
  it('evento repetido (mesma entrada) soma à visita existente', () => {
    expect(
      shouldMerge({ startedAt: t('14:00'), endedAt: t('14:20') }, t('14:00')),
    ).toBe(true);
  });
});

describe('mergedEnd', () => {
  it('usa a saída mais tardia', () => {
    expect(mergedEnd(t('14:20'), t('14:00'), t('14:10'))).toEqual(t('14:20'));
    expect(mergedEnd(t('14:20'), t('14:30'), t('14:40'))).toEqual(t('14:40'));
  });
  it('reconexão sem saída reabre a visita', () => {
    expect(mergedEnd(t('14:20'), t('14:30'), null)).toBeNull();
  });
  it('evento repetido sem saída não reabre visita já encerrada', () => {
    expect(mergedEnd(t('14:20'), t('14:00'), null)).toEqual(t('14:20'));
  });
  it('visita aberta recebe a saída', () => {
    expect(mergedEnd(null, t('14:00'), t('14:15'))).toEqual(t('14:15'));
  });
});
