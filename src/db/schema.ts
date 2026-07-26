import { date, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Values are listed in the order Postgres actually stores them so `db:push`
 * sees no drift. `not_yet` is the neutral default — a fresh row has not
 * scheduled its 3rd round, so it must start as "—" rather than "Scheduled".
 */
export const cellState = pgEnum("cell_state", [
  "not_yet",
  "passed",
  "failed",
  "scheduled",
  "waiting_feedback",
]);

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  ticket: text("ticket").notNull(),
  company: text("company").notNull().default(""),
  position: text("position").notNull().default(""),

  round1: cellState("round_1").notNull().default("not_yet"),
  round2: cellState("round_2").notNull().default("not_yet"),
  round3: cellState("round_3").notNull().default("not_yet"),
  finalRound: cellState("final_round").notNull().default("not_yet"),
  offer: cellState("offer").notNull().default("not_yet"),

  // Nullable: a round can have a status before a date is known, and vice versa.
  round1Date: date("round_1_date"),
  round2Date: date("round_2_date"),
  round3Date: date("round_3_date"),
  finalRoundDate: date("final_round_date"),
  offerDate: date("offer_date"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Interview = typeof interviews.$inferSelect;
