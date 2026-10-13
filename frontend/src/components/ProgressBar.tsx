interface ProgressBarProps {
  percentage: number
  label: string
}

export function ProgressBar({
  percentage,
  label,
}: ProgressBarProps) {
  const safePercentage = Math.max(
    0,
    Math.min(100, percentage),
  )

  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safePercentage}
    >
      <div
        className="progress-bar__fill"
        style={{ width: `${safePercentage}%` }}
      />
    </div>
  )
}