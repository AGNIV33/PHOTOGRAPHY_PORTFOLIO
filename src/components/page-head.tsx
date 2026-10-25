type Props = {
  index: string;
  title: string;
  intro?: string;
};

export function PageHead({ index, title, intro }: Props) {
  return (
    <header className="page-head">
      <span className="frame-no">{index}</span>
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
    </header>
  );
}

// Shown on pages whose content is added from the admin dashboard in a later phase.
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-3 border border-dashed border-[var(--hairline)] p-8 md:p-12 max-w-2xl">
      <span className="label">Nothing here yet</span>
      <p className="text-[22px] font-semibold">{title}</p>
      <p className="text-[var(--ink-2)]">{body}</p>
    </div>
  );
}
