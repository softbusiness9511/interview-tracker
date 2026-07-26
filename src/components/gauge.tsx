import { formatRate } from "@/lib/pipeline";

const TICKS = 64;
const R_OUTER = 47;
const R_INNER = 38.5;
const TICK_WIDTH = 1.9;

/** Precomputed tick endpoints — the geometry never changes, only which are lit. */
const TICK_GEOMETRY = Array.from({ length: TICKS }, (_, i) => {
  // Start at 12 o'clock and run clockwise, like the reference gauge.
  const radians = ((-90 + i * (360 / TICKS)) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x1: 50 + R_INNER * cos,
    y1: 50 + R_INNER * sin,
    x2: 50 + R_OUTER * cos,
    y2: 50 + R_OUTER * sin,
  };
});

export function Gauge({
  rate,
  size = 128,
}: {
  rate: number | null;
  size?: number;
}) {
  // Any non-zero rate lights at least one tick, so a low-but-real rate never
  // renders as an empty ring.
  const lit =
    rate === null || rate <= 0
      ? 0
      : Math.max(1, Math.min(TICKS, Math.round(rate * TICKS)));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        {TICK_GEOMETRY.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            strokeWidth={TICK_WIDTH}
            stroke={i < lit ? "var(--gauge-fill)" : "var(--gauge-track)"}
          />
        ))}
      </svg>

      {/* Raised inner disc, matching the reference's bevelled centre. */}
      <div className="bg-card absolute inset-[22%] rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.10)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.55)]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-semibold tracking-tight"
          style={{
            color: "var(--gauge-value)",
            fontSize: size * 0.235,
            lineHeight: 1,
          }}
        >
          {formatRate(rate)}
        </span>
      </div>
    </div>
  );
}
