export function Insights({ items }: { items: string[] }) {
  return (
    <section aria-labelledby="insights" className="rounded-xl border border-teal-200 bg-teal-50 p-4">
      <h2 id="insights" className="mb-2 font-semibold text-teal-900">O que os dados dizem</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-teal-950">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  );
}
