import { useState } from 'react'

// 1~5점 별점 선택 컴포넌트
export default function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div className="stars" role="radiogroup" aria-label="별점 주기" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}점`}
          className={n <= shown ? 'star on' : 'star'}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          disabled={disabled}
        >
          ★
        </button>
      ))}
    </div>
  )
}
