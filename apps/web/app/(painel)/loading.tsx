export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-busy="true" aria-label="Carregando painel">
      <div className="h-8 w-64 rounded bg-zinc-200" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-32 rounded-xl bg-zinc-200" />)}
      </div>
      <div className="h-24 rounded-xl bg-zinc-200" />
      <div className="h-80 rounded-xl bg-zinc-200" />
    </div>
  );
}
