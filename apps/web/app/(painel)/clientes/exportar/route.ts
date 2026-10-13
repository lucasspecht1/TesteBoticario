import { api } from '@/lib/api';

/** Cabeçalhos da resposta da API repassados ao navegador. */
const FORWARDED_HEADERS = ['content-type', 'content-disposition', 'cache-control'];

/** Baixa o CSV de clientes para reativar. O token fica no servidor; o navegador só recebe o arquivo. */
export async function GET(): Promise<Response> {
  const response = await api.lapsedCsv();
  if (!response.ok)
    return new Response('Não foi possível gerar o arquivo. Tente de novo.', {
      status: response.status,
    });
  // a API é a dona do tipo, do nome do arquivo e do cache; o painel só repassa
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { headers });
}
