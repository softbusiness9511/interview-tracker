import type { Interview } from "@/db/schema";

export const CELL_STATES = ["not_yet", "passed", "rejected"] as const;
export type CellState = (typeof CELL_STATES)[number];

export const CELL_LABEL: Record<CellState, string> = {
  not_yet: "Not yet",
  passed: "Passed",
  rejected: "Rejected",
};

/** Clicking a cell walks this loop, so one control covers all three states. */
export function nextState(current: CellState): CellState {
  const order: CellState[] = ["not_yet", "passed", "rejected"];
  return order[(order.indexOf(current) + 1) % order.length];
}

export const ROUND_KEYS = ["round1", "round2", "round3", "finalRound"] as const;
export type RoundKey = (typeof ROUND_KEYS)[number];

export const CELL_KEYS = [...ROUND_KEYS, "offer"] as const;
export type CellKey = (typeof CELL_KEYS)[number];

/** Table column headings — kept terse because the column is narrow. */
export const CELL_HEADING: Record<CellKey, string> = {
  round1: "1st round",
  round2: "2nd round",
  round3: "3rd round",
  finalRound: "Final",
  offer: "Offer",
};

/** Summary-tile labels, which have room to spell the stage out. */
export const STAT_LABEL: Record<CellKey, string> = {
  round1: "1st round",
  round2: "2nd round",
  round3: "3rd round",
  finalRound: "Final round",
  offer: "Offer rate",
};

export type StageStat = {
  key: CellKey;
  label: string;
  passed: number;
  total: number;
  /** null when nothing counts yet, so the tile reads "—" instead of a fake 0%. */
  rate: number | null;
};

/**
 * Rounds are scored on decided cells only — an untouched round shouldn't drag a
 * pass rate down. The offer rate is deliberately different: its denominator is
 * every company tracked, since a company that never made an offer still counts
 * against the search.
 */
export function stageStats(rows: Interview[]): StageStat[] {
  const roundStats = ROUND_KEYS.map((key) => {
    const passed = rows.filter((row) => row[key] === "passed").length;
    const rejected = rows.filter((row) => row[key] === "rejected").length;
    const total = passed + rejected;
    return {
      key,
      label: STAT_LABEL[key],
      passed,
      total,
      rate: total === 0 ? null : passed / total,
    };
  });

  const offers = rows.filter((row) => row.offer === "passed").length;

  return [
    ...roundStats,
    {
      key: "offer" as CellKey,
      label: STAT_LABEL.offer,
      passed: offers,
      total: rows.length,
      rate: rows.length === 0 ? null : offers / rows.length,
    },
  ];
}

export function formatRate(rate: number | null) {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}
