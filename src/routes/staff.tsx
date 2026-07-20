import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  STAGES,
  DEPARTMENTS,
  DENIAL_REASONS,
  listByStage,
  listForHod,
  actOn,
  type Stage,
  type DepartmentCode,
  type DegreeRequest,
} from "@/lib/store";
import { useT, tReason } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const ROLE_KEY = "kmclu_staff_role";
const DEPT_KEY = "kmclu_staff_dept";

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
  const t = useT();
  const [role, setRole] = useState<Stage | null>(null);
  const [dept, setDept] = useState<DepartmentCode | null>(null);
  const [pending, setPending] = useState<DegreeRequest[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [certFile, setCertFile] = useState<{ name: string; data_url: string } | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem(ROLE_KEY) as Stage | null;
    const savedDept = localStorage.getItem(DEPT_KEY) as DepartmentCode | null;
    if (savedRole && STAGES.includes(savedRole)) setRole(savedRole);
    if (savedDept) setDept(savedDept);
  }, []);

  const needsDept = role === "hod";

  const refresh = useCallback(() => {
    if (!role) return;
    if (role === "hod") {
      if (dept) setPending(listForHod(dept));
      else setPending([]);
    } else {
      setPending(listByStage(role));
    }
  }, [role, dept]);

  useEffect(() => {
    refresh();
    window.addEventListener("kmclu:changed", refresh);
    return () => window.removeEventListener("kmclu:changed", refresh);
  }, [refresh]);

  function pickRole(r: Stage) {
    localStorage.setItem(ROLE_KEY, r);
    setRole(r);
    if (r !== "hod") {
      localStorage.removeItem(DEPT_KEY);
      setDept(null);
    }
  }

  function pickDept(d: DepartmentCode) {
    localStorage.setItem(DEPT_KEY, d);
    setDept(d);
  }

  function switchRole() {
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(DEPT_KEY);
    setRole(null);
    setDept(null);
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

  const headerTitle = role
    ? role === "hod" && dept
      ? t("staff.hodOf", { dept: t(`dept.${dept}`) })
      : t(`stage.${role}`)
    : t("staff.selectDept");

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
            {role && (
              <button onClick={switchRole} className="text-muted-foreground hover:text-foreground">
                {t("staff.switchRole")}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {!role && (
          <section>
            <h2 className="text-lg font-medium">{t("staff.pickDept.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("staff.pickDept.desc")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => pickRole(s)}
                  className="rounded-md border border-border p-4 text-left transition hover:border-foreground/40 hover:bg-accent"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("common.stage")} {STAGES.indexOf(s) + 1}
                  </div>
                  <div className="mt-1 font-medium">{t(`stage.${s}`)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {role && needsDept && !dept && (
          <section>
            <h2 className="text-lg font-medium">{t("staff.pickHodDept.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("staff.pickHodDept.desc")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d.code}
                  onClick={() => pickDept(d.code)}
                  className="rounded-md border border-border p-4 text-left transition hover:border-foreground/40 hover:bg-accent"
                >
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {d.code.toUpperCase()}
                  </div>
                  <div className="mt-1 font-medium">{t(`dept.${d.code}`)}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {role && (!needsDept || dept) && (
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
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t(`course.${r.course_code}`)} · {t(`dept.${r.department}`)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t("track.enrollment")} {r.enrollment_no} · {t("track.roll")} {r.roll_no} · {t("track.field.dob")} {r.dob}
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
                        setReason("");
                      }}
                    >
                      {activeId === r.id ? t("common.cancel") : t("common.review")}
                    </Button>
                  </div>

                  {activeId === r.id && role && (
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
