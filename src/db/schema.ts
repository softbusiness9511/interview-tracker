import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** Every round cell is one of three states, cycled by clicking it. */
export const cellState = pgEnum("cell_state", [
  "not_yet",
  "passed",
  "rejected",
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Interview = typeof interviews.$inferSelect;
