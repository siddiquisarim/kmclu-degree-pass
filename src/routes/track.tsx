import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { findByCredentials, STAGES, STAGE_LABEL, type DegreeRequest } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  e: z.string().optional(),
  r: z.string().optional(),
  d: z.string().optional(),
});

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track request — KMCLU" },
      { name: "description", content: "Track your degree request status." },
    ],
  }),
  validateSearch: searchSchema,
  component: TrackPage,
});

function TrackPage() {
  const search = Route.useSearch();
  const [request, setRequest] = useState<DegreeRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [form, setForm] = useState({
    enrollment_no: search.e ?? "",
    roll_no: search.r ?? "",
    dob: search.d ?? "",
  });

  const lookup = useCallback((values: typeof form) => {
    setError(null);
    setSearched(true);
    const found = findByCredentials(values.enrollment_no, values.roll_no, values.dob);
    if (!found) {
      setRequest(null);
      setError("No request found with these details.");
    } else {
      setRequest(found);
    }
  }, []);

  useEffect(() => {
    if (search.e && search.r && search.d) {
      lookup({ enrollment_no: search.e, roll_no: search.r, dob: search.d });
    }
    const handler = () => {
      if (form.enrollment_no && form.roll_no && form.dob) {
        const found = findByCredentials(form.enrollment_no, form.roll_no, form.dob);
        if (found) setRequest(found);
      }
    };
    window.addEventListener("kmclu:changed", handler);
    return () => window.removeEventListener("kmclu:changed", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.enrollment_no, form.roll_no, form.dob]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">KMCLU</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Track your request</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(form);
          }}
          className="mt-6 grid gap-4 rounded-md border border-border p-5"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="enrollment_no">Enrollment number</Label>
            <Input
              id="enrollment_no"
              value={form.enrollment_no}
              onChange={(e) => setForm({ ...form, enrollment_no: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="roll_no">Roll number</Label>
            <Input
              id="roll_no"
              value={form.roll_no}
              onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              required
            />
          </div>
          <Button type="submit">Check status</Button>
        </form>

        {error && searched && (
          <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {request && <StatusView r={request} />}
      </main>
    </div>
  );
}

function StatusView({ r }: { r: DegreeRequest }) {
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-md border border-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Applicant</div>
            <div className="mt-0.5 font-medium">{r.full_name}</div>
            <div className="text-sm text-muted-foreground">{r.course}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Enrollment {r.enrollment_no} · Roll {r.roll_no}
            </div>
          </div>
          <StatusBadge status={r.status} />
        </div>

        {r.status === "denied" && (
          <div className="mt-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <div className="font-medium text-destructive">
              Denied at {STAGE_LABEL[r.denied_stage ?? ""]}
            </div>
            <p className="mt-1 text-foreground">{r.denial_reason}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Please visit the {STAGE_LABEL[r.denied_stage ?? ""]} office to resolve the issue.
            </p>
          </div>
        )}

        {r.status === "approved" && (
          <div className="mt-4 rounded border border-border bg-accent p-3 text-sm">
            <div className="font-medium">Your degree is ready.</div>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                `KMCLU Degree Certificate\n\nAwarded to: ${r.full_name}\nEnrollment: ${r.enrollment_no}\nRoll: ${r.roll_no}\nCourse: ${r.course}\nIssued: ${new Date(r.updated_at).toLocaleDateString()}`,
              )}`}
              download={`KMCLU-Degree-${r.enrollment_no}.txt`}
              className="mt-1 inline-block underline"
            >
              Download degree certificate
            </a>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Verification stages
        </h3>
        <ol className="mt-3 space-y-2">
          {STAGES.map((stage) => {
            const state = stageState(stage, r);
            return (
              <li
                key={stage}
                className="flex items-center justify-between rounded-md border border-border px-4 py-3"
              >
                <span className="text-sm">{STAGE_LABEL[stage]}</span>
                <span className={`text-xs ${stateColor(state)}`}>{stateLabel(state)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {r.history.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Activity
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {r.history.map((h, i) => (
              <li key={i} className="rounded-md border border-border px-4 py-2">
                <div>
                  <span className="font-medium">{STAGE_LABEL[h.stage]}</span> — {h.action}
                </div>
                {h.note && <div className="mt-1 text-muted-foreground">{h.note}</div>}
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function stageState(stage: string, r: DegreeRequest) {
  const order = ["hod", "library", "proctor", "finance", "coe"];
  const idx = order.indexOf(stage);
  const curIdx = order.indexOf(r.current_stage);
  if (r.status === "approved") return "approved";
  if (r.status === "denied") {
    if (stage === r.denied_stage) return "denied";
    if (idx < order.indexOf(r.denied_stage ?? "")) return "approved";
    return "pending";
  }
  if (idx < curIdx) return "approved";
  if (idx === curIdx) return "current";
  return "pending";
}

function stateLabel(s: string) {
  return { approved: "Approved", current: "In review", pending: "Pending", denied: "Denied" }[s] ?? s;
}
function stateColor(s: string) {
  return {
    approved: "text-foreground",
    current: "text-foreground font-medium",
    pending: "text-muted-foreground",
    denied: "text-destructive font-medium",
  }[s] ?? "";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "border-border bg-muted text-foreground",
    approved: "border-border bg-foreground text-background",
    denied: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
}
