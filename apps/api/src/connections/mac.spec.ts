import { hashMac, normalizeMac } from './mac';

describe('mac', () => {
  it('normaliza maiúsculas e hífens', () => {
    expect(normalizeMac('AA-BB-CC-DD-EE-FF')).toBe('aa:bb:cc:dd:ee:ff');
  });

  it('gera o mesmo hash para formatos diferentes do mesmo MAC', () => {
    expect(hashMac('AA-BB-CC-DD-EE-FF', 's')).toBe(hashMac('aa:bb:cc:dd:ee:ff', 's'));
  });

  it('depende do segredo e não contém o MAC', () => {
    const h = hashMac('aa:bb:cc:dd:ee:ff', 'segredo-1');
    expect(h).not.toBe(hashMac('aa:bb:cc:dd:ee:ff', 'segredo-2'));
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});
