"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { login } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await login(form);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="bg-card w-full max-w-sm rounded-xl border p-6">
        {/* Static PNG rather than the source GIF: GIF alpha is 1-bit, so a
            transparent version would have hard jagged edges, and an opaque one
            shows a white box on the dark card. `unoptimized` preserves the alpha
            channel, which Next's WebP transcode otherwise discards. */}
        <Image
          src="/logo.png"
          alt=""
          width={52}
          height={52}
          unoptimized
          priority
          className="mb-4"
        />

        <h1 className="text-lg font-semibold tracking-tight">
          Interview Tracker
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Enter your password to continue.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    </main>
  );
}
