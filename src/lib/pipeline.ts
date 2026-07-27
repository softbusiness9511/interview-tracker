import type { Interview } from "@/db/schema";

export const CELL_STATES = [
  "not_yet",
  "scheduled",
  "waiting_feedback",
  "passed",
  "failed",
] as const;
export type CellState = (typeof CELL_STATES)[number];

/** Dropdown order, deliberately the lifecycle order rather than the DB order. */
export const CELL_LABEL: Record<CellState, string> = {
  not_yet: "—",
  scheduled: "Scheduled",
  waiting_feedback: "Waiting Feedback",
  passed: "Passed",
  failed: "Failed",
};

/**
 * Statuses that mean the interview actually happened. Waiting Feedback counts:
 * the round was sat, the answer just hasn't arrived. Scheduled and "—" don't,
 * because nothing has been sat yet.
 */
const SAT: CellState[] = ["passed", "failed", "waiting_feedback"];
export const wasSat = (state: CellState) => SAT.includes(state);

export const ROUND_KEYS = [
  "round1",
  "round2",
  "round3",
  "finalRound",
] as const;

export const CELL_KEYS = [...ROUND_KEYS, "offer"] as const;
export type CellKey = (typeof CELL_KEYS)[number];

/** Matching date column for each status column. */
export const DATE_KEY = {
  round1: "round1Date",
  round2: "round2Date",
  round3: "round3Date",
  finalRound: "finalRoundDate",
  offer: "offerDate",
} as const satisfies Record<CellKey, keyof Interview>;
export type DateKey = (typeof DATE_KEY)[CellKey];

export const DATE_KEYS = Object.values(DATE_KEY) as readonly DateKey[];

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
 * Rounds are scored on interviews actually sat: `passed / (passed + failed +
 * waiting_feedback)`. An interview you've sat but not heard back on counts
 * against the rate until the answer lands — so the number reads as "of the
 * rounds I've sat, how many have I passed so far" and will tick up when a
 * pending one resolves to Passed. Scheduled and "—" are excluded; nothing has
 * happened yet. The offer rate is deliberately different: its denominator is
 * every company tracked, since a company that never made an offer still counts
 * against the search.
 */
export function stageStats(rows: Interview[]): StageStat[] {
  const roundStats = ROUND_KEYS.map((key) => {
    const passed = rows.filter((row) => row[key] === "passed").length;
    const total = rows.filter((row) => wasSat(row[key] as CellState)).length;
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
