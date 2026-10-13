import { Notice } from '@/components/ui/notice';
import type { FormState } from './actions';

/** Mensagem de sucesso ou erro do último envio do formulário; nada antes do primeiro envio. */
export function FormFeedback({ state }: { state: FormState }): React.JSX.Element | null {
  if (state.successMessage) return <Notice kind="success">{state.successMessage}</Notice>;
  if (state.error) return <Notice kind="error">{state.error}</Notice>;
  return null;
}
