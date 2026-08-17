import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { SERVICES, resolveStages, type Service } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KMCLU — Document & Degree Request Portal" },
      { name: "description", content: "Apply for degrees, certificates, transcripts, duplicates and corrections at KMCLU and track every verification stage." },
      { property: "og:title", content: "KMCLU — Document & Degree Request Portal" },
      { property: "og:description", content: "Apply for degrees, certificates, transcripts and corrections at KMCLU." },
    ],
  }),
  component: Index,
});

function Index() {
  const t = useT();
  const groups: { key: "certificates" | "corrections"; items: Service[] }[] = [
    { key: "certificates", items: SERVICES.filter((s) => s.group === "certificates") },
    { key: "corrections", items: SERVICES.filter((s) => s.group === "corrections") },
  ];

  return (
    <div className="min-h-screen text-foreground">
      <header className="border-b border-border/70 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="crest">K</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{t("brand.kmclu")}</p>
              <h1 className="text-lg font-semibold leading-tight">{t("brand.portal")}</h1>
            </div>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/staff" className="text-muted-foreground transition hover:text-foreground">{t("nav.staff")}</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <section className="panel-navy px-7 py-12 sm:px-12 sm:py-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary-foreground/70">
            {t("brand.examCell")}
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            {t("home.title")}
          </h2>
          <div className="gold-rule mt-6 w-28" />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/80">
            {t("home.intro")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/request"
              className="inline-flex items-center gap-2 rounded-md bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:opacity-90"
            >
              {t("common.apply")} <span aria-hidden>→</span>
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 px-5 py-2.5 text-sm font-medium transition hover:border-primary-foreground/60"
            >
              {t("home.track.title")}
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
            {(["hod", "library", "proctor", "payment", "finance", "coe"] as const).map((st, i) => (
              <span key={st} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-primary-foreground/40">→</span>}
                <span>{t(`stage.${st}`)}</span>
              </span>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link to="/request" className="card-paper group block p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-70" />
            <span className="step-dot">1</span>
            <h3 className="mt-4 font-serif text-xl font-semibold">{t("home.new.title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("home.new.desc")}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("common.apply")} <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
          <Link to="/track" className="card-paper group block p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-70" />
            <span className="step-dot">2</span>
            <h3 className="mt-4 font-serif text-xl font-semibold">{t("home.track.title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("home.track.desc")}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("home.track.title")} <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </div>


        <section className="mt-16">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              {t("home.services.heading")}
            </h3>
            <div className="gold-rule flex-1" />
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{t("home.services.desc")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("home.hostelNote")}</p>


          {groups.map((g) => (
            <div key={g.key} className="mt-8">
              <h4 className="font-serif text-lg font-semibold">{t(`home.group.${g.key}`)}</h4>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((s) => {
                  const feeText = s.fee_per_semester
                    ? `₹${s.fee_per_semester} ${t("common.perSemester")}`
                    : s.fee === 0
                      ? t("common.free")
                      : `₹${s.fee}`;
                  const route = resolveStages(s, s.optional_hostel);
                  return (
                    <li key={s.code} className="card-paper flex flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="font-serif text-base font-semibold leading-snug">
                          {t(`service.${s.code}`)}
                        </h5>
                        <span className="badge-gold shrink-0">{feeText}</span>
                      </div>
                      <div className="gold-rule mt-3 w-full opacity-70" />
                      <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t("common.route")}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {route.map((st) => t(`stage.${st}`)).join(" → ")}
                        {s.optional_hostel ? " *" : ""}
                      </p>
                      <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {t("common.docsRequired")}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {s.documents.length === 0
                          ? t("common.noDocs")
                          : s.documents.map((d) => t(`doc.${d}`)).join(", ")}
                      </p>
                      <Link
                        to="/request"
                        search={{ service: s.code }}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                      >
                        {t("common.apply")} <span aria-hidden>→</span>
                      </Link>
                    </li>

                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {t("brand.examCell")}
      </footer>
    </div>
  );
}
