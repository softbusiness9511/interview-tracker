"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import { LogOut, Plus, X } from "lucide-react";
import type { Interview } from "@/db/schema";
import {
  CELL_HEADING,
  CELL_KEYS,
  CELL_LABEL,
  nextState,
  stageStats,
  type CellKey,
  type CellState,
} from "@/lib/pipeline";
import {
  addInterview,
  deleteInterview,
  logout,
  setCell,
  setText,
} from "@/app/actions";
import { StageSummary } from "@/components/stage-summary";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CELL_TONE: Record<CellState, string> = {
  passed: "bg-pass-bg text-pass-fg",
  rejected: "bg-reject-bg text-reject-fg",
  not_yet: "bg-idle-bg text-idle-fg",
};

function CellButton({
  state,
  label,
  onCycle,
}: {
  state: CellState;
  label: string;
  onCycle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCycle}
      // The written state is the label itself, so the pill never relies on color.
      aria-label={`${label}: ${CELL_LABEL[state]}. Click to change.`}
      className={cn(
        "focus-visible:ring-ring w-full max-w-[104px] cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none",
        CELL_TONE[state],
      )}
    >
      {CELL_LABEL[state]}
    </button>
  );
}

function TextCell({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accept server truth only while the field is idle, so a slow round-trip
  // can't overwrite what is being typed right now.
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  function schedule(next: string) {
    setDraft(next);
    clearTimeout(timer.current ?? undefined);
    timer.current = setTimeout(() => onCommit(next), 700);
  }

  return (
    <input
      value={draft}
      placeholder={placeholder}
      onFocus={() => (focused.current = true)}
      onChange={(event) => schedule(event.target.value)}
      onBlur={() => {
        focused.current = false;
        clearTimeout(timer.current ?? undefined);
        if (draft !== value) onCommit(draft);
      }}
      className="focus-visible:ring-ring placeholder:text-muted-foreground/60 w-full rounded-md bg-transparent px-2 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
    />
  );
}

type Patch =
  | { type: "cell"; id: number; key: CellKey; state: CellState }
  | { type: "text"; id: number; field: "company" | "position"; value: string }
  | { type: "remove"; id: number };

function applyPatch(rows: Interview[], patch: Patch): Interview[] {
  switch (patch.type) {
    case "cell":
      return rows.map((row) =>
        row.id === patch.id ? { ...row, [patch.key]: patch.state } : row,
      );
    case "text":
      return rows.map((row) =>
        row.id === patch.id ? { ...row, [patch.field]: patch.value } : row,
      );
    case "remove":
      return rows.filter((row) => row.id !== patch.id);
  }
}

export function Pipeline({ initialRows }: { initialRows: Interview[] }) {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  // Optimistic edits paint instantly and are dropped automatically once the
  // action settles and the revalidated server rows arrive.
  const [rows, patch] = useOptimistic(initialRows, applyPatch);

  function cycle(row: Interview, key: CellKey) {
    const next = nextState(row[key] as CellState);
    startTransition(async () => {
      patch({ type: "cell", id: row.id, key, state: next });
      await setCell(row.id, key, next);
      setSavedAt(new Date());
    });
  }

  function commitText(
    row: Interview,
    field: "company" | "position",
    value: string,
  ) {
    startTransition(async () => {
      patch({ type: "text", id: row.id, field, value });
      await setText(row.id, field, value);
      setSavedAt(new Date());
    });
  }

  function remove(row: Interview) {
    // A blank row is a misclick and goes quietly; a row with real history gets
    // a confirm, because deleting it silently moves every pass rate.
    const hasContent =
      row.company.trim() !== "" ||
      row.position.trim() !== "" ||
      CELL_KEYS.some((key) => row[key] !== "not_yet");

    if (
      hasContent &&
      !window.confirm(
        `Delete ${row.ticket}${row.company ? ` (${row.company})` : ""}? This changes your pass rates and cannot be undone.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      patch({ type: "remove", id: row.id });
      await deleteInterview(row.id);
      setSavedAt(new Date());
    });
  }

  function add() {
    startTransition(async () => {
      await addInterview();
      setSavedAt(new Date());
    });
  }

  const stats = stageStats(rows);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-start gap-3">
        {/* `unoptimized` is required, not cosmetic: Next's optimizer transcodes
            to WebP for Chrome and drops the alpha channel, which paints a white
            box behind the logo on the dark theme. At 7KB there is nothing to
            optimize anyway. */}
        <Image
          src="/logo.png"
          alt=""
          width={40}
          height={40}
          unoptimized
          className="mt-0.5"
        />
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold tracking-tight">
            Interview pipeline
          </h1>
          <p className="text-muted-foreground text-sm">
            Senior software engineer search — pass rate by round
          </p>
        </div>

        <div className="flex items-center gap-1">
          <span
            aria-live="polite"
            className="text-muted-foreground mr-1 font-mono text-xs tabular-nums"
          >
            {savedAt
              ? `Saved ${savedAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : ""}
          </span>
          <ThemeToggle />
          <form action={logout}>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </header>

      <StageSummary stats={stats} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Interviews{" "}
            <span className="text-muted-foreground font-normal">
              ({rows.length})
            </span>
          </h2>
          <Button size="sm" onClick={add} disabled={pending}>
            <Plus className="size-4" />
            {pending ? "Saving…" : "Add interview"}
          </Button>
        </div>

        <div className="bg-card overflow-x-auto rounded-xl border shadow-sm">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[11px] tracking-[0.08em] uppercase">
                <th scope="col" className="w-20 px-4 py-3 font-medium">
                  ID
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Company
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Position
                </th>
                {CELL_KEYS.map((key) => (
                  <th
                    key={key}
                    scope="col"
                    className="w-[108px] px-3 py-3 font-medium"
                  >
                    {CELL_HEADING[key]}
                  </th>
                ))}
                <th scope="col" className="w-12 px-2 py-3">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-muted-foreground h-28 px-4 text-center text-sm"
                  >
                    No interviews yet — add your first one.
                  </td>
                </tr>
              )}

              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="text-muted-foreground px-4 py-2.5 font-mono text-xs">
                    {row.ticket}
                  </td>
                  <td className="px-2 py-2.5">
                    <TextCell
                      value={row.company}
                      placeholder="Company name"
                      onCommit={(value) => commitText(row, "company", value)}
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <TextCell
                      value={row.position}
                      placeholder="Position title"
                      onCommit={(value) => commitText(row, "position", value)}
                    />
                  </td>

                  {CELL_KEYS.map((key) => (
                    <td key={key} className="px-3 py-2.5">
                      <CellButton
                        state={row[key] as CellState}
                        label={`${row.ticket} ${CELL_HEADING[key]}`}
                        onCycle={() => cycle(row, key)}
                      />
                    </td>
                  ))}

                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      aria-label={`Remove ${row.ticket}`}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <X className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
