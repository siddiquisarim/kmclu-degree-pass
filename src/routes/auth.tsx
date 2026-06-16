import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Staff login — KMCLU" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim();
    const password = String(f.get("password") || "");
    try {
      if (mode === "signup") {
        const full_name = String(f.get("full_name") || "").trim();
        const { error: signErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name },
          },
        });
        if (signErr) {
          setError(signErr.message);
          return;
        }
        // Auto sign in if email confirmation disabled
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          navigate({ to: "/setup-role" });
        } else {
          setError("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) {
          setError(signErr.message);
          return;
        }
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">KMCLU Staff</p>
        </div>
      </header>
      <main className="mx-auto max-w-sm px-6 py-16">
        <h1 className="text-2xl font-semibold">
          {mode === "signin" ? "Staff login" : "Create staff account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For departmental users only (HOD, Library, Proctor, Finance, COE).
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          {mode === "signup" && (
            <div className="grid gap-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "signin" ? "signup" : "signin");
          }}
          className="mt-4 text-sm text-muted-foreground underline"
        >
          {mode === "signin" ? "Create a new staff account" : "Already have an account? Sign in"}
        </button>
      </main>
    </div>
  );
}
