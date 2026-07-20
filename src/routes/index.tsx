import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { STAGES } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KMCLU — Degree Request Portal" },
      { name: "description", content: "Apply for and track your KMCLU degree certificate through department verification." },
      { property: "og:title", content: "KMCLU — Degree Request Portal" },
      { property: "og:description", content: "Apply for and track your KMCLU degree certificate." },
    ],
  }),
  component: Index,
});

function Index() {
  const t = useT();
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

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {t("brand.examCell")}
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t("home.title")}
          </h2>
          <div className="gold-rule mt-5 w-24" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {t("home.intro")}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <Link
            to="/request"
            className="group relative block overflow-hidden rounded-lg border border-border bg-card p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
            <h3 className="font-serif text-xl font-semibold">{t("home.new.title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("home.new.desc")}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("home.new.title")} <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
          <Link
            to="/track"
            className="group relative block overflow-hidden rounded-lg border border-border bg-card p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
            <h3 className="font-serif text-xl font-semibold">{t("home.track.title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("home.track.desc")}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {t("home.track.title")} <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </div>

        <section className="mt-16">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              {t("home.flow.heading")}
            </h3>
            <div className="gold-rule flex-1" />
          </div>
          <ol className="mt-5 grid gap-3 text-sm sm:grid-cols-5">
            {STAGES.map((s, i) => (
              <li
                key={s}
                className="relative rounded-md border border-border bg-card p-4 shadow-sm transition hover:border-primary/30"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-lg font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("common.stage")}</span>
                </div>
                <div className="mt-1.5 font-medium leading-snug">{t(`stage.${s}`)}</div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {t("brand.examCell")}
      </footer>
    </div>
  );
}
