
-- Roles
CREATE TYPE public.app_role AS ENUM ('hod','library','proctor','finance','coe');
CREATE TYPE public.request_status AS ENUM ('pending','approved','denied');
CREATE TYPE public.request_stage AS ENUM ('hod','library','proctor','finance','coe','done');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS SETOF public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Degree requests
CREATE TABLE public.degree_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_no text NOT NULL,
  roll_no text NOT NULL,
  dob date NOT NULL,
  full_name text NOT NULL,
  course text NOT NULL,
  email text,
  phone text,
  status public.request_status NOT NULL DEFAULT 'pending',
  current_stage public.request_stage NOT NULL DEFAULT 'hod',
  denial_reason text,
  denied_stage public.request_stage,
  download_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_no, roll_no)
);
GRANT SELECT, INSERT, UPDATE ON public.degree_requests TO authenticated;
GRANT ALL ON public.degree_requests TO service_role;
ALTER TABLE public.degree_requests ENABLE ROW LEVEL SECURITY;

-- Staff: read all requests, update only when current_stage matches their role
CREATE POLICY "staff read requests" ON public.degree_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "staff update own stage" ON public.degree_requests FOR UPDATE TO authenticated USING (
  (current_stage = 'hod' AND public.has_role(auth.uid(),'hod')) OR
  (current_stage = 'library' AND public.has_role(auth.uid(),'library')) OR
  (current_stage = 'proctor' AND public.has_role(auth.uid(),'proctor')) OR
  (current_stage = 'finance' AND public.has_role(auth.uid(),'finance')) OR
  (current_stage = 'coe' AND public.has_role(auth.uid(),'coe'))
);

-- Approvals log
CREATE TABLE public.request_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.degree_requests(id) ON DELETE CASCADE,
  stage public.request_stage NOT NULL,
  action text NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id),
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.request_approvals TO authenticated;
GRANT ALL ON public.request_approvals TO service_role;
ALTER TABLE public.request_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read approvals" ON public.request_approvals FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);
CREATE POLICY "staff insert approvals" ON public.request_approvals FOR INSERT TO authenticated WITH CHECK (
  actor_id = auth.uid()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_degree_requests_updated BEFORE UPDATE ON public.degree_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
