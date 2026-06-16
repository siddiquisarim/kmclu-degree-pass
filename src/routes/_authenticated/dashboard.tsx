import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listStageRequests, actOnRequest } from "@/lib/requests.functions";
import { getMyProfile } from "@/lib/staff.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STAGE_LABEL: Record<string, string> = {
  hod: "Head of Department",
  library: "Library",
  proctor: "Proctor Office",
  finance: "Finance",
  coe: "Controller of Examination",
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Listing = Awaited<ReturnType<typeof listStageRequests>>;

function Dashboard() {
  const navigate = useNavigate();
  const listFn = useServerFn(listStageRequests);
  const actFn = useServerFn(actOnRequest);
  const profileFn = useServerFn(getMyProfile);
  const [data, setData] = useState<Listing | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string | null; email?: string | null } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, p] = await Promise.all([listFn(), profileFn()]);
    if (p.roles.length === 0) {
      navigate({ to: "/setup-role" });
      return;
    }
    setData(d);
    setProfile(p.profile);
  }, [listFn, profileFn, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(request_id: string, action: "approve" | "deny") {
    if (action === "deny" && !note.trim()) {
      alert("Please enter a reason for denial.");
      return;
    }
    setBusy(true);
    try {
      const res = await actFn({ data: { request_id, action, note: note.trim() || undefined } });
      if (!res.ok) {
        alert(res.error);
      } else {
        setNote("");
        setActiveId(null);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  const role = data?.roles[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">KMCLU Staff</p>
            <h1 className="text-base font-semibold">
              {role ? STAGE_LABEL[role] : "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{profile?.full_name || profile?.email}</span>
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <button
              onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">Pending verifications</h2>
            <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground">
              Refresh
            </button>
          </div>

          {!data && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
          {data && data.pending.length === 0 && (
            <p className="mt-6 rounded-md border border-border p-6 text-sm text-muted-foreground">
              No requests waiting for you right now.
            </p>
          )}

          <ul className="mt-4 space-y-3">
            {data?.pending.map((r) => (
              <li key={r.id} className="rounded-md border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-sm text-muted-foreground">{r.course}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Enrollment {r.enrollment_no} · Roll {r.roll_no} · DOB {r.dob}
                    </div>
                    {(r.email || r.phone) && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {r.email}{r.email && r.phone ? " · " : ""}{r.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveId(activeId === r.id ? null : r.id);
                        setNote("");
                      }}
                    >
                      {activeId === r.id ? "Cancel" : "Review"}
                    </Button>
                  </div>
                </div>

                {activeId === r.id && (
                  <div className="mt-4 grid gap-3 border-t border-border pt-4">
                    <Textarea
                      placeholder="Optional note (required if denying)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={500}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => act(r.id, "approve")} disabled={busy}>
                        Approve & forward
                      </Button>
                      <Button variant="destructive" onClick={() => act(r.id, "deny")} disabled={busy}>
                        Deny
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {data && data.history.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-medium">Recent activity</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {data.history.map((h) => (
                <li key={h.id} className="rounded-md border border-border px-4 py-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span>
                      <span className="font-medium">{h.degree_requests?.full_name}</span>{" "}
                      <span className="text-muted-foreground">
                        ({h.degree_requests?.enrollment_no})
                      </span>{" "}
                      — {h.action}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>
                  {h.note && <div className="mt-1 text-muted-foreground">{h.note}</div>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
