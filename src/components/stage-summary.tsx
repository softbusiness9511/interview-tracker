import { Gauge } from "@/components/gauge";
import type { StageStat } from "@/lib/pipeline";

export function StageSummary({ stats }: { stats: StageStat[] }) {
  return (
    <section
      aria-label="Pass rate by stage"
      className="bg-card rounded-xl border p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-muted-foreground mb-6 font-mono text-[11px] font-medium tracking-[0.14em] uppercase">
        Pass rate by stage
      </h2>

      <div className="grid grid-cols-2 justify-items-center gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0">
        {stats.map((stat) => (
          <div key={stat.key} className="flex flex-col items-center gap-3">
            <span className="text-muted-foreground text-[13px]">
              {stat.label}
            </span>

            {/* The percentage is printed inside the ring, so the ring itself
                never has to carry the value on colour alone. */}
            <Gauge rate={stat.rate} />

            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {stat.passed}/{stat.total}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
