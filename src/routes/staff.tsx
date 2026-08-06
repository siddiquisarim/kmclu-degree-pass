import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  DENIAL_REASONS,
  listByStage,
  listForHod,
  actOn,
  type Stage,
  type DegreeRequest,
} from "@/lib/store";
import { currentUser, login, logout, type StaffUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff sign in — KMCLU Document Portal" },
      { name: "description", content: "Departmental verification dashboard for KMCLU staff." },
      { property: "og:title", content: "Staff sign in — KMCLU Document Portal" },
      { property: "og:description", content: "Departmental verification dashboard for KMCLU staff." },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const t = useT();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<DegreeRequest[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [certFile, setCertFile] = useState<{ name: string; data_url: string } | null>(null);

  useEffect(() => {
    setUser(currentUser());
    setReady(true);
  }, []);

  const role = user && user.role !== "admin" ? (user.role as Stage) : null;
  const dept = user?.department ?? null;

  const refresh = useCallback(() => {
    if (!role) return setPending([]);
    if (role === "hod") setPending(dept ? listForHod(dept) : []);
    else setPending(listByStage(role));
  }, [role, dept]);

  useEffect(() => {
    refresh();
    window.addEventListener("kmclu:changed", refresh);
    return () => window.removeEventListener("kmclu:changed", refresh);
  }, [refresh]);

  function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError("");
    setPassword("");
    setUser(res.user);
  }

  function onSignOut() {
    logout();
    setUser(null);
    setPending([]);
  }

  function act(id: string, action: "approve" | "deny") {
    if (!role) return;
    if (action === "deny" && !reason) {
      alert(t("staff.err.pickReason"));
      return;
    }
    if (action === "approve" && role === "coe" && !certFile) {
      alert(t("staff.err.uploadCert"));
      return;
    }
    const res = actOn(
      id,
      role,
      action,
      action === "deny" ? reason : undefined,
      action === "approve" && role === "coe" && certFile
        ? { certificate_name: certFile.name, certificate_data_url: certFile.data_url }
        : undefined,
    );
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setReason("");
    setCertFile(null);
    setActiveId(null);
    refresh();
  }

  function onCertPick(file: File | null) {
    if (!file) {
      setCertFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCertFile({ name: file.name, data_url: String(reader.result) });
    reader.readAsDataURL(file);
  }

  const headerTitle = !user
    ? t("auth.title")
    : user.role === "admin"
      ? t("auth.adminPanel")
      : role === "hod" && dept
        ? t("staff.hodOf", { dept: t(`dept.${dept}`) })
        : t(`stage.${user.role}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("staff.brand")}</p>
            <h1 className="text-base font-semibold">{headerTitle}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">{t("nav.home")}</Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                {t("auth.adminPanel")}
              </Link>
            )}
            {user && (
              <button onClick={onSignOut} className="text-muted-foreground hover:text-foreground">
                {t("auth.signOut")}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {ready && !user && (
          <section className="mx-auto max-w-sm rounded-md border border-border p-6">
            <h2 className="font-serif text-lg font-semibold">{t("auth.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.desc")}</p>
            <form onSubmit={onSignIn} className="mt-5 grid gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("auth.password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit">{t("auth.signIn")}</Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Demo accounts — admin@kmclu.ac.in / admin123, coe@kmclu.ac.in / staff123,
              hod.cse@kmclu.ac.in / hod123
            </p>
          </section>
        )}

        {user?.role === "admin" && (
          <section className="rounded-md border border-border p-6">
            <h2 className="font-serif text-lg font-semibold">{t("auth.adminPanel")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You are signed in as an administrator. Open the admin panel to manage accounts and
              every request.
            </p>
            <Link to="/admin" className="mt-4 inline-block">
              <Button>{t("auth.adminPanel")}</Button>
            </Link>
          </section>
        )}

        {role && (
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-medium">{t("staff.pending")}</h2>
              <button onClick={refresh} className="text-sm text-muted-foreground hover:text-foreground">
                {t("common.refresh")}
              </button>
            </div>

            {pending.length === 0 && (
              <p className="mt-6 rounded-md border border-border p-6 text-sm text-muted-foreground">
                {t("staff.none")}
              </p>
            )}

            <ul className="mt-4 space-y-3">
              {pending.map((r) => (
                <li key={r.id} className="rounded-md border border-border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t("track.service")}
                      </div>
                      <div className="font-serif text-base font-semibold">
                        {t(`service.${r.service_code}`)}
                      </div>
                      <div className="mt-1 font-medium">{r.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t(`course.${r.course_code}`)} · {t(`dept.${r.department}`)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("track.enrollment")} {r.enrollment_no} · {t("track.roll")} {r.roll_no} · {t("track.field.dob")} {r.dob}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("track.fee")}: {r.fee === 0 ? t("common.free") : `₹${r.fee}`}
                      </div>
                      {(r.email || r.phone) && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {r.email}{r.email && r.phone ? " · " : ""}{r.phone}
                        </div>
                      )}
                      {r.documents.length > 0 && (
                        <div className="mt-2">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {t("track.docs")}
                          </div>
                          <ul className="mt-1 space-y-0.5 text-xs">
                            {r.documents.map((d) => (
                              <li key={d.doc_type}>
                                {d.data_url ? (
                                  <a
                                    href={d.data_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                  >
                                    {t(`doc.${d.doc_type}`)}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">{t(`doc.${d.doc_type}`)}</span>
                                )}
                                <span className="text-muted-foreground"> — {d.name}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveId(activeId === r.id ? null : r.id);
                        setReason("");
                        setCertFile(null);
                      }}
                    >
                      {activeId === r.id ? t("common.cancel") : t("common.review")}
                    </Button>
                  </div>

                  {activeId === r.id && (
                    <div className="mt-4 grid gap-3 border-t border-border pt-4">
                      <div className="grid gap-1.5">
                        <label className="text-xs uppercase tracking-wider text-muted-foreground">
                          {t("staff.denialLabel")}
                        </label>
                        <select
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">{t("staff.denialPlaceholder")}</option>
                          {DENIAL_REASONS[role].map((opt, i) => (
                            <option key={opt} value={opt}>
                              {t(`reason.${role}.${i}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      {role === "coe" && (
                        <div className="grid gap-1.5">
                          <label className="text-xs uppercase tracking-wider text-muted-foreground">
                            {t("staff.uploadLabel")}
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => onCertPick(e.target.files?.[0] ?? null)}
                            className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
                          />
                          {certFile && (
                            <div className="text-xs text-muted-foreground">{certFile.name}</div>
                          )}
                          <p className="text-xs text-muted-foreground">{t("staff.uploadHint")}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={() => act(r.id, "approve")}>{t("common.approve")}</Button>
                        <Button variant="destructive" onClick={() => act(r.id, "deny")}>
                          {t("common.deny")}
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
