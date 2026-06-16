import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitDegreeRequest } from "@/lib/requests.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "New degree request — KMCLU" },
      { name: "description", content: "Submit a new degree certificate request." },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const submit = useServerFn(submitDegreeRequest);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const payload = {
      enrollment_no: String(f.get("enrollment_no") || "").trim(),
      roll_no: String(f.get("roll_no") || "").trim(),
      dob: String(f.get("dob") || ""),
      full_name: String(f.get("full_name") || "").trim(),
      course: String(f.get("course") || "").trim(),
      email: String(f.get("email") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
    };
    try {
      const res = await submit({ data: payload });
      if (!res.ok) {
        setError(res.error);
      } else {
        navigate({
          to: "/track",
          search: {
            e: payload.enrollment_no,
            r: payload.roll_no,
            d: payload.dob,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">KMCLU</p>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-semibold">New degree request</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in your details exactly as on your student records.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4">
          <Field label="Full name" name="full_name" required maxLength={120} />
          <Field label="Enrollment number" name="enrollment_no" required maxLength={40} />
          <Field label="Roll number" name="roll_no" required maxLength={40} />
          <Field label="Date of birth" name="dob" type="date" required />
          <Field label="Course / Programme" name="course" required maxLength={120} placeholder="e.g. B.Tech CSE" />
          <Field label="Email (optional)" name="email" type="email" maxLength={200} />
          <Field label="Phone (optional)" name="phone" maxLength={20} />

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Submitting…" : "Submit request"}
          </Button>
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
