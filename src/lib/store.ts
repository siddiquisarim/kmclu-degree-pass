// Frontend store for the KMCLU document-request workflow.
// Persists to localStorage today; the shape mirrors what a Laravel
// backend would expose so the UI can later swap `read/write` with
// REST calls (e.g. GET /api/requests, POST /api/requests, POST
// /api/requests/{id}/actions) without changing components.

export const STAGES = ["hod", "library", "proctor", "payment", "finance", "hostel", "coe"] as const;
export type Stage = (typeof STAGES)[number];
export type Status = "pending" | "approved" | "denied";

export const STAGE_LABEL: Record<string, string> = {
  hod: "Head of Department",
  library: "Library",
  proctor: "Proctor Office",
  payment: "Fee Payment",
  finance: "Finance",
  hostel: "Hostel",
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

// ---------------------------------------------------------------------------
// Document / service catalogue
// ---------------------------------------------------------------------------

export const DOC_TYPES = [
  "passport_photo",
  "marksheets_all",
  "final_sem_marksheet",
  "highschool_marksheet",
  "intermediate_marksheet",
  "marksheet_to_correct",
  "degree_copy",
  "fee_receipt",
  "fir_copy",
  "affidavit",
  "application",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export type ServiceCode =
  | "degree"
  | "transfer_certificate"
  | "character_certificate"
  | "transcript"
  | "bonafide"
  | "provisional_degree"
  | "diploma_certificate"
  | "medium_certificate"
  | "marksheet_correction"
  | "degree_correction"
  | "duplicate_marksheet"
  | "duplicate_degree";

export type ServiceGroup = "certificates" | "corrections";

export type Service = {
  code: ServiceCode;
  name: string;
  group: ServiceGroup;
  fee: number;              // flat fee in INR (0 = free)
  fee_per_semester?: number; // when set, fee = fee_per_semester * semesters
  stages: Stage[];           // base verification flow
  optional_hostel?: boolean; // hostel stage added only for hostel residents
  documents: DocType[];      // documents the student must attach
};

const FULL_FLOW: Stage[] = ["hod", "library", "proctor", "payment", "finance", "coe"];

export const SERVICES: Service[] = [
  {
    code: "degree",
    name: "Degree Certificate",
    group: "certificates",
    fee: 0,
    stages: FULL_FLOW,
    documents: ["passport_photo", "final_sem_marksheet"],
  },
  {
    code: "transfer_certificate",
    name: "Transfer Certificate (Migration)",
    group: "certificates",
    fee: 500,
    stages: ["hod", "library", "proctor", "payment", "finance", "coe"],
    optional_hostel: true,
    documents: ["passport_photo", "final_sem_marksheet", "application"],
  },
  {
    code: "character_certificate",
    name: "Character Certificate",
    group: "certificates",
    fee: 0,
    stages: ["hod", "library", "proctor", "payment", "finance", "coe"],
    optional_hostel: true,
    documents: ["passport_photo", "final_sem_marksheet", "application"],
  },
  {
    code: "transcript",
    name: "Transcript",
    group: "certificates",
    fee: 2000,
    stages: ["coe"],
    documents: ["passport_photo", "marksheets_all"],
  },
  {
    code: "bonafide",
    name: "Bonafide Certificate",
    group: "certificates",
    fee: 0,
    stages: ["coe"],
    documents: ["passport_photo", "fee_receipt"],
  },
  {
    code: "provisional_degree",
    name: "Provisional Degree",
    group: "certificates",
    fee: 300,
    stages: ["coe"],
    documents: ["passport_photo", "final_sem_marksheet"],
  },
  {
    code: "diploma_certificate",
    name: "Diploma Certificate",
    group: "certificates",
    fee: 0,
    stages: ["coe"],
    documents: ["passport_photo", "final_sem_marksheet"],
  },
  {
    code: "medium_certificate",
    name: "Medium Certificate",
    group: "certificates",
    fee: 0,
    stages: ["coe"],
    documents: ["passport_photo", "final_sem_marksheet"],
  },
  {
    code: "marksheet_correction",
    name: "Marksheet Correction",
    group: "corrections",
    fee: 0,
    fee_per_semester: 300,
    stages: ["coe"],
    documents: [
      "passport_photo",
      "highschool_marksheet",
      "intermediate_marksheet",
      "marksheet_to_correct",
    ],
  },
  {
    code: "degree_correction",
    name: "Degree Name Correction",
    group: "corrections",
    fee: 0,
    stages: ["coe"],
    documents: ["passport_photo", "degree_copy", "highschool_marksheet", "intermediate_marksheet"],
  },
  {
    code: "duplicate_marksheet",
    name: "Duplicate Marksheet",
    group: "corrections",
    fee: 1000,
    stages: ["coe"],
    documents: ["passport_photo", "application"],
  },
  {
    code: "duplicate_degree",
    name: "Duplicate Degree",
    group: "corrections",
    fee: 1200,
    stages: ["coe"],
    documents: ["passport_photo", "fir_copy", "affidavit", "application"],
  },
];

export function serviceByCode(code: string) {
  return SERVICES.find((s) => s.code === code);
}

export function serviceFee(service: Service, semesters = 1) {
  if (service.fee_per_semester) return service.fee_per_semester * Math.max(1, semesters);
  return service.fee;
}

export function resolveStages(service: Service, hostel_resident?: boolean): Stage[] {
  if (!service.optional_hostel || !hostel_resident) return [...service.stages];
  // hostel clearance sits after finance, before COE
  const stages = [...service.stages];
  const i = stages.indexOf("coe");
  stages.splice(i < 0 ? stages.length : i, 0, "hostel");
  return stages;
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
  payment: [
    "Online payment failed or reversed",
    "Payment reference could not be verified",
  ],
  finance: [
    "Tuition fee balance pending",
    "Examination fee not paid",
    "Service fee not paid",
  ],
  hostel: [
    "Hostel room not vacated",
    "Hostel dues pending",
    "Hostel property damage charges pending",
  ],
  coe: [
    "Examination records incomplete",
    "Grade sheet discrepancy — visit COE office",
    "Result withheld pending re-evaluation",
    "Submitted documents unclear or incomplete",
  ],
};

export type HistoryEntry = {
  stage: Stage;
  action: "approved" | "denied";
  reason?: string; // preset reason text when denied
  created_at: string;
};

export type AttachedDocument = {
  doc_type: DocType;
  name: string;
  size: number;
  data_url?: string | null;
};

export type DegreeRequest = {
  id: string;
  service_code: ServiceCode;
  service_name: string;    // denormalised for display
  fee: number;             // computed at submission time
  semesters?: number | null; // for per-semester priced services
  hostel_resident?: boolean;
  documents: AttachedDocument[];
  stages: Stage[];         // the flow this request follows
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
  certificate_name?: string | null;
  certificate_data_url?: string | null;
  created_at: string;
  updated_at: string;
  history: HistoryEntry[];
};

const KEY = "kmclu_requests_v2";
const SEED_KEY = "kmclu_requests_seeded_v2";

function read(): DegreeRequest[] {
  if (typeof window === "undefined") return [];
  try {
    if (!localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(KEY, JSON.stringify(buildMockData()));
      localStorage.setItem(SEED_KEY, "1");
    }
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DegreeRequest[]) : [];
  } catch {
    return [];
  }
}

function buildMockData(): DegreeRequest[] {
  const now = Date.now();
  const iso = (offsetHours: number) =>
    new Date(now - offsetHours * 3600_000).toISOString();

  const mk = (p: {
    service_code: ServiceCode;
    enrollment_no: string;
    roll_no: string;
    dob: string;
    full_name: string;
    course_code: string;
    email?: string;
    phone?: string;
    status: Status;
    current_stage: Stage | "done";
    hostel_resident?: boolean;
    semesters?: number;
    denied_stage?: Stage;
    denial_reason?: string;
    created_h: number;
    updated_h: number;
    history: HistoryEntry[];
  }): DegreeRequest => {
    const course = courseByCode(p.course_code)!;
    const service = serviceByCode(p.service_code)!;
    return {
      id: crypto.randomUUID(),
      service_code: service.code,
      service_name: service.name,
      fee: serviceFee(service, p.semesters ?? 1),
      semesters: p.semesters ?? null,
      hostel_resident: p.hostel_resident ?? false,
      documents: service.documents.map((d) => ({
        doc_type: d,
        name: `${d}.pdf`,
        size: 240_000,
        data_url: null,
      })),
      stages: resolveStages(service, p.hostel_resident),
      enrollment_no: p.enrollment_no,
      roll_no: p.roll_no,
      dob: p.dob,
      full_name: p.full_name,
      course_code: p.course_code,
      course_name: course.name,
      department: course.dept,
      email: p.email,
      phone: p.phone,
      status: p.status,
      current_stage: p.current_stage,
      denied_stage: p.denied_stage ?? null,
      denial_reason: p.denial_reason ?? null,
      download_url: null,
      created_at: iso(p.created_h),
      updated_at: iso(p.updated_h),
      history: p.history,
    };
  };

  return [
    mk({
      service_code: "degree",
      enrollment_no: "KMCLU2020CSE001", roll_no: "CSE-101", dob: "2001-03-14",
      full_name: "Aarav Sharma", course_code: "btech-cse",
      email: "aarav.sharma@example.com", phone: "+91 90000 11111",
      status: "pending", current_stage: "hod",
      created_h: 3, updated_h: 3, history: [],
    }),
    mk({
      service_code: "transfer_certificate",
      enrollment_no: "KMCLU2020ECE014", roll_no: "ECE-214", dob: "2000-11-02",
      full_name: "Priya Verma", course_code: "btech-ece",
      email: "priya.v@example.com", hostel_resident: true,
      status: "pending", current_stage: "hod",
      created_h: 8, updated_h: 8, history: [],
    }),
    mk({
      service_code: "character_certificate",
      enrollment_no: "KMCLU2019ME022", roll_no: "ME-322", dob: "2000-07-19",
      full_name: "Rohan Iyer", course_code: "btech-me",
      status: "pending", current_stage: "library",
      created_h: 26, updated_h: 20,
      history: [{ stage: "hod", action: "approved", created_at: iso(20) }],
    }),
    mk({
      service_code: "degree",
      enrollment_no: "KMCLU2020BA007", roll_no: "MBA-107", dob: "1999-01-30",
      full_name: "Neha Kapoor", course_code: "mba",
      phone: "+91 98888 22233",
      status: "pending", current_stage: "proctor",
      created_h: 48, updated_h: 30,
      history: [
        { stage: "hod", action: "approved", created_at: iso(40) },
        { stage: "library", action: "approved", created_at: iso(30) },
      ],
    }),
    mk({
      service_code: "transfer_certificate",
      enrollment_no: "KMCLU2019SCI010", roll_no: "PHY-210", dob: "2000-05-05",
      full_name: "Ishaan Gupta", course_code: "bsc-phy",
      hostel_resident: true,
      status: "pending", current_stage: "hostel",
      created_h: 72, updated_h: 40,
      history: [
        { stage: "hod", action: "approved", created_at: iso(70) },
        { stage: "library", action: "approved", created_at: iso(64) },
        { stage: "proctor", action: "approved", created_at: iso(56) },
        { stage: "finance", action: "approved", created_at: iso(40) },
      ],
    }),
    mk({
      service_code: "transcript",
      enrollment_no: "KMCLU2019SCI045", roll_no: "MATH-245", dob: "1999-09-12",
      full_name: "Sana Ali", course_code: "bsc-math",
      email: "sana.ali@example.com",
      status: "pending", current_stage: "coe",
      created_h: 96, updated_h: 50, history: [],
    }),
    mk({
      service_code: "bonafide",
      enrollment_no: "KMCLU2021CSE077", roll_no: "CSE-177", dob: "2002-06-21",
      full_name: "Tanvi Joshi", course_code: "btech-cse",
      status: "pending", current_stage: "coe",
      created_h: 12, updated_h: 12, history: [],
    }),
    mk({
      service_code: "marksheet_correction",
      enrollment_no: "KMCLU2020CE045", roll_no: "CE-345", dob: "2001-08-09",
      full_name: "Devansh Rao", course_code: "btech-ce",
      semesters: 2,
      status: "pending", current_stage: "coe",
      created_h: 30, updated_h: 30, history: [],
    }),
    mk({
      service_code: "duplicate_degree",
      enrollment_no: "KMCLU2016HUM019", roll_no: "ENG-119", dob: "1996-10-04",
      full_name: "Ritu Bansal", course_code: "ba-eng",
      status: "pending", current_stage: "coe",
      created_h: 40, updated_h: 40, history: [],
    }),
    mk({
      service_code: "degree",
      enrollment_no: "KMCLU2019CE033", roll_no: "CE-333", dob: "2000-02-25",
      full_name: "Karan Mehta", course_code: "btech-ce",
      status: "denied", current_stage: "library",
      denied_stage: "library", denial_reason: "Outstanding library fine pending",
      created_h: 120, updated_h: 90,
      history: [
        { stage: "hod", action: "approved", created_at: iso(110) },
        { stage: "library", action: "denied", reason: "Outstanding library fine pending", created_at: iso(90) },
      ],
    }),
    mk({
      service_code: "provisional_degree",
      enrollment_no: "KMCLU2019HUM008", roll_no: "ENG-108", dob: "1999-12-01",
      full_name: "Meera Nair", course_code: "ba-eng",
      status: "denied", current_stage: "coe",
      denied_stage: "coe", denial_reason: "Submitted documents unclear or incomplete",
      created_h: 150, updated_h: 60,
      history: [
        { stage: "coe", action: "denied", reason: "Submitted documents unclear or incomplete", created_at: iso(60) },
      ],
    }),
    (() => {
      const r = mk({
        service_code: "degree",
        enrollment_no: "KMCLU2018CSE099", roll_no: "CSE-199", dob: "1998-04-18",
        full_name: "Vikram Singh", course_code: "btech-cse",
        email: "vikram.s@example.com",
        status: "approved", current_stage: "done",
        created_h: 200, updated_h: 20,
        history: [
          { stage: "hod", action: "approved", created_at: iso(190) },
          { stage: "library", action: "approved", created_at: iso(180) },
          { stage: "proctor", action: "approved", created_at: iso(150) },
          { stage: "finance", action: "approved", created_at: iso(100) },
          { stage: "coe", action: "approved", created_at: iso(20) },
        ],
      });
      r.download_url = `/document/${r.id}`;
      return r;
    })(),
  ];
}

function write(list: DegreeRequest[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // localStorage quota — drop attachment payloads and keep the metadata.
    const slim = list.map((r) => ({
      ...r,
      documents: r.documents.map((d) => ({ ...d, data_url: null })),
    }));
    try {
      localStorage.setItem(KEY, JSON.stringify(slim));
    } catch {
      /* give up silently; in production this is a Laravel API call */
    }
  }
  window.dispatchEvent(new Event("kmclu:changed"));
}

export function listAll(): DegreeRequest[] {
  return read();
}

// Generic stage queue (library/proctor/finance/hostel/coe).
export function listByStage(stage: Stage): DegreeRequest[] {
  return read().filter((r) => r.status === "pending" && r.current_stage === stage);
}

// HOD queue is scoped to a single department.
export function listForHod(department: DepartmentCode): DegreeRequest[] {
  return read().filter(
    (r) => r.status === "pending" && r.current_stage === "hod" && r.department === department,
  );
}

export function listByCredentials(enrollment_no: string, roll_no: string, dob: string) {
  return read().filter(
    (r) =>
      r.enrollment_no.toLowerCase() === enrollment_no.trim().toLowerCase() &&
      r.roll_no.toLowerCase() === roll_no.trim().toLowerCase() &&
      r.dob === dob,
  );
}

export function findByCredentials(enrollment_no: string, roll_no: string, dob: string) {
  return listByCredentials(enrollment_no, roll_no, dob)[0];
}

export function findPendingForService(
  enrollment_no: string,
  roll_no: string,
  dob: string,
  service_code: ServiceCode,
) {
  return listByCredentials(enrollment_no, roll_no, dob).find(
    (r) => r.service_code === service_code && r.status === "pending",
  );
}

export function findById(id: string) {
  return read().find((r) => r.id === id);
}

export function createRequest(input: {
  service_code: string;
  enrollment_no: string;
  roll_no: string;
  dob: string;
  full_name: string;
  course_code: string;
  email?: string;
  phone?: string;
  hostel_resident?: boolean;
  semesters?: number;
  documents?: AttachedDocument[];
}): { ok: true; request: DegreeRequest } | { ok: false; error: string } {
  const course = courseByCode(input.course_code);
  if (!course) return { ok: false, error: "Invalid course selection." };
  const service = serviceByCode(input.service_code);
  if (!service) return { ok: false, error: "Invalid service selection." };

  const missing = service.documents.filter(
    (d) => !(input.documents ?? []).some((x) => x.doc_type === d),
  );
  if (missing.length > 0) return { ok: false, error: "Please attach all required documents." };

  const stages = resolveStages(service, input.hostel_resident);
  const now = new Date().toISOString();
  const req: DegreeRequest = {
    id: crypto.randomUUID(),
    service_code: service.code,
    service_name: service.name,
    fee: serviceFee(service, input.semesters ?? 1),
    semesters: service.fee_per_semester ? (input.semesters ?? 1) : null,
    hostel_resident: input.hostel_resident ?? false,
    documents: input.documents ?? [],
    stages,
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
    current_stage: stages[0],
    created_at: now,
    updated_at: now,
    history: [],
  };
  const list = read();
  list.unshift(req);
  write(list);
  return { ok: true, request: req };
}

function nextStage(req: DegreeRequest, stage: Stage): Stage | "done" {
  const i = req.stages.indexOf(stage);
  const next = req.stages[i + 1];
  return next ?? "done";
}

export function actOn(
  id: string,
  stage: Stage,
  action: "approve" | "deny",
  reason?: string,
  extras?: { certificate_name?: string; certificate_data_url?: string },
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
    if (stage === "coe" && (!extras?.certificate_data_url || !extras?.certificate_name)) {
      return { ok: false as const, error: "Please upload the document before approving." };
    }
    req.history.push({ stage, action: "approved", created_at: now });
    const next = nextStage(req, stage);
    req.current_stage = next;
    if (next === "done") {
      req.status = "approved";
      req.download_url = `/document/${req.id}`;
      if (extras?.certificate_data_url && extras?.certificate_name) {
        req.certificate_name = extras.certificate_name;
        req.certificate_data_url = extras.certificate_data_url;
      }
    }
  }
  req.updated_at = now;
  write(list);
  return { ok: true as const, request: req };
}

// Student-side payment step. Replace PAYMENT_GATEWAY_URL with the real
// gateway checkout URL (or POST to the Laravel endpoint that creates an
// order) once the merchant account is live.
export const PAYMENT_GATEWAY_URL = "https://example-payment-gateway.test/checkout";

export function markPaid(id: string, reference?: string) {
  const list = read();
  const req = list.find((r) => r.id === id);
  if (!req) return { ok: false as const, error: "Request not found" };
  if (req.current_stage !== "payment") return { ok: false as const, error: "Payment not due" };
  const now = new Date().toISOString();
  req.history.push({
    stage: "payment",
    action: "approved",
    reason: reference ? `Payment reference ${reference}` : undefined,
    created_at: now,
  });
  req.current_stage = nextStage(req, "payment");
  req.updated_at = now;
  write(list);
  return { ok: true as const, request: req };
}

// ---------------------------------------------------------------------------
// Admin overrides — full control over any request, at any stage.
// ---------------------------------------------------------------------------

export type AdminPatch = Partial<
  Pick<
    DegreeRequest,
    | "full_name"
    | "enrollment_no"
    | "roll_no"
    | "dob"
    | "email"
    | "phone"
    | "fee"
    | "status"
    | "current_stage"
    | "denied_stage"
    | "denial_reason"
    | "certificate_name"
    | "certificate_data_url"
    | "download_url"
  >
>;

export function adminUpdateRequest(id: string, patch: AdminPatch) {
  const list = read();
  const req = list.find((r) => r.id === id);
  if (!req) return { ok: false as const, error: "Request not found" };
  Object.assign(req, patch);
  if (req.status === "approved") {
    req.current_stage = "done";
    req.denied_stage = null;
    req.denial_reason = null;
    if (!req.download_url) req.download_url = `/document/${req.id}`;
  }
  if (req.status === "pending") {
    req.denied_stage = null;
    req.denial_reason = null;
    if (req.current_stage === "done") req.current_stage = req.stages[req.stages.length - 1]!;
  }
  if (req.status === "denied" && !req.denied_stage) {
    req.denied_stage = req.current_stage === "done" ? req.stages[req.stages.length - 1]! : req.current_stage;
  }
  req.updated_at = new Date().toISOString();
  write(list);
  return { ok: true as const, request: req };
}

// Force a request to a specific stage (admin only), logging the override.
export function adminSetStage(id: string, stage: Stage | "done") {
  const list = read();
  const req = list.find((r) => r.id === id);
  if (!req) return { ok: false as const, error: "Request not found" };
  req.current_stage = stage;
  req.status = stage === "done" ? "approved" : "pending";
  req.denied_stage = null;
  req.denial_reason = null;
  if (stage === "done" && !req.download_url) req.download_url = `/document/${req.id}`;
  req.updated_at = new Date().toISOString();
  write(list);
  return { ok: true as const, request: req };
}

export function deleteRequest(id: string) {
  const list = read();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return { ok: false as const, error: "Request not found" };
  write(next);
  return { ok: true as const };
}

export function stats() {
  const list = read();
  return {
    total: list.length,
    pending: list.filter((r) => r.status === "pending").length,
    approved: list.filter((r) => r.status === "approved").length,
    denied: list.filter((r) => r.status === "denied").length,
    fees: list.reduce((sum, r) => sum + (r.fee || 0), 0),
    by_stage: Object.fromEntries(
      STAGES.map((s) => [
        s,
        list.filter((r) => r.status === "pending" && r.current_stage === s).length,
      ]),
    ) as Record<Stage, number>,
  };
}

export function resetAll() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SEED_KEY);
    window.dispatchEvent(new Event("kmclu:changed"));
  }
}

