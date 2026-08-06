// Staff / admin accounts for the KMCLU portal.
// Frontend-only today (localStorage); the shape mirrors a Laravel `users`
// table so this can be swapped for POST /api/login + /api/users later.

import { STAGES, type Stage, type DepartmentCode } from "@/lib/store";

export type Role = "admin" | Stage;

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — hashed server-side in production
  role: Role;
  department?: DepartmentCode | null; // required for role "hod"
  active: boolean;
  created_at: string;
};

const USERS_KEY = "kmclu_users_v1";
const SESSION_KEY = "kmclu_session_v1";
const SEED_KEY = "kmclu_users_seeded_v1";

export const ROLE_OPTIONS: Role[] = ["admin", ...STAGES];

function seed(): StaffUser[] {
  const now = new Date().toISOString();
  const u = (
    name: string,
    email: string,
    password: string,
    role: Role,
    department?: DepartmentCode,
  ): StaffUser => ({
    id: crypto.randomUUID(),
    name,
    email,
    password,
    role,
    department: department ?? null,
    active: true,
    created_at: now,
  });
  return [
    u("Registrar (Admin)", "admin@kmclu.ac.in", "admin123", "admin"),
    u("HOD — Computer Science", "hod.cse@kmclu.ac.in", "hod123", "hod", "cse"),
    u("HOD — Mechanical", "hod.me@kmclu.ac.in", "hod123", "hod", "me"),
    u("Library Section", "library@kmclu.ac.in", "staff123", "library"),
    u("Proctor Office", "proctor@kmclu.ac.in", "staff123", "proctor"),
    u("Finance Section", "finance@kmclu.ac.in", "staff123", "finance"),
    u("Hostel Warden", "hostel@kmclu.ac.in", "staff123", "hostel"),
    u("Controller of Examination", "coe@kmclu.ac.in", "staff123", "coe"),
  ];
}

function readUsers(): StaffUser[] {
  if (typeof window === "undefined") return [];
  try {
    if (!localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(seed()));
      localStorage.setItem(SEED_KEY, "1");
    }
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StaffUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(list: StaffUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("kmclu:users"));
}

export function listUsers(): StaffUser[] {
  return readUsers();
}

export function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: DepartmentCode | null;
}): { ok: true; user: StaffUser } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || !input.password.trim()) {
    return { ok: false, error: "Name, email and password are required." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  if (input.role === "hod" && !input.department) {
    return { ok: false, error: "Pick a department for an HOD account." };
  }
  const list = readUsers();
  if (list.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const user: StaffUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    password: input.password,
    role: input.role,
    department: input.role === "hod" ? (input.department ?? null) : null,
    active: true,
    created_at: new Date().toISOString(),
  };
  list.push(user);
  writeUsers(list);
  return { ok: true, user };
}

export function updateUser(
  id: string,
  patch: Partial<Pick<StaffUser, "name" | "email" | "password" | "role" | "department" | "active">>,
): { ok: true } | { ok: false; error: string } {
  const list = readUsers();
  const user = list.find((u) => u.id === id);
  if (!user) return { ok: false, error: "Account not found." };
  if (patch.email) {
    const email = patch.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
    if (list.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
      return { ok: false, error: "An account with this email already exists." };
    }
    user.email = email;
  }
  if (patch.name !== undefined) user.name = patch.name;
  if (patch.password) {
    if (patch.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    user.password = patch.password;
  }
  if (patch.role !== undefined) user.role = patch.role;
  if (patch.department !== undefined) user.department = patch.department;
  if (user.role !== "hod") user.department = null;
  if (user.role === "hod" && !user.department) {
    return { ok: false, error: "Pick a department for an HOD account." };
  }
  if (patch.active !== undefined) user.active = patch.active;
  writeUsers(list);
  return { ok: true };
}

export function deleteUser(id: string): { ok: true } | { ok: false; error: string } {
  const list = readUsers();
  const user = list.find((u) => u.id === id);
  if (!user) return { ok: false, error: "Account not found." };
  if (user.role === "admin" && list.filter((u) => u.role === "admin").length === 1) {
    return { ok: false, error: "At least one admin account must remain." };
  }
  writeUsers(list.filter((u) => u.id !== id));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type Session = { user_id: string; email: string; role: Role };

export function login(
  email: string,
  password: string,
): { ok: true; user: StaffUser } | { ok: false; error: string } {
  const user = readUsers().find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!user) return { ok: false, error: "Invalid email or password." };
  if (!user.active) return { ok: false, error: "This account has been disabled." };
  const session: Session = { user_id: user.id, email: user.email, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, user };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function currentUser(): StaffUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const user = readUsers().find((u) => u.id === session.user_id);
    return user && user.active ? user : null;
  } catch {
    return null;
  }
}
