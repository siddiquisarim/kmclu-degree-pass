import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAGES = ["hod", "library", "proctor", "finance", "coe", "done"] as const;
type Stage = (typeof STAGES)[number];

const NEXT: Record<Stage, Stage> = {
  hod: "library",
  library: "proctor",
  proctor: "finance",
  finance: "coe",
  coe: "done",
  done: "done",
};

const STAGE_LABEL: Record<Stage, string> = {
  hod: "Head of Department",
  library: "Library",
  proctor: "Proctor Office",
  finance: "Finance",
  coe: "Controller of Examination",
  done: "Completed",
};

const SubmitSchema = z.object({
  enrollment_no: z.string().trim().min(2).max(40),
  roll_no: z.string().trim().min(1).max(40),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  full_name: z.string().trim().min(2).max(120),
  course: z.string().trim().min(1).max(120),
  email: z.string().email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export const submitDegreeRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("degree_requests")
      .select("id,status,current_stage")
      .eq("enrollment_no", data.enrollment_no)
      .eq("roll_no", data.roll_no)
      .maybeSingle();

    if (existing) {
      return { ok: false as const, error: "A request with this enrollment and roll number already exists." };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("degree_requests")
      .insert({
        enrollment_no: data.enrollment_no,
        roll_no: data.roll_no,
        dob: data.dob,
        full_name: data.full_name,
        course: data.course,
        email: data.email || null,
        phone: data.phone || null,
      })
      .select("id")
      .single();

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: inserted.id };
  });

const TrackSchema = z.object({
  enrollment_no: z.string().trim().min(1),
  roll_no: z.string().trim().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const trackDegreeRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TrackSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("degree_requests")
      .select("*")
      .eq("enrollment_no", data.enrollment_no)
      .eq("roll_no", data.roll_no)
      .eq("dob", data.dob)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    if (!row) return { ok: false as const, error: "No matching request found. Check your details." };

    const { data: history } = await supabaseAdmin
      .from("request_approvals")
      .select("stage,action,note,actor_name,created_at")
      .eq("request_id", row.id)
      .order("created_at", { ascending: true });

    return {
      ok: true as const,
      request: row,
      history: history ?? [],
      stage_label: STAGE_LABEL[row.current_stage as Stage],
    };
  });

// Staff: list requests at my stage
export const listStageRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase.rpc("get_my_roles");
    const myRoles = (roles ?? []) as Stage[];
    if (myRoles.length === 0) return { roles: [], pending: [], history: [] };

    const { data: pending } = await context.supabase
      .from("degree_requests")
      .select("*")
      .in("current_stage", myRoles)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const { data: history } = await context.supabase
      .from("request_approvals")
      .select("*, degree_requests!inner(enrollment_no, roll_no, full_name)")
      .in("stage", myRoles)
      .order("created_at", { ascending: false })
      .limit(50);

    return { roles: myRoles, pending: pending ?? [], history: history ?? [] };
  });

const ActSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(["approve", "deny"]),
  note: z.string().max(500).optional(),
});

export const actOnRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ActSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: req, error: reqErr } = await context.supabase
      .from("degree_requests")
      .select("*")
      .eq("id", data.request_id)
      .maybeSingle();
    if (reqErr || !req) return { ok: false as const, error: "Request not found." };

    const { data: roles } = await context.supabase.rpc("get_my_roles");
    const myRoles = (roles ?? []) as Stage[];
    if (!myRoles.includes(req.current_stage as Stage)) {
      return { ok: false as const, error: "You are not authorized to act on this request at this stage." };
    }
    if (req.status !== "pending") {
      return { ok: false as const, error: "Request is no longer pending." };
    }

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", context.userId)
      .maybeSingle();
    const actorName = profile?.full_name || profile?.email || "Staff";

    if (data.action === "approve") {
      const next = NEXT[req.current_stage as Stage];
      const isFinal = next === "done";
      const update: Record<string, unknown> = { current_stage: next };
      if (isFinal) {
        update.status = "approved";
        update.download_url = `/api/public/degree/${req.id}.pdf`;
      }
      const { error: upErr } = await context.supabase
        .from("degree_requests")
        .update(update)
        .eq("id", req.id);
      if (upErr) return { ok: false as const, error: upErr.message };

      await context.supabase.from("request_approvals").insert({
        request_id: req.id,
        stage: req.current_stage,
        action: "approved",
        note: data.note || null,
        actor_id: context.userId,
        actor_name: actorName,
      });
      return { ok: true as const };
    } else {
      const { error: upErr } = await context.supabase
        .from("degree_requests")
        .update({
          status: "denied",
          denied_stage: req.current_stage,
          denial_reason: data.note || "No reason provided.",
        })
        .eq("id", req.id);
      if (upErr) return { ok: false as const, error: upErr.message };

      await context.supabase.from("request_approvals").insert({
        request_id: req.id,
        stage: req.current_stage,
        action: "denied",
        note: data.note || null,
        actor_id: context.userId,
        actor_name: actorName,
      });
      return { ok: true as const };
    }
  });
