/*
  ProgressBar: shows progress through the questionnaire, e.g. <ProgressBar current={3} total={10} label="Question 3 of 10" />
*/
export default function ProgressBar({ current, total, label }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;
  return (
    <div className="w-full">
      {label && <p className="mb-2 text-sm font-medium text-ss-muted">{label}</p>}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-ss-blue-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-ss-blue transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
