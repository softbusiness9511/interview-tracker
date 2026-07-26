"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { interviews, type Interview } from "@/db/schema";
import {
  CELL_KEYS,
  CELL_STATES,
  type CellKey,
  type CellState,
} from "@/lib/pipeline";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  isCorrectPassword,
} from "@/lib/auth";

async function nextTicket() {
  const rows = await getDb()
    .select({ ticket: interviews.ticket })
    .from(interviews);
  const highest = rows.reduce((max, { ticket }) => {
    const match = ticket.match(/^HR-(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `HR-${String(highest + 1).padStart(2, "0")}`;
}

export async function addInterview() {
  const [row] = await getDb()
    .insert(interviews)
    .values({ ticket: await nextTicket() })
    .returning();

  revalidatePath("/");
  return row;
}

export async function setCell(id: number, key: CellKey, state: CellState) {
  if (!CELL_KEYS.includes(key)) throw new Error(`Unknown column: ${key}`);
  if (!CELL_STATES.includes(state)) throw new Error(`Unknown state: ${state}`);

  await getDb()
    .update(interviews)
    .set({ [key]: state } as Partial<Interview>)
    .where(eq(interviews.id, id));

  revalidatePath("/");
}

export async function setText(
  id: number,
  field: "company" | "position",
  value: string,
) {
  if (field !== "company" && field !== "position") {
    throw new Error(`Unknown field: ${field}`);
  }

  await getDb()
    .update(interviews)
    .set({ [field]: value.slice(0, 200) } as Partial<Interview>)
    .where(eq(interviews.id, id));

  revalidatePath("/");
}

export async function deleteInterview(id: number) {
  await getDb().delete(interviews).where(eq(interviews.id, id));
  revalidatePath("/");
}

export async function login(form: FormData) {
  const submitted = form.get("password");
  const password = typeof submitted === "string" ? submitted : "";

  if (!password || !isCorrectPassword(password)) {
    return { error: "Incorrect password." };
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
