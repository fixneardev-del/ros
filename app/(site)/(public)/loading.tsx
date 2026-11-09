export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 lg:px-12"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading page</span>
      <div className="h-3 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-10 w-2/3 max-w-xl rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full max-w-2xl rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="h-40 rounded-surface bg-slate-200" />
        <div className="h-40 rounded-surface bg-slate-200" />
        <div className="h-40 rounded-surface bg-slate-200" />
      </div>
    </div>
  );
}
