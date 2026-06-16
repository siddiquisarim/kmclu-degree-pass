import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { claimStaffRole, getMyProfile } from "@/lib/staff.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ROLES = [
  { value: "hod", label: "Head of Department" },
  { value: "library", label: "Library" },
  { value: "proctor", label: "Proctor Office" },
  { value: "finance", label: "Finance" },
  { value: "coe", label: "Controller of Examination" },
] as const;

export const Route = createFileRoute("/_authenticated/setup-role")({
  component: SetupRolePage,
});

function SetupRolePage() {
  const navigate = useNavigate();
  const claim = useServerFn(claimStaffRole);
  const getProfile = useServerFn(getMyProfile);
  const [role, setRole] = useState<(typeof ROLES)[number]["value"] | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      if (p.roles.length > 0) navigate({ to: "/dashboard" });
    });
  }, [getProfile, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);
    try {
      const res = await claim({ data: { role } });
      if (!res.ok) setError(res.error);
      else navigate({ to: "/dashboard" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">KMCLU</Link>
          <button
            onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-sm px-6 py-16">
        <h1 className="text-2xl font-semibold">Select your department</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose the office you work in. This can only be set once.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label>Department</Label>
            <div className="grid gap-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm ${
                    role === r.value ? "border-foreground" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={!role || loading}>
            {loading ? "Saving…" : "Continue"}
          </Button>
        </form>
      </main>
    </div>
  );
}
