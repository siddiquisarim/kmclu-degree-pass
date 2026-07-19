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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("brand.kmclu")}</p>
            <h1 className="text-lg font-semibold">{t("brand.portal")}</h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/staff" className="text-muted-foreground hover:text-foreground">{t("nav.staff")}</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">{t("home.title")}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("home.intro")}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/request"
            className="block rounded-md border border-border p-6 transition hover:border-foreground/40 hover:bg-accent"
          >
            <h3 className="text-base font-medium">{t("home.new.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.new.desc")}</p>
          </Link>
          <Link
            to="/track"
            className="block rounded-md border border-border p-6 transition hover:border-foreground/40 hover:bg-accent"
          >
            <h3 className="text-base font-medium">{t("home.track.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.track.desc")}</p>
          </Link>
        </div>

        <section className="mt-14">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t("home.flow.heading")}
          </h3>
          <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
            {STAGES.map((s, i) => (
              <li key={s} className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">{t("common.stage")} {i + 1}</div>
                <div className="font-medium">{t(`stage.${s}`)}</div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {t("brand.examCell")}
      </footer>
    </div>
  );
}
