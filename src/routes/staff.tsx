import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  STAGES,
  STAGE_LABEL,
  listByStage,
  actOn,
  type Stage,
  type DegreeRequest,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ROLE_KEY = "kmclu_staff_role";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff — KMCLU" },
      { name: "description", content: "Departmental verification dashboard." },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const [role, setRole] = useState<Stage | null>(null);
  const [pending, setPending] = useState<DegreeRequest[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(ROLE_KEY) as Stage | null;
    if (saved && STAGES.includes(saved)) setRole(saved);
  }, []);

  const refresh = useCallback(() => {
    if (role) setPending(listByStage(role));
  }, [role]);

  useEffect(() => {
    refresh();
    window.addEventListener("kmclu:changed", refresh);
    return () => window.removeEventListener("kmclu:changed", refresh);
  }, [refresh]);

  function pickRole(r: Stage) {
    localStorage.setItem(ROLE_KEY, r);
    setRole(r);
  }

  function act(id: string, action: "approve" | "deny") {
    if (!role) return;
    if (action === "deny" && !note.trim()) {
      alert("Please enter a reason for denial.");
      return;
    }
    const res = actOn(id, role, action, note.trim() || undefined);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setNote("");
    setActiveId(null);
    refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">KMCLU Staff</p>
            <h1 className="text-base font-semibold">
              {role ? STAGE_LABEL[role] : "Select your department"}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            {role && (
              <button
                onClick={() => {
                  localStorage.removeItem(ROLE_KEY);
                  setRole(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Switch role
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!role && (
          <section>
            <h2 className="text-lg font-medium">Pick your department</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open this page in different tabs to act as different departments.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => pickRole(s)}
                  className="rounded-md border border-border p-4 text-left transition hover:border-foreground/40 hover:bg-accent"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Stage {STAGES.indexOf(s) + 1}
                  </div>
                  <div className="mt-1 font-medium">{STAGE_LABEL[s]}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {role && (
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium">Pending verifications</h2>
              <button onClick={refresh} className="text-sm text-muted-foreground hover:text-foreground">
                Refresh
              </button>
            </div>

            {pending.length === 0 && (
              <p className="mt-6 rounded-md border border-border p-6 text-sm text-muted-foreground">
                No requests waiting for you right now.
              </p>
            )}

            <ul className="mt-4 space-y-3">
              {pending.map((r) => (
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

                  {activeId === r.id && (
                    <div className="mt-4 grid gap-3 border-t border-border pt-4">
                      <Textarea
                        placeholder="Optional note (required if denying)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => act(r.id, "approve")}>Approve & forward</Button>
                        <Button variant="destructive" onClick={() => act(r.id, "deny")}>
                          Deny
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
