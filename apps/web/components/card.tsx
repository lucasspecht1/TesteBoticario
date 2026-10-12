export function Card({ title, subtitle, className = '', children }: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="mb-3 text-sm text-zinc-600">{subtitle}</p>}
      {children}
    </section>
  );
}
