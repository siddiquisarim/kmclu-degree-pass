import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  createRequest,
  findPendingForService,
  serviceByCode,
  serviceFee,
  resolveStages,
  COURSES,
  SERVICES,
  type AttachedDocument,
  type DocType,
  type ServiceCode,
} from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({ service: z.string().optional() });

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "New document request — KMCLU" },
      { name: "description", content: "Apply for a degree, certificate, transcript or correction at KMCLU." },
      { property: "og:title", content: "New document request — KMCLU" },
      { property: "og:description", content: "Apply for a degree, certificate, transcript or correction at KMCLU." },
    ],
  }),
  validateSearch: searchSchema,
  component: RequestPage,
});

function RequestPage() {
  const t = useT();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [serviceCode, setServiceCode] = useState<string>(
    search.service && serviceByCode(search.service) ? search.service : "",
  );
  const [hostel, setHostel] = useState(false);
  const [semesters, setSemesters] = useState(1);
  const [docs, setDocs] = useState<Record<string, AttachedDocument>>({});

  const service = useMemo(() => serviceByCode(serviceCode), [serviceCode]);
  const fee = service ? serviceFee(service, semesters) : 0;
  const stages = service ? resolveStages(service, hostel) : [];

  function onDocPick(doc_type: DocType, file: File | null) {
    if (!file) {
      setDocs((d) => {
        const next = { ...d };
        delete next[doc_type];
        return next;
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setDocs((d) => ({
        ...d,
        [doc_type]: {
          doc_type,
          name: file.name,
          size: file.size,
          data_url: String(reader.result),
        },
      }));
    reader.readAsDataURL(file);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!service) {
      setError(t("request.err.required"));
      return;
    }
    const f = new FormData(e.currentTarget);
    const payload = {
      service_code: service.code as ServiceCode,
      enrollment_no: String(f.get("enrollment_no") || "").trim(),
      roll_no: String(f.get("roll_no") || "").trim(),
      dob: String(f.get("dob") || ""),
      full_name: String(f.get("full_name") || "").trim(),
      course_code: String(f.get("course_code") || ""),
      email: String(f.get("email") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      hostel_resident: service.optional_hostel ? hostel : false,
      semesters: service.fee_per_semester ? semesters : undefined,
      documents: Object.values(docs),
    };
    if (
      !payload.enrollment_no ||
      !payload.roll_no ||
      !payload.dob ||
      !payload.full_name ||
      !payload.course_code
    ) {
      setError(t("request.err.required"));
      return;
    }
    const missing = service.documents.filter((d) => !docs[d]);
    if (missing.length > 0) {
      setError(t("request.err.docs"));
      return;
    }
    const existing = findPendingForService(
      payload.enrollment_no,
      payload.roll_no,
      payload.dob,
      service.code,
    );
    if (existing) {
      setError(t("request.err.duplicate"));
      return;
    }
    const res = createRequest(payload);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({
      to: "/track",
      search: { e: payload.enrollment_no, r: payload.roll_no, d: payload.dob },
    });
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="border-b border-border/70 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-sm text-muted-foreground transition hover:text-foreground">
            {t("nav.back")}
          </Link>
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="crest !h-6 !w-6 !text-[0.65rem]">K</span>
            {t("brand.kmclu")}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-3xl font-semibold">{t("request.title")}</h1>
        <div className="gold-rule mt-4 w-20" />
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("request.intro")}</p>

        <form onSubmit={onSubmit} className="card-paper mt-8 grid gap-4 p-6 sm:p-7">

          <div className="grid gap-1.5">
            <Label htmlFor="service">{t("request.field.service")}</Label>
            <select
              id="service"
              value={serviceCode}
              onChange={(e) => {
                setServiceCode(e.target.value);
                setDocs({});
                setHostel(false);
                setSemesters(1);
              }}
              required
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>{t("request.field.servicePlaceholder")}</option>
              <optgroup label={t("home.group.certificates")}>
                {SERVICES.filter((s) => s.group === "certificates").map((s) => (
                  <option key={s.code} value={s.code}>{t(`service.${s.code}`)}</option>
                ))}
              </optgroup>
              <optgroup label={t("home.group.corrections")}>
                {SERVICES.filter((s) => s.group === "corrections").map((s) => (
                  <option key={s.code} value={s.code}>{t(`service.${s.code}`)}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {service && (
            <div className="rounded-md border border-border bg-card p-4 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("request.payable")}
                </span>
                <span className="font-serif text-lg font-semibold">
                  {fee === 0 ? t("common.free") : `₹${fee}`}
                </span>
              </div>
              <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                {t("common.route")}
              </div>
              <p className="mt-1 text-sm">
                {stages.map((s) => t(`stage.${s}`)).join(" → ")}
              </p>
            </div>
          )}

          <Field label={t("request.field.fullName")} name="full_name" required maxLength={120} />
          <Field label={t("request.field.enrollmentNo")} name="enrollment_no" required maxLength={40} />
          <Field label={t("request.field.rollNo")} name="roll_no" required maxLength={40} />
          <Field label={t("request.field.dob")} name="dob" type="date" required />

          <div className="grid gap-1.5">
            <Label htmlFor="course_code">{t("request.field.course")}</Label>
            <select
              id="course_code"
              name="course_code"
              required
              defaultValue=""
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>{t("request.field.coursePlaceholder")}</option>
              {COURSES.map((c) => (
                <option key={c.code} value={c.code}>{t(`course.${c.code}`)}</option>
              ))}
            </select>
          </div>

          {service?.fee_per_semester && (
            <div className="grid gap-1.5">
              <Label htmlFor="semesters">{t("request.field.semesters")}</Label>
              <Input
                id="semesters"
                type="number"
                min={1}
                max={12}
                value={semesters}
                onChange={(e) => setSemesters(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          )}

          {service?.optional_hostel && (
            <label className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={hostel}
                onChange={(e) => setHostel(e.target.checked)}
                className="mt-0.5"
              />
              <span>{t("request.field.hostel")}</span>
            </label>
          )}

          {service && service.documents.length > 0 && (
            <fieldset className="grid gap-3 rounded-md border border-border p-4">
              <legend className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
                {t("request.docs.heading")}
              </legend>
              <p className="text-xs text-muted-foreground">{t("request.docs.hint")}</p>
              {service.documents.map((d) => (
                <div key={d} className="grid gap-1.5">
                  <Label htmlFor={`doc-${d}`}>{t(`doc.${d}`)}</Label>
                  <input
                    id={`doc-${d}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => onDocPick(d, e.target.files?.[0] ?? null)}
                    className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm"
                  />
                  {docs[d] && (
                    <span className="text-xs text-muted-foreground">{docs[d].name}</span>
                  )}
                </div>
              ))}
            </fieldset>
          )}

          <Field label={t("request.field.email")} name="email" type="email" maxLength={200} />
          <Field label={t("request.field.phone")} name="phone" maxLength={20} />

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="mt-2 w-full">{t("request.submit")}</Button>
        </form>
      </main>
    </div>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
      />
    </div>
  );
}
