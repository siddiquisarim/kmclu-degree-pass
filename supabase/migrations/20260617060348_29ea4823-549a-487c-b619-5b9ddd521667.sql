
-- Tighten degree_requests SELECT: staff only see requests currently at their stage
DROP POLICY IF EXISTS "staff read requests" ON public.degree_requests;
CREATE POLICY "staff read requests at their stage" ON public.degree_requests
FOR SELECT TO authenticated
USING (
  (current_stage = 'hod'::request_stage AND has_role(auth.uid(), 'hod'::app_role))
  OR (current_stage = 'library'::request_stage AND has_role(auth.uid(), 'library'::app_role))
  OR (current_stage = 'proctor'::request_stage AND has_role(auth.uid(), 'proctor'::app_role))
  OR (current_stage = 'finance'::request_stage AND has_role(auth.uid(), 'finance'::app_role))
  OR (current_stage = 'coe'::request_stage AND has_role(auth.uid(), 'coe'::app_role))
);

-- Tighten request_approvals SELECT: only staff with a privileged role can see approvals for their own stage
DROP POLICY IF EXISTS "staff read approvals" ON public.request_approvals;
CREATE POLICY "staff read approvals for their stage" ON public.request_approvals
FOR SELECT TO authenticated
USING (
  (stage = 'hod'::request_stage AND has_role(auth.uid(), 'hod'::app_role))
  OR (stage = 'library'::request_stage AND has_role(auth.uid(), 'library'::app_role))
  OR (stage = 'proctor'::request_stage AND has_role(auth.uid(), 'proctor'::app_role))
  OR (stage = 'finance'::request_stage AND has_role(auth.uid(), 'finance'::app_role))
  OR (stage = 'coe'::request_stage AND has_role(auth.uid(), 'coe'::app_role))
  OR actor_id = auth.uid()
);

-- Revoke EXECUTE on get_my_roles from authenticated (use has_role instead)
REVOKE EXECUTE ON FUNCTION public.get_my_roles() FROM authenticated, anon, PUBLIC;
