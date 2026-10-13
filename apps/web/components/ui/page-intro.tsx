/** Título da página e uma frase de apoio, no topo das telas de lista. */
export function PageIntro({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="rise max-w-2xl">
      <h1 className="font-display text-4xl leading-tight text-balance text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-3">{children}</p>
    </div>
  );
}
