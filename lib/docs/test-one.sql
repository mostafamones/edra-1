CREATE TABLE public.academies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.levels (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  name text NOT NULL,
  color text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- renamed from branches
CREATE TABLE public.groups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  level_id bigint NOT NULL REFERENCES public.levels(id),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

--- People

-- instructors is now a pure person entity
-- academy_id is GONE from here
CREATE TABLE public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  original_avatar_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- this table is new — it's the bridge
CREATE TABLE public.academy_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','instructor')),
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  UNIQUE (instructor_id, academy_id)  -- one membership per academy per instructor
);

CREATE TABLE public.instructor_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  invited_by uuid NOT NULL REFERENCES public.instructors(id),
  email text,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  role text NOT NULL DEFAULT 'instructor'
    CHECK (role IN ('admin','instructor')),  -- what role they'll get on accept
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','revoked')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

CREATE TABLE public.students (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  level_id bigint NOT NULL REFERENCES public.levels(id),
  group_id bigint REFERENCES public.groups(id),              -- renamed
  full_name text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','flagged')),
  is_archived boolean DEFAULT false,
  org_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.student_fields (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  name text NOT NULL,
  field_type text NOT NULL
    CHECK (field_type IN ('text','number','date','boolean','phone','select')),
  options jsonb,
  default_country_code text DEFAULT '+20',
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.student_field_values (
  student_id bigint NOT NULL REFERENCES public.students(id),
  field_id bigint NOT NULL REFERENCES public.student_fields(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  value jsonb,
  PRIMARY KEY (student_id, field_id)
);

--- Curriculum

CREATE TABLE public.courses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  level_id bigint REFERENCES public.levels(id),
  group_id bigint REFERENCES public.groups(id),              -- renamed
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','archived')),
  created_by uuid REFERENCES public.instructors(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.enrollments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES public.students(id),
  course_id bigint NOT NULL REFERENCES public.courses(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','dropped')),
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (student_id, course_id)
);

CREATE TABLE public.schedule_groups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  name text NOT NULL,
  level_id bigint REFERENCES public.levels(id),
  group_id bigint REFERENCES public.groups(id),              -- renamed
  min_attendance integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.class_schedules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  course_id bigint REFERENCES public.courses(id),
  level_id bigint REFERENCES public.levels(id),
  group_id bigint REFERENCES public.groups(id),              -- renamed
  schedule_group_id bigint REFERENCES public.schedule_groups(id),
  name text NOT NULL,
  schedule_type text NOT NULL DEFAULT 'recurring'
    CHECK (schedule_type IN ('recurring','one_off')),
  one_off_date date,
  is_mandatory boolean NOT NULL DEFAULT false,
  show_on_form boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.instructors(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.schedule_time_slots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id bigint NOT NULL REFERENCES public.class_schedules(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time,
  instance_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  course_id bigint REFERENCES public.courses(id),
  level_id bigint REFERENCES public.levels(id),
  group_id bigint REFERENCES public.groups(id),              -- renamed
  title text NOT NULL,
  description text,
  weight numeric DEFAULT 1 CHECK (weight >= 0),
  due_date date,
  created_by uuid REFERENCES public.instructors(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.assignment_parts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id bigint NOT NULL REFERENCES public.assignments(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  title text,
  max_mark numeric NOT NULL CHECK (max_mark > 0),
  order_index integer DEFAULT 0
);

--- Activity

CREATE TABLE public.sessions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  schedule_id bigint NOT NULL REFERENCES public.class_schedules(id),
  time_slot_id bigint REFERENCES public.schedule_time_slots(id),
  session_date date NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'live'
    CHECK (status IN ('live','ended','archived')),
  is_cancelled boolean DEFAULT false,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.attendance (
  session_id bigint NOT NULL REFERENCES public.sessions(id),
  student_id bigint NOT NULL REFERENCES public.students(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  status text NOT NULL DEFAULT 'present'
    CHECK (status IN ('present','absent','late','excused')),
  checkin_time timestamptz,
  note text,
  PRIMARY KEY (session_id, student_id)
);

CREATE TABLE public.student_part_marks (
  part_id bigint NOT NULL REFERENCES public.assignment_parts(id),
  student_id bigint NOT NULL REFERENCES public.students(id),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  mark numeric CHECK (mark >= 0),
  excused_marks numeric DEFAULT 0 CHECK (excused_marks >= 0),
  note text,
  PRIMARY KEY (part_id, student_id)
);

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  actor_id uuid,
  actor_role text,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

--- Auth

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz
);

CREATE TABLE public.student_portal_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id),
  student_id bigint NOT NULL REFERENCES public.students(id),
  invited_by uuid NOT NULL REFERENCES public.instructors(id),
  email text NOT NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','revoked')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);