import { NotFoundView } from '@/components/ui/not-found-view';

/** Página 404 geral, fora do painel. */
export default function NotFound(): React.JSX.Element {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4">
      <NotFoundView />
    </main>
  );
}
