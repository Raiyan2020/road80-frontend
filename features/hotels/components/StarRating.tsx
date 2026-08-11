import React from "react";

interface StarRatingProps {
  /** 0-5; fractional values render a partially filled star. */
  value: number;
  /** Pixel size of each star. */
  size?: number;
  /** When set, the stars become an interactive radiogroup. */
  onChange?: (stars: number) => void;
  label?: string;
  className?: string;
}

// `key` is declared explicitly: without @types/react installed, TS does not
// treat it as a reserved JSX prop and rejects it on the call site.
const Star = ({
  fill,
  size,
}: {
  fill: number;
  size: number;
  key?: number | string;
}) => {
  // Unique id per instance so multiple gradients on one page don't collide.
  const id = React.useId();
  const pct = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        {/* Stars are laid out RTL-agnostically: the gradient always fills from
            the star's own leading edge, so it reads correctly in both dirs. */}
        <linearGradient id={id}>
          <stop offset={`${pct}%`} stopColor="#f5b301" />
          <stop offset={`${pct}%`} stopColor="transparent" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.05 1.11-6.47-4.7-4.58 6.5-.95z"
        fill={`url(#${id})`}
        stroke="#f5b301"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Star display and picker used across the hotel surfaces (use cases 1.4, 5.2).
 *
 * Read-only mode renders an accessible `img` with a text label rather than five
 * meaningless graphics; the interactive mode is a real radiogroup so it can be
 * driven from the keyboard.
 */
export function StarRating({
  value,
  size = 18,
  onChange,
  label,
  className = "",
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  if (!onChange) {
    return (
      <span
        role="img"
        aria-label={label ?? `${value} / 5`}
        className={`inline-flex items-center gap-0.5 ${className}`}
      >
        {stars.map((n) => (
          <Star key={n} fill={value - n + 1} size={size} />
        ))}
      </span>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={String(n)}
          onClick={() => onChange(n)}
          className="rounded-full p-1 transition-transform active:scale-90"
        >
          <Star fill={value >= n ? 1 : 0} size={size + 8} />
        </button>
      ))}
    </div>
  );
}
