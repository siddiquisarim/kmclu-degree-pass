import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  DEPARTMENTS,
  SERVICES,
  STAGES,
  STAGE_LABEL,
  listAll,
  stats,
  adminUpdateRequest,
  adminSetStage,
  deleteRequest,
  resetAll,
  type DegreeRequest,
  type DepartmentCode,
  type Stage,
  type Status,
} from "@/lib/store";
import {
  ROLE_OPTIONS,
  createUser,
  currentUser,
  deleteUser,
  listUsers,
  login,
  logout,
  updateUser,
  type Role,
  type StaffUser,
} from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — KMCLU Document Portal" },
      {
        name: "description",
        content: "Manage staff accounts, access levels and every document request at KMCLU.",
      },
      { property: "og:title", content: "Admin panel — KMCLU Document Portal" },
      {
        property: "og:description",
        content: "Manage staff accounts, access levels and every document request at KMCLU.",
      },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "users" | "requests";

function AdminPage() {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setUser(currentUser());
    setReady(true);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">KMCLU</p>
            <h1 className="text-base font-semibold">Administration</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/staff" className="text-muted-foreground hover:text-foreground">Staff</Link>
            {user && (
              <button
                onClick={() => {
                  logout();
                  setUser(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {ready && !isAdmin && <AdminLogin onSuccess={setUser} signedIn={!!user} />}

        {isAdmin && (
          <>
            <nav className="flex gap-2 border-b border-border pb-3">
              {(["overview", "users", "requests"] as Tab[]).map((x) => (
                <button
                  key={x}
                  onClick={() => setTab(x)}
                  className={`rounded-md px-3 py-1.5 text-sm capitalize transition ${
                    tab === x
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {x === "users" ? "Staff accounts" : x}
                </button>
              ))}
            </nav>
            <div className="mt-8">
              {tab === "overview" && <Overview />}
              {tab === "users" && <Users />}
              {tab === "requests" && <Requests />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function AdminLogin({
  onSuccess,
  signedIn,
}: {
  onSuccess: (u: StaffUser) => void;
  signedIn: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="mx-auto max-w-sm rounded-md border border-border p-6">
      <h2 className="font-serif text-lg font-semibold">Administrator sign in</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {signedIn
          ? "This account does not have administrator access. Sign in with an admin account."
          : "Only administrator accounts can open this panel."}
      </p>
      <form
        className="mt-5 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const res = login(email, password);
          if (!res.ok) return setError(res.error);
          if (res.user.role !== "admin") {
            setError("This account is not an administrator.");
            return;
          }
          setError("");
          onSuccess(res.user);
        }}
      >
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit">Sign in</Button>
      </form>
      <p className="mt-4 text-xs text-muted-foreground">
        Demo administrator — admin@kmclu.ac.in / admin123
      </p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function Overview() {
  const [s, setS] = useState(() => ({
    total: 0,
    pending: 0,
    approved: 0,
    denied: 0,
    fees: 0,
    by_stage: {} as Record<Stage, number>,
  }));

  const refresh = useCallback(() => setS(stats()), []);
  useEffect(() => {
    refresh();
    window.addEventListener("kmclu:changed", refresh);
    return () => window.removeEventListener("kmclu:changed", refresh);
  }, [refresh]);

  return (
    <section className="grid gap-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total requests", s.total],
          ["Pending", s.pending],
          ["Approved", s.approved],
          ["Denied", s.denied],
          ["Fees collected", `₹${s.fees}`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border border-border p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 font-serif text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-serif text-lg font-semibold">Queue by stage</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((st) => (
            <div key={st} className="rounded-md border border-border p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {STAGE_LABEL[st]}
              </div>
              <div className="mt-1 font-serif text-xl font-semibold">{s.by_stage[st] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-lg font-semibold">Services & routes</h2>
        <div className="mt-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-accent/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Service</th>
                <th className="p-3 text-left">Fee</th>
                <th className="p-3 text-left">Route</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((sv) => (
                <tr key={sv.code} className="border-t border-border">
                  <td className="p-3">{sv.name}</td>
                  <td className="p-3">
                    {sv.fee_per_semester
                      ? `₹${sv.fee_per_semester} / semester`
                      : sv.fee === 0
                        ? "Free"
                        : `₹${sv.fee}`}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {sv.stages.map((st) => STAGE_LABEL[st]).join(" → ")}
                    {sv.optional_hostel ? " (+ Hostel if resident)" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Reset all requests back to the demo data?")) {
              resetAll();
              refresh();
            }
          }}
        >
          Reset demo data
        </Button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Staff accounts
// ---------------------------------------------------------------------------

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "hod" as Role,
  department: "" as DepartmentCode | "",
};

function Users() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const refresh = useCallback(() => setUsers(listUsers()), []);
  useEffect(() => {
    refresh();
    window.addEventListener("kmclu:users", refresh);
    return () => window.removeEventListener("kmclu:users", refresh);
  }, [refresh]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = createUser({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      department: form.department || null,
    });
    if (!res.ok) return setError(res.error);
    setError("");
    setForm(emptyForm);
    refresh();
  }

  return (
    <section className="grid gap-8">
      <div className="rounded-md border border-border p-6">
        <h2 className="font-serif text-lg font-semibold">Create staff account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign an email, password and access level. The access level decides which verification
          queue the person sees.
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
          <Field label="Full name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Password">
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Access level">
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role, department: "" })
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === "admin" ? "Administrator (full access)" : STAGE_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          {form.role === "hod" && (
            <Field label="Department">
              <select
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value as DepartmentCode })
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <Button type="submit">Create account</Button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-serif text-lg font-semibold">Accounts ({users.length})</h2>
        <div className="mt-3 space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {u.name}{" "}
                    {!u.active && (
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        disabled
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {u.role === "admin" ? "Administrator" : STAGE_LABEL[u.role]}
                    {u.department ? ` · ${DEPARTMENTS.find((d) => d.code === u.department)?.name}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(editing === u.id ? null : u.id)}
                  >
                    {editing === u.id ? "Close" : "Edit"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateUser(u.id, { active: !u.active });
                      refresh();
                    }}
                  >
                    {u.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (!confirm(`Delete ${u.email}?`)) return;
                      const res = deleteUser(u.id);
                      if (!res.ok) alert(res.error);
                      refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {editing === u.id && <EditUser user={u} onDone={refresh} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditUser({ user, onDone }: { user: StaffUser; onDone: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user.role);
  const [department, setDepartment] = useState<DepartmentCode | "">(user.department ?? "");
  const [error, setError] = useState("");

  return (
    <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2">
      <Field label="Full name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </Field>
      <Field label="Email">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </Field>
      <Field label="New password (leave blank to keep)">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </Field>
      <Field label="Access level">
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role);
            setDepartment("");
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r === "admin" ? "Administrator (full access)" : STAGE_LABEL[r]}
            </option>
          ))}
        </select>
      </Field>
      {role === "hod" && (
        <Field label="Department">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as DepartmentCode)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select department…</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
      <div className="md:col-span-2">
        <Button
          size="sm"
          onClick={() => {
            const res = updateUser(user.id, {
              name,
              email,
              role,
              department: department || null,
              ...(password ? { password } : {}),
            });
            if (!res.ok) return setError(res.error);
            setError("");
            setPassword("");
            onDone();
          }}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

function Requests() {
  const [rows, setRows] = useState<DegreeRequest[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(() => setRows(listAll()), []);
  useEffect(() => {
    refresh();
    window.addEventListener("kmclu:changed", refresh);
    return () => window.removeEventListener("kmclu:changed", refresh);
  }, [refresh]);

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      r.full_name.toLowerCase().includes(needle) ||
      r.enrollment_no.toLowerCase().includes(needle) ||
      r.roll_no.toLowerCase().includes(needle) ||
      r.service_name.toLowerCase().includes(needle)
    );
  });

  return (
    <section>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <Field label="Search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, enrollment, roll or service…"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </Field>
        </div>
        <Field label="Status">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </Field>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{filtered.length} request(s)</p>

      <div className="mt-3 space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-serif text-base font-semibold">{r.service_name}</div>
                <div className="mt-0.5 font-medium">{r.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.enrollment_no} · {r.roll_no} · {r.dob} · {r.course_name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Status <span className="uppercase">{r.status}</span> · Stage{" "}
                  {STAGE_LABEL[r.current_stage]} · Fee {r.fee === 0 ? "Free" : `₹${r.fee}`}
                  {r.denial_reason ? ` · Reason: ${r.denial_reason}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                  {openId === r.id ? "Close" : "Manage"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (!confirm("Delete this request permanently?")) return;
                    deleteRequest(r.id);
                    refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
            {openId === r.id && <ManageRequest req={r} onDone={refresh} />}
          </div>
        ))}
      </div>
    </section>
  );
}

function ManageRequest({ req, onDone }: { req: DegreeRequest; onDone: () => void }) {
  const [full_name, setFullName] = useState(req.full_name);
  const [enrollment_no, setEnrollment] = useState(req.enrollment_no);
  const [roll_no, setRoll] = useState(req.roll_no);
  const [dob, setDob] = useState(req.dob);
  const [email, setEmail] = useState(req.email ?? "");
  const [phone, setPhone] = useState(req.phone ?? "");
  const [fee, setFee] = useState(String(req.fee));
  const [status, setStatus] = useState<Status>(req.status);
  const [stage, setStage] = useState<Stage | "done">(req.current_stage);
  const [reason, setReason] = useState(req.denial_reason ?? "");
  const [cert, setCert] = useState<{ name: string; data_url: string } | null>(null);

  function pickCert(file: File | null) {
    if (!file) return setCert(null);
    const reader = new FileReader();
    reader.onload = () => setCert({ name: file.name, data_url: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <div className="mt-4 grid gap-6 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-semibold">Applicant details</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Field label="Full name">
            <input value={full_name} onChange={(e) => setFullName(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
          <Field label="Enrollment number">
            <input value={enrollment_no} onChange={(e) => setEnrollment(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
          <Field label="Roll number">
            <input value={roll_no} onChange={(e) => setRoll(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
          <Field label="Date of birth">
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
          <Field label="Fee (₹)">
            <input value={fee} onChange={(e) => setFee(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Process control</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </Field>
          <Field label="Current stage">
            <select value={stage} onChange={(e) => setStage(e.target.value as Stage | "done")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {req.stages.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
              <option value="done">Completed</option>
            </select>
          </Field>
          <Field label="Denial reason (if denied)">
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {req.stages.map((s) => (
            <Button
              key={s}
              size="sm"
              variant="outline"
              onClick={() => {
                adminSetStage(req.id, s);
                onDone();
              }}
            >
              Move to {STAGE_LABEL[s]}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              adminSetStage(req.id, "done");
              onDone();
            }}
          >
            Mark completed
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Final document</h3>
        <div className="mt-3 grid gap-2">
          {req.certificate_data_url && (
            <a href={req.certificate_data_url} target="_blank" rel="noreferrer" className="text-sm underline">
              {req.certificate_name ?? "Current document"}
            </a>
          )}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => pickCert(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
          />
          {cert && <span className="text-xs text-muted-foreground">{cert.name}</span>}
        </div>
      </div>

      {req.documents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Submitted documents</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {req.documents.map((d) => (
              <li key={d.doc_type}>
                {d.data_url ? (
                  <a href={d.data_url} target="_blank" rel="noreferrer" className="underline">
                    {d.name}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{d.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {req.history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Activity</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {req.history.map((h, i) => (
              <li key={i}>
                {STAGE_LABEL[h.stage]} — {h.action}
                {h.reason ? ` (${h.reason})` : ""} · {new Date(h.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Button
          onClick={() => {
            adminUpdateRequest(req.id, {
              full_name,
              enrollment_no,
              roll_no,
              dob,
              email,
              phone,
              fee: Number(fee) || 0,
              status,
              current_stage: stage,
              denial_reason: status === "denied" ? reason || null : null,
              ...(cert ? { certificate_name: cert.name, certificate_data_url: cert.data_url } : {}),
            });
            onDone();
          }}
        >
          Save all changes
        </Button>
      </div>
    </div>
  );
}
