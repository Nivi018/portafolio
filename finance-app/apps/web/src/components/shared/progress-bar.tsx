type ProgressBarProps = {
  label: string
  value: number
  tone?: 'accent' | 'danger'
}

export function ProgressBar({ label, value, tone = 'accent' }: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100)

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampedValue)}
      aria-valuetext={`${value.toFixed(0)}%`}
      className="h-2.5 overflow-hidden rounded-full bg-white/8"
    >
      <div
        className={tone === 'danger' ? 'h-full rounded-full bg-[#ff8374]' : 'h-full rounded-full bg-[var(--accent)]'}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}
