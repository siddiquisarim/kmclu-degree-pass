import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RoleSchema = z.object({
  role: z.enum(["hod", "library", "proctor", "finance", "coe"]),
  full_name: z.string().trim().min(1).max(120).optional(),
});

// One-time self-assignment of department role after signup (demo).
export const claimStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RoleSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.full_name) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", context.userId);
    }

    // Allow only if user currently has no role.
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId);
    if (existing && existing.length > 0) {
      return { ok: false as const, error: "Your account already has a department assigned." };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: data.role });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: roles } = await context.supabase.rpc("get_my_roles");
    return { profile, roles: (roles ?? []) as string[] };
  });
