// Frontend store for KMCLU degree-request workflow.
// Persists to localStorage today; the shape mirrors what a Laravel
// backend would expose so the UI can later swap `read/write` with
// REST calls (e.g. GET /api/requests, POST /api/requests, POST
// /api/requests/{id}/actions) without changing components.

export const STAGES = ["hod", "library", "proctor", "finance", "coe"] as const;
export type Stage = (typeof STAGES)[number];
export type Status = "pending" | "approved" | "denied";

export const STAGE_LABEL: Record<string, string> = {
  hod: "Head of Department",
  library: "Library",
  proctor: "Proctor Office",
  finance: "Finance",
  coe: "Controller of Examination",
  done: "Completed",
};

// Departments — one HOD per department. Course -> department mapping below
// is what routes a request to the correct HOD queue.
export const DEPARTMENTS = [
  { code: "cse", name: "Computer Science & Engineering" },
  { code: "ece", name: "Electronics & Communication" },
  { code: "me",  name: "Mechanical Engineering" },
  { code: "ce",  name: "Civil Engineering" },
  { code: "ba",  name: "Business Administration" },
  { code: "sci", name: "Sciences" },
  { code: "hum", name: "Humanities" },
] as const;
export type DepartmentCode = (typeof DEPARTMENTS)[number]["code"];

export const DEPARTMENT_LABEL: Record<string, string> =
  Object.fromEntries(DEPARTMENTS.map((d) => [d.code, d.name]));

// Course catalogue. `dept` decides which HOD receives the request.
export const COURSES: { code: string; name: string; dept: DepartmentCode }[] = [
  { code: "btech-cse", name: "B.Tech — Computer Science",       dept: "cse" },
  { code: "btech-ece", name: "B.Tech — Electronics & Comm.",    dept: "ece" },
  { code: "btech-me",  name: "B.Tech — Mechanical",             dept: "me"  },
  { code: "btech-ce",  name: "B.Tech — Civil",                  dept: "ce"  },
  { code: "mba",       name: "MBA",                             dept: "ba"  },
  { code: "bba",       name: "BBA",                             dept: "ba"  },
  { code: "bsc-phy",   name: "B.Sc — Physics",                  dept: "sci" },
  { code: "bsc-math",  name: "B.Sc — Mathematics",              dept: "sci" },
  { code: "ba-eng",    name: "B.A — English",                   dept: "hum" },
];

export function courseByCode(code: string) {
  return COURSES.find((c) => c.code === code);
}

// Preset denial reasons per stage — no free-typing.
export const DENIAL_REASONS: Record<Stage, string[]> = {
  hod: [
    "Student records incomplete in department",
    "Pending internal marks not submitted",
    "Course completion not verified by department",
    "Mismatch in enrollment details",
  ],
  library: [
    "Library books not returned",
    "Outstanding library fine pending",
    "Library no-dues form not submitted",
  ],
  proctor: [
    "Disciplinary case pending",
    "Hostel no-dues not cleared",
    "Identity card not surrendered",
  ],
  finance: [
    "Tuition fee balance pending",
    "Examination fee not paid",
    "Refundable caution money form missing",
  ],
  coe: [
    "Examination records incomplete",
    "Grade sheet discrepancy — visit COE office",
    "Result withheld pending re-evaluation",
  ],
};

export type HistoryEntry = {
  stage: Stage;
  action: "approved" | "denied";
  reason?: string; // preset reason text when denied
  created_at: string;
};

export type DegreeRequest = {
  id: string;
  enrollment_no: string;
  roll_no: string;
  dob: string;
  full_name: string;
  course_code: string;     // e.g. "btech-cse"
  course_name: string;     // denormalised for display
  department: DepartmentCode; // routes HOD stage
  email?: string;
  phone?: string;
  status: Status;
  current_stage: Stage | "done";
  denied_stage?: Stage | null;
  denial_reason?: string | null;
  download_url?: string | null;
  created_at: string;
  updated_at: string;
  history: HistoryEntry[];
};

const KEY = "kmclu_requests_v1";

function read(): DegreeRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DegreeRequest[]) : [];
  } catch {
    return [];
  }
}

function write(list: DegreeRequest[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("kmclu:changed"));
}

export function listAll(): DegreeRequest[] {
  return read();
}

// Generic stage queue (library/proctor/finance/coe).
export function listByStage(stage: Stage): DegreeRequest[] {
  return read().filter((r) => r.status === "pending" && r.current_stage === stage);
}

// HOD queue is scoped to a single department.
export function listForHod(department: DepartmentCode): DegreeRequest[] {
  return read().filter(
    (r) => r.status === "pending" && r.current_stage === "hod" && r.department === department,
  );
}

export function findByCredentials(enrollment_no: string, roll_no: string, dob: string) {
  return read().find(
    (r) =>
      r.enrollment_no.toLowerCase() === enrollment_no.toLowerCase() &&
      r.roll_no.toLowerCase() === roll_no.toLowerCase() &&
      r.dob === dob,
  );
}

export function findById(id: string) {
  return read().find((r) => r.id === id);
}

export function createRequest(input: {
  enrollment_no: string;
  roll_no: string;
  dob: string;
  full_name: string;
  course_code: string;
  email?: string;
  phone?: string;
}): { ok: true; request: DegreeRequest } | { ok: false; error: string } {
  const course = courseByCode(input.course_code);
  if (!course) return { ok: false, error: "Invalid course selection." };

  const now = new Date().toISOString();
  const req: DegreeRequest = {
    id: crypto.randomUUID(),
    enrollment_no: input.enrollment_no,
    roll_no: input.roll_no,
    dob: input.dob,
    full_name: input.full_name,
    course_code: course.code,
    course_name: course.name,
    department: course.dept,
    email: input.email,
    phone: input.phone,
    status: "pending",
    current_stage: "hod",
    created_at: now,
    updated_at: now,
    history: [],
  };
  const list = read();
  list.unshift(req);
  write(list);
  return { ok: true, request: req };
}

const NEXT: Record<Stage, Stage | "done"> = {
  hod: "library",
  library: "proctor",
  proctor: "finance",
  finance: "coe",
  coe: "done",
};

export function actOn(
  id: string,
  stage: Stage,
  action: "approve" | "deny",
  reason?: string,
) {
  const list = read();
  const req = list.find((r) => r.id === id);
  if (!req) return { ok: false as const, error: "Request not found" };
  if (req.status !== "pending") return { ok: false as const, error: "Already resolved" };
  if (req.current_stage !== stage) return { ok: false as const, error: "Not at your stage" };

  const now = new Date().toISOString();
  if (action === "deny") {
    if (!reason || !DENIAL_REASONS[stage].includes(reason)) {
      return { ok: false as const, error: "Please pick a valid denial reason." };
    }
    req.status = "denied";
    req.denied_stage = stage;
    req.denial_reason = reason;
    req.history.push({ stage, action: "denied", reason, created_at: now });
  } else {
    req.history.push({ stage, action: "approved", created_at: now });
    const next = NEXT[stage];
    req.current_stage = next;
    if (next === "done") {
      req.status = "approved";
      req.download_url = `/degree/${req.id}`;
    }
  }
  req.updated_at = now;
  write(list);
  return { ok: true as const, request: req };
}

export function resetAll() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("kmclu:changed"));
  }
}
