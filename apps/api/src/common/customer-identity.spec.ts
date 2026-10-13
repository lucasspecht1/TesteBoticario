import { getFirstName, toAlias } from './customer-identity';

describe('cliente pseudonimizado', () => {
  it('apelido estável a partir do hash do MAC', () => {
    expect(toAlias('32632f80f8a7')).toBe('32632F');
  });

  it('primeiro nome só com consentimento; nunca o nome completo', () => {
    expect(getFirstName('Ana Paula Souza', true)).toBe('Ana');
    expect(getFirstName('Ana Paula Souza', false)).toBeNull();
    expect(getFirstName(null, true)).toBeNull();
  });
});
