# EDRA V2 — PROJECT CONTEXT FILE

## Overview

**Edra v2** is a **multi-tenant educational academy management SaaS** built on Next.js 16 + Supabase. It allows instructors/academy owners to manage students, courses, class schedules, sessions, attendance, and assignments. There is also a student-facing portal (partially implemented).

**Status:** Active development. Core instructor features (students, schedules, sessions, attendance, assignments) are functional. Student portal, settings tabs (account, integrations, notifications), analytics, and reporting are incomplete/stub.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5.9.3 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password, JWT cookies) |
| UI | shadcn/ui (Radix UI) + TailwindCSS v4 |
| State | Zustand 5 (filter stores) + custom useQuery hook |
| Forms | react-hook-form 7 + Zod 4 |
| Animations | Framer Motion 12 |
| Charts | Recharts 2 |
| Drag & Drop | @dnd-kit/core + sortable |
| Tables | TanStack React Table v8 |
| CSV | PapaParse |
| ID Encoding | Sqids (hash-encoded numeric IDs) |
| AI | Google Gemini AI (assignment descriptions) |
| Storage | Supabase Storage (avatars bucket) |
| Toast | Sonner |
| Icons | Tabler Icons React |

**Fonts:** Outfit (sans), Geist Mono (mono)

---

## Multi-Tenancy Architecture

- Each **Academy** is a tenant identified by UUID and a unique **subdomain**
- URLs: `/(instructor)/[subdomain]/dashboard`, etc.
- Instructors belong to academies via `academy_memberships` with roles: `owner | admin | instructor`
- All DB tables include `academy_id` FK for RLS row isolation
- Auth context resolves active academy from URL subdomain → localStorage → first in list

---

## Directory Structure

```
/
├── app/
│   ├── layout.tsx                  # Root layout (providers)
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Login
│   ├── signup/page.tsx             # Signup success
│   ├── create/page.tsx             # Academy creation wizard
│   ├── (instructor)/[subdomain]/
│   │   ├── dashboard/page.tsx      # Main dashboard (mostly empty)
│   │   ├── settings/page.tsx       # Settings
│   │   ├── students/page.tsx       # Student list
│   │   ├── students/create/page.tsx
│   │   ├── students/edit/page.tsx  # Bulk edit
│   │   └── students/edit/[id]/page.tsx
│   ├── (student)/
│   │   ├── app/page.tsx            # Student dashboard (stub)
│   │   └── my-courses/page.tsx     # Student courses (stub)
│   └── api/                        # All API routes (see below)
├── components/
│   ├── auth-provider.tsx           # Global auth + academy context
│   ├── ui/                         # shadcn + custom UI components
│   ├── create/                     # Academy creation wizard steps
│   ├── students/                   # Student management components
│   ├── settings/                   # Settings tabs
│   └── navigation/                 # Sidebar nav components
├── lib/
│   ├── hooks/
│   │   ├── use-query.ts            # Generic data fetching + caching
│   │   ├── use-data.ts             # Domain hooks (useStudents, etc.)
│   │   └── use-attendance.ts       # Attendance-specific hook
│   ├── store/
│   │   ├── filters.ts              # Zustand: student + session filters
│   │   └── profile.ts              # Zustand: user profile
│   ├── db/                         # Supabase CRUD functions per entity
│   ├── repositories/               # Server actions (use server)
│   ├── api/
│   │   ├── response.ts             # Standardized API response helpers
│   │   └── validation.ts           # Zod request validation helpers
│   ├── types/
│   │   ├── index.ts                # Extended/relational types
│   │   └── database.ts             # Auto-generated Supabase types
│   ├── hashid.ts                   # Sqids encoding/decoding
│   └── supabase.ts                 # Supabase client init
├── utils/
│   └── supabase/
│       ├── client.ts               # Browser client
│       ├── server.ts               # Server client
│       ├── middleware.ts           # Session refresh
│       └── admin.ts                # Service role client
├── hooks/
│   └── use-mobile.ts               # Responsive breakpoint hook
└── middleware.ts                   # Next.js route protection
```

---

## Database Schema

### Core Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `academies` | id (UUID), name, subdomain, owner_id, icon | Academy tenant |
| `academy_memberships` | id, academy_id, instructor_id, role, is_active | Role assignments |
| `instructors` | id (int), user_id, academy_id, full_name, avatar_url, phone | Instructor profiles |
| `students` | id (int), academy_id, full_name, level_id, group_id, status | Student records |
| `levels` | id (int), academy_id, name, color, is_active | Proficiency levels |
| `groups` | id (int), academy_id, level_id, name, is_active | Student groups per level |
| `student_fields` | id (int), academy_id, name, field_type, options, is_required, order_index | Custom field defs |
| `student_field_values` | academy_id, student_id, field_id, value (JSON) | Custom field values |
| `courses` | id (int), academy_id, title, description, level_id, group_id, status, created_by | Courses |
| `enrollments` | id (int), academy_id, student_id, course_id, status, enrolled_at | Course enrollments |
| `assignments` | id (int), academy_id, course_id, title, description, due_date, weight, created_by | Assignments |
| `assignment_parts` | id (int), assignment_id, academy_id, title, max_mark, order_index | Assignment sub-parts |
| `student_part_marks` | academy_id, assignment_id, part_id, student_id, mark, excused_marks, note | Grades |
| `class_schedules` | id (int), academy_id, name, schedule_type, course_id, level_id, group_id, auto_assign | Schedules |
| `schedule_time_slots` | id (int), schedule_id, day_of_week, start_time, end_time, instance_date | Time blocks |
| `schedule_enrollments` | id (int), academy_id, student_id, schedule_id, enrollment_type | Student↔Schedule |
| `sessions` | id (int), academy_id, schedule_id, session_date, status, name, ended_at, is_cancelled | Class meetings |
| `attendance` | academy_id, student_id, session_id, status, checkin_time, note | Attendance records |
| `instructor_invites` | id (UUID), academy_id, email, token, role, status, expires_at | Invite links |
| `users` | id, email, full_name, avatar_url | Auth user sync |

### Enums

- `StudentStatus`: active, inactive, graduated
- `EnrollmentStatus`: active, completed, dropped
- `AttendanceStatus`: present, late, absent, excused
- `SessionStatus`: scheduled, in_progress, completed, cancelled
- `ScheduleType`: recurring, one_off
- `CourseStatus`: draft, active, archived
- `InstructorRole`: owner, admin, instructor
- `InviteStatus`: pending, accepted, expired
- `DayOfWeek`: mon–sun

### Database Views

- `v_instructor_context` — Instructor with full academy context
- `v_assignment_grades` — Grades per student per assignment
- `v_course_grade_book` — Full gradebook for a course
- `v_course_students` — Students enrolled in course
- `v_session_attendance_sheet` — Session attendance records
- `v_student_attendance_summary` — Aggregate per-student attendance
- `v_student_portal_overview` — Student dashboard data

---

## API Routes

All routes under `/app/api/`. Follow REST conventions with consistent error handling.

### Students
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/students?academyId | List all students with relations |
| POST | /api/students | Create student |
| PATCH | /api/students | Update student |
| DELETE | /api/students?id | Delete student |
| POST | /api/students/bulk | Bulk import with validation + auto-enroll |
| GET | /api/students/[id] | Get single student |
| POST | /api/students/[id]/fields | Save custom field values |
| POST | /api/students/[id]/groups | Enroll in schedule |

### Courses
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST/PATCH/DELETE | /api/courses | Course CRUD |

### Assignments
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/assignments?courseId | List assignments with parts |
| POST | /api/assignments | Create assignment + parts (atomic) |
| GET/PUT/DELETE | /api/assignments/[id] | Single assignment CRUD |
| POST | /api/assignments/[id]/grade | Record grade for student |
| POST | /api/generate-assignment-description | AI-generate description (Gemini) |

### Schedules & Sessions
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | /api/schedules | List/create schedules with time slots |
| GET/PUT/DELETE | /api/schedules/[id] | Single schedule CRUD |
| GET/POST | /api/sessions | List/create sessions |
| GET/PUT/DELETE | /api/sessions/[id] | Single session CRUD |
| POST | /api/sessions/[id]/end | Mark session ended |

### Attendance
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/attendance?sessionId | Get attendance for session |
| POST | /api/attendance | Record attendance (uses hashId) |
| PUT | /api/attendance | Update attendance record |
| DELETE | /api/attendance?studentId&sessionId | Remove record |

### Academy, Profile, Invites
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/academy/me | Current user's academies |
| GET | /api/academy?academyId | Academy details |
| GET/PATCH | /api/profile | User profile |
| POST | /api/profile/avatar | Upload avatar (Supabase Storage) |
| POST | /api/invites/generate | Generate instructor invite token |
| GET | /api/invites?academyId | List invites |
| POST | /api/invites/accept | Accept invite (public) |

### Levels, Groups, Fields, Enrollments, Instructors
All follow standard GET/POST/PATCH/DELETE patterns with `academyId` query param.

---

## Key Components

### Auth & Context
- **`components/auth-provider.tsx`** — Global context: `user`, `session`, `academies`, `activeAcademy`, `academyDetails`. Handles academy resolution from URL/localStorage. Animated loading overlay.

### Academy Creation Wizard (`/components/create/`)
- 4-step stepper with localStorage draft persistence
- Step 1: Basic info (name, subdomain, icon, subject)
- Step 2: Level/group structure with drag-and-drop ordering
- Step 3: Custom field configuration
- Step 4: Review + finalize
- Animated creation overlay with sequential step animations

### Student Management (`/components/students/`)
- **`StudentForm`** — react-hook-form + Zod, dynamic custom fields (text/number/date/boolean/phone), cascading level→group selectors, schedule enrollment
- **`StudentDataTable`** — TanStack Table with search, pagination, column visibility, row selection, bulk actions
- **`StudentImportDialog`** — CSV/JSON bulk import with drag-drop, preview, progress, error reporting

### Settings (`/components/settings/`)
- Tab-based: Academy (structure + fields + details), Account (stub), Team (instructors), Integration (stub), Notifications (stub)

### Navigation
- `academy-switcher.tsx` — Multi-academy switcher
- `nav-main.tsx`, `nav-secondary.tsx`, `nav-user.tsx`, `nav-documents.tsx`

---

## Data Fetching & State

### Custom `useQuery` Hook (`/lib/hooks/use-query.ts`)
- In-memory cache with TTL (5 min default)
- Returns: `{ data, loading, refreshing, error, refresh, setData }`
- Cache invalidation by key prefix

### Domain Hooks (`/lib/hooks/use-data.ts`)
```
useStudents(academyId)       → cache key: students:{id}
useInstructors(academyId)    → cache key: instructors:{id}
useSchedules(academyId)      → cache key: schedules:{id}
useSessions(scheduleId)      → cache key: sessions:{id}
useAssignments(academyId)    → cache key: assignments:{id}
useAssignment(id)            → cache key: assignment:{id}
useEnrollments(academyId)    → cache key: enrollments:{id}
useLevels(academyId)         → cache key: levels:{id}
useGroups(academyId)         → cache key: groups:{id}
useFields(academyId)         → cache key: fields:{id}
useAcademy(academyId)        → cache key: academy:{id}
```
Each has a corresponding `invalidate*()` export.

### Zustand Stores (`/lib/store/`)
- **`useStudentFilters`** (sessionStorage): levelFilter, groupFilter, scheduleFilter, showArchived, customFieldFilters
- **`useSessionFilters`** (sessionStorage): + dateRange, searchQuery
- **`useProfileStore`** (in-memory): profile data with fetchProfile/updateProfile

---

## API Utilities (`/lib/api/`)

### Response Helpers (`response.ts`)
```typescript
success(data, status)           → { success: true, data }
paginated(data, meta, status)   → { success: true, data, meta }
error(code, message, status)    → { success: false, error: {...} }
errors.badRequest()
errors.unauthorized()
errors.notFound()
errors.validationError()
```
Pagination defaults: `DEFAULT_LIMIT: 50`, `MAX_LIMIT: 200`

### Validation Helpers (`validation.ts`)
```typescript
validateBody<T>(request, schema)   → parses JSON body with Zod
validateQuery(request, schema)     → parses URL params with Zod
```

---

## ID Encoding (`/lib/hashid.ts`)
Uses **Sqids** to encode numeric DB IDs to URL-safe hashes with per-entity offsets:
- schedule: +10000, student: +20000, session: +30000, assignment: +40000, instructor: +50000

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (server-only) |
| `GEMINI_API_KEY` | Google Gemini AI |

---

## What's Implemented ✅

- Multi-tenant academy creation wizard (4-step with drag-and-drop)
- Student CRUD (create, edit, delete, bulk import CSV/JSON)
- Custom student fields (text, number, date, boolean, phone)
- Levels & Groups management
- Class schedules (recurring + one-off) with time slots
- Schedule enrollment for students
- Sessions (create, start, end, cancel)
- Attendance tracking per session (present/late/absent/excused)
- Courses management
- Assignments with multi-part structure
- AI-generated assignment descriptions (Gemini)
- Grade recording per student per assignment part
- Instructor team management + invite system
- Avatar upload (Supabase Storage, cropped + original)
- User profile management
- Academy subdomain routing + multi-academy switching
- Role-based access (owner/admin/instructor)
- Sidebar navigation with dark/light theme
- Settings: Academy structure + custom fields

---

## What's NOT Implemented / Incomplete ⚠️

### Pages (stubs only)
- `/(instructor)/[subdomain]/dashboard` — Dashboard page mostly empty (just layout)
- `/(student)/app` — Student portal dashboard (stub)
- `/(student)/my-courses` — Student courses page (stub)

### Settings Tabs (empty placeholders)
- **Account** tab — no profile editing UI
- **Integration** tab — no third-party integrations
- **Notifications** tab — no notification preferences

### Features not started
- **Dashboard** — analytics, stats, charts, recent activity, KPIs
- **Student portal** — login flow, course browsing, assignment submission, attendance view
- **Gradebook UI** — view of `v_course_grade_book` / `v_assignment_grades` views
- **Reporting** — export, analytics, attendance reports
- **Password reset** flow (code exists but not complete)
- **OAuth / social login** (code commented out in login-form.tsx)
- **Notifications system** — email/in-app notifications
- **Advanced search / filtering** across entities
- **Calendar view** for sessions
- **Student progress tracking** UI
- **Course content** (lessons, materials within courses)
- **Course detail page** — sessions list, assignments, gradebook, enrolled students

---

## Key Type Interfaces

```typescript
// Auth context
type AcademyEntry = { id, name, subdomain, icon, role }

// Extended student with relations
type StudentWithLevelRating = Student & {
  level: Level | null
  group: Group | null
  schedule_enrollments: Array<{ schedule: Schedule | null }>
  student_field_values: StudentFieldValue[]
}

// Schedule with full details
type ScheduleWithRelations = Schedule & {
  level, group, course
  schedule_time_slots: ScheduleTimeSlot[]
  schedule_enrollments_count: number
}

// Assignment with parts
type AssignmentWithParts = Assignment & {
  parts: AssignmentPart[]
  course?: Course
}

// Session with context
type SessionWithSchedule = Session & {
  schedule: ScheduleWithRelations
}

// Profile
interface ProfileData {
  id, email, full_name, phone, avatar_url, role, is_active
}
```

---

## Patterns & Conventions

1. **API Routes**: try/catch, Zod validation via `validateBody`/`validateQuery`, `errors.*` helpers for responses
2. **Data Hooks**: `useXxx(academyId)` → returns `{ data, loading, refreshing, error, refresh }`, invalidated after mutations
3. **Forms**: `react-hook-form` + `zodResolver` + `superRefine` for dynamic validation
4. **Components**: Heavy use of `memo()`, separate data-loading wrapper + inner form UI
5. **DB Layer**: `/lib/db/` files export typed CRUD functions; repositories (`use server`) for complex queries
6. **Multi-tenancy**: Every query filters by `academy_id`
7. **IDs**: Numeric in DB, hash-encoded in URLs via Sqids

---

## Third-Party Integrations

| Service | Purpose | Key |
|---------|---------|-----|
| Supabase Auth | Authentication, JWT | Supabase project |
| Supabase DB | PostgreSQL + RLS | Supabase project |
| Supabase Storage | Avatar uploads | `avatars` bucket |
| Google Gemini | Assignment description AI | `GEMINI_API_KEY` |

---

## Suggested Next Steps (for planning session)

Based on what's missing, high-priority areas to plan:

1. **Dashboard page** — analytics/stats using existing DB views (`v_student_attendance_summary`, `v_course_grade_book`, etc.)
2. **Gradebook** — UI for viewing/editing grades using `v_assignment_grades` and `v_course_grade_book`
3. **Student portal** — student login, view courses, sessions, attendance, grades
4. **Account settings** — profile editing (name, phone, avatar), password change
5. **Calendar view** — sessions calendar for instructors
6. **Reporting & exports** — attendance/grade CSVs
7. **Notifications** — email via Supabase or Resend
8. **Course detail page** — sessions list, assignments, gradebook, enrolled students
