import { createFileRoute, Link } from "@tanstack/react-router";

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">KMCLU</p>
            <h1 className="text-lg font-semibold">Degree Request Portal</h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/staff" className="text-muted-foreground hover:text-foreground">Staff</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Request your degree certificate</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Submit your details and your request will be verified by each department before your degree is issued. You can track the status anytime using your enrollment number and date of birth.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/request"
            className="block rounded-md border border-border p-6 transition hover:border-foreground/40 hover:bg-accent"
          >
            <h3 className="text-base font-medium">New degree request</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your enrollment number, roll number, date of birth and course to start the verification process.
            </p>
          </Link>
          <Link
            to="/track"
            className="block rounded-md border border-border p-6 transition hover:border-foreground/40 hover:bg-accent"
          >
            <h3 className="text-base font-medium">Track existing request</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check which department is currently reviewing your request, or see the reason it was denied.
            </p>
          </Link>
        </div>

        <section className="mt-14">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Verification flow</h3>
          <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
            {[
              "Head of Department",
              "Library",
              "Proctor Office",
              "Finance",
              "Controller of Examination",
            ].map((step, i) => (
              <li key={step} className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">Stage {i + 1}</div>
                <div className="font-medium">{step}</div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        KMCLU Examination Cell
      </footer>
    </div>
  );
}
