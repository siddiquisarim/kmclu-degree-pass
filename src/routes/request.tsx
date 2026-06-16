import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createRequest, findByCredentials } from "@/lib/store";
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
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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
    if (!payload.enrollment_no || !payload.roll_no || !payload.dob || !payload.full_name || !payload.course) {
      setError("Please fill all required fields.");
      return;
    }
    const existing = findByCredentials(payload.enrollment_no, payload.roll_no, payload.dob);
    if (existing && existing.status === "pending") {
      setError("A request with these details is already in progress.");
      return;
    }
    createRequest(payload);
    navigate({
      to: "/track",
      search: { e: payload.enrollment_no, r: payload.roll_no, d: payload.dob },
    });
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

          <Button type="submit" className="mt-2 w-full">Submit request</Button>
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
