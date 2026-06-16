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

export type HistoryEntry = {
  stage: Stage;
  action: "approved" | "denied";
  note?: string;
  created_at: string;
};

export type DegreeRequest = {
  id: string;
  enrollment_no: string;
  roll_no: string;
  dob: string;
  full_name: string;
  course: string;
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

export function listByStage(stage: Stage): DegreeRequest[] {
  return read().filter((r) => r.status === "pending" && r.current_stage === stage);
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

export function createRequest(input: Omit<DegreeRequest, "id" | "status" | "current_stage" | "created_at" | "updated_at" | "history">): DegreeRequest {
  const now = new Date().toISOString();
  const req: DegreeRequest = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending",
    current_stage: "hod",
    created_at: now,
    updated_at: now,
    history: [],
  };
  const list = read();
  list.unshift(req);
  write(list);
  return req;
}

const NEXT: Record<Stage, Stage | "done"> = {
  hod: "library",
  library: "proctor",
  proctor: "finance",
  finance: "coe",
  coe: "done",
};

export function actOn(id: string, stage: Stage, action: "approve" | "deny", note?: string) {
  const list = read();
  const req = list.find((r) => r.id === id);
  if (!req) return { ok: false as const, error: "Request not found" };
  if (req.status !== "pending") return { ok: false as const, error: "Already resolved" };
  if (req.current_stage !== stage) return { ok: false as const, error: "Not at your stage" };

  const now = new Date().toISOString();
  if (action === "deny") {
    req.status = "denied";
    req.denied_stage = stage;
    req.denial_reason = note || "No reason provided";
    req.history.push({ stage, action: "denied", note, created_at: now });
  } else {
    req.history.push({ stage, action: "approved", note, created_at: now });
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
