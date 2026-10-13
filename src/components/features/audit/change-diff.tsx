/** Compact before → after view of the fields an audit log row touched. */
export function ChangeDiff({ oldValues, newValues }: { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }) {
  const keys = Array.from(new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})])).filter((k) => k !== "id");
  if (keys.length === 0) return <span className="text-muted-foreground">—</span>;
  const show = (v: unknown) => (v === null || v === undefined ? "∅" : typeof v === "object" ? JSON.stringify(v) : String(v));

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-xs">
      {keys.map((k) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="break-all">
            {oldValues && k in oldValues && <span className="text-destructive line-through">{show(oldValues[k])}</span>}
            {oldValues && k in oldValues && newValues && k in newValues && " → "}
            {newValues && k in newValues && <span className="text-success">{show(newValues[k])}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
