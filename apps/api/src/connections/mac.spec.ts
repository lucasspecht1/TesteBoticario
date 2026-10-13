import { hashMac, normalizeMac } from './mac';

describe('mac', () => {
  it('normaliza maiúsculas e hífens', () => {
    expect(normalizeMac('AA-BB-CC-DD-EE-FF')).toBe('aa:bb:cc:dd:ee:ff');
  });

  it('gera o mesmo hash para formatos diferentes do mesmo MAC', () => {
    expect(hashMac('AA-BB-CC-DD-EE-FF', 's')).toBe(
      hashMac('aa:bb:cc:dd:ee:ff', 's'),
    );
  });

  it('depende do segredo e não contém o MAC', () => {
    const hash = hashMac('aa:bb:cc:dd:ee:ff', 'segredo-1');
    expect(hash).not.toBe(hashMac('aa:bb:cc:dd:ee:ff', 'segredo-2'));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
