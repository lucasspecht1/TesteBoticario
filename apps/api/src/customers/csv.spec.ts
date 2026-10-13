import { toCsv } from './csv';

describe('toCsv', () => {
  it('cabeçalho, separador ; e aspas quando precisa', () => {
    expect(
      toCsv(
        ['nome', 'obs'],
        [
          ['Ana', 'a;b'],
          ['Bia "B"', 'ok'],
        ],
      ),
    ).toBe('nome;obs\r\nAna;"a;b"\r\n"Bia ""B""";ok\r\n');
  });

  it('neutraliza fórmula de planilha (injeção de CSV)', () => {
    expect(toCsv(['x'], [['=1+1'], ['@cmd'], ['+5'], ['-2']])).toBe(
      "x\r\n'=1+1\r\n'@cmd\r\n'+5\r\n'-2\r\n",
    );
  });
});
