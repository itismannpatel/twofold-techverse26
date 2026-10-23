import { StarIcon } from './icons'

interface RatingStarsProps {
  value: number
  count?: number
  size?: number
  showValue?: boolean
  showCount?: boolean
}

/** Five stars with a fractional fill layer, plus the numeric score. */
export function RatingStars({
  value,
  count = 0,
  size = 13,
  showValue = true,
  showCount = true,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, value))
  const percent = (clamped / 5) * 100

  return (
    <span className="rating">
      <span className="rating-stars" role="img" aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
        <span className="stars-empty">
          {[0, 1, 2, 3, 4].map((i) => (
            <StarIcon key={i} size={size} filled />
          ))}
        </span>
        <span className="stars-fill" style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <StarIcon key={i} size={size} filled />
          ))}
        </span>
      </span>
      {showValue &&
        (count > 0 ? (
          <>
            <span className="rating-value">{clamped.toFixed(1)}</span>
            {showCount && <span className="rating-count">({count})</span>}
          </>
        ) : (
          <span className="rating-count">No reviews yet</span>
        ))}
    </span>
  )
}

interface StarPickerProps {
  value: number
  onChange: (value: number) => void
  size?: number
}

export function StarPicker({ value, onChange, size = 30 }: StarPickerProps) {
  return (
    <div className="star-picker" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={star <= value ? 'is-on' : ''}
          onClick={() => onChange(star)}
        >
          <StarIcon size={size} filled={star <= value} />
        </button>
      ))}
    </div>
  )
}
