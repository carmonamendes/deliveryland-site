export function Spinner({ small }: { small?: boolean }) {
  return <span className={small ? 'spin sm' : 'spin'} aria-label="carregando" />;
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="center">
      <Spinner />
      <div style={{ marginTop: 10 }}>{label}</div>
    </div>
  );
}
