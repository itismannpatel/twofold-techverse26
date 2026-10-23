import { useId } from 'react'

interface MatchRingProps {
  score: number
  size?: number
  stroke?: number
  caption?: string
}

/** Circular progress dial used wherever a match score is shown. */
export function MatchRing({ score, size = 54, stroke = 3.5, caption = 'match' }: MatchRingProps) {
  const gradientId = useId()
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference * (1 - clamped / 100)

  const [from, to] = clamped >= 75 ? ['#ffa268', '#f2653f'] : clamped >= 50 ? ['#f7d08a', '#d9a54a'] : ['#8a8399', '#5c5668']

  return (
    <div className="match-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="match-ring-label">
        <span className="match-ring-score">{Math.round(clamped)}</span>
        <span className="match-ring-caption">{caption}</span>
      </div>
    </div>
  )
}
