<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Surf Booker — Project Context

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (no `@apply` / component classes, inline only)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (magic link + password)
- **ORM**: Supabase JS client (`@supabase/ssr`, `@supabase/supabase-js`)
- **Icons**: Custom inline SVG components in `src/app/dashboard/_components/icons.tsx`

## Design System (Tailwind v4)
- `bg-background` — fundo principal (`#1A1A1A`)
- `bg-surface` — cartões/containers (`#242424`)
- `bg-[#2A2A2A]` — cartões secundários (when surface is too similar)
- `text-foreground` — texto principal (branco)
- `text-text-secondary` — texto secundário (cinza claro)
- `text-text-muted` — texto muted
- `text-accent` — cor de ação/accento (azul #1E6FA8) + `bg-accent` + `text-primary-foreground`
- `text-error` / `bg-error` — vermelho para ações destrutivas
- `text-success` / `bg-success` — verde para estados positivos
- `font-heading` — tight font para títulos
- `font-body` — regular font para corpo
- **Mobile-first**: todos os layouts são desenhados para mobile em primeiro lugar
- **Botões**: `py-2 px-3 rounded-lg` para pequenos, `py-3 rounded-xl` para modais

## Database Schema (Supabase)

### `schools`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| owner_user_id | uuid FK → auth.users | NOT NULL, UNIQUE |
| name | text | NOT NULL, 2-100 chars |
| slug | text | UNIQUE, 3-60 chars, lowercase, hyphens only |
| description | text? | max 1000 |
| location | text? | max 100 |
| logo_url | text? | max 500 |
| phone | text? | min 6 (added 0014) |
| timezone | text | default 'Europe/Lisbon' |
| cancellation_window_hours | int | default 24 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `students`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| auth_user_id | uuid? UNIQUE | nullable — null for guest students |
| full_name | text | NOT NULL |
| email | text? | nullable |
| phone | text? | nullable |
| is_guest | boolean | default true |

### `school_students` (junction)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid FK → schools | CASCADE |
| student_id | uuid FK → students | RESTRICT |
| first_seen_at | timestamptz | |
| UNIQUE | (school_id, student_id) | |

### `class_types`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid FK → schools | |
| name | text | |
| description | text? | max 1000 (added manually, migration 0019) |
| default_duration_minutes | int | |
| price_cents | int | |
| category | text? | 'aula' / 'pack' / 'aluguer' (added 0013) |
| modality | text | default '' (added 0007) |
| total_lessons | int? | for packs (added 0016) |
| is_active | boolean | default true |

### `instructors`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid FK → schools | CASCADE |
| name | text | |
| level | text | default '' |
| avatar_url | text? | path in instructor-avatars bucket |
| created_at | timestamptz | |

### `school_images`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid FK → schools | CASCADE |
| file_path | text | path in school-images bucket |
| created_at | timestamptz | |

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid FK → schools | CASCADE |
| starts_at | timestamptz | NOT NULL |
| duration_minutes | int | NOT NULL |
| capacity | int? | nullable |
| price_cents | int | default 0 |
| status | text | 'scheduled' / 'cancelled' |
| class_type_id | uuid? FK → class_types | nullable |
| created_at | timestamptz | |
| cancelled_at | timestamptz? | |

### `booking_groups`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid FK → schools | |
| session_id | uuid FK → sessions(id, school_id) | CASCADE |
| booked_by_student_id | uuid FK → school_students(school_id, student_id) | RESTRICT |
| contact_name | text | NOT NULL, 1-120 chars |
| contact_email | text | NOT NULL, valid email regex |
| contact_phone | text | NOT NULL, 6-20 chars, digits only |
| source | text | 'guest' / 'account' |
| status | text | 'active' / 'cancelled' |
| UNIQUE | (id, session_id) | composite PK used by bookings FK |

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| booking_group_id | uuid | |
| session_id | uuid | composite FK → booking_groups(id, session_id) CASCADE |
| student_id | uuid | |
| status | text | 'confirmed' / 'cancelled_by_student' / 'cancelled_by_school' / 'attended' / 'no_show' |
| payment_method | text | 'single' / 'pack' |
| payment_status | text | 'unpaid' / 'paid_offline' |
| price_cents | int | 0-500000 |
| UNIQUE | (session_id, student_id) | one booking per student per session |

### `audit_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid FK → schools | nullable, set null on delete |
| user_id | uuid FK → auth.users | nullable, set null on delete |
| action | text | e.g. "create_session", "delete_student" |
| entity_type | text | e.g. "session", "student", "booking" |
| entity_id | text | ID of the affected entity |
| metadata | jsonb | additional context |
| created_at | timestamptz | indexed desc |

### `favorites`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| school_id | uuid FK → schools | CASCADE |
| created_at | timestamptz | |
| UNIQUE | (user_id, school_id) | |

### `school_settings`
| Column | Type | Notes |
|--------|------|-------|
| school_id | uuid PK FK → schools | CASCADE |
| cancellation_window_hours | int | default 24 |
| low_occupancy_threshold | int | default 40 |
| notify_email_confirmation | boolean | default true |
| notify_reminder_24h | boolean | default true |
| notify_sms_cancellation | boolean | default false |
| notify_new_schedule | boolean | default true |

## Security Score: 10/10

| Aspeto | Estado |
|--------|--------|
| RLS em todas as tabelas | ✅ |
| Service_role key nunca no cliente | ✅ |
| Server actions validam auth + ownership antes de operações críticas | ✅ |
| Admin client só após verificação de ownership no servidor | ✅ |
| Rate limiting via Redis (Upstash) em todas as ações críticas | ✅ |
| Audit logging em todas as operações destrutivas/mutações | ✅ |
| Input validation via check constraints na BD | ✅ |

## RLS Policies

### `students`
- **SELECT**: `students_select_self_or_owner_linked` — owner can see students linked to their school via school_students
- **INSERT**: `students_insert_owner_guest` — owner can create guest students (is_guest=true, auth_user_id=null)
- **UPDATE**: limited to self or owner editing guest students
- **DELETE**: none (admin client used for bulk delete in alunos/actions.ts)

### `school_students`
- SELECT, INSERT, UPDATE, DELETE — all check `schools.owner_user_id = auth.uid()`

### `schools`
- SELECT: public (anon can see active schools, rows with `owner_user_id IS NOT NULL`)
- UPDATE: only owner (`owner_user_id = auth.uid()`)
- INSERT: only authenticated
- DELETE: only owner (CASCADE to related data)

### `sessions`
- **Public**: `sessions_select_public` — anon can see scheduled sessions (used by public page)
- Dashboard: SELECT, INSERT, UPDATE — all check `schools.owner_user_id = auth.uid()`
- **DELETE**: `sessions_delete_owner` (added in migration 0004)

### `class_types`
- Dashboard: SELECT, INSERT, UPDATE, DELETE — all check `schools.owner_user_id = auth.uid()`
- Public: `class_types_select_public` — anon can see active class_types for approved schools (used by public page)

### `instructors`
- Dashboard: SELECT, INSERT, UPDATE, DELETE — all check `schools.owner_user_id = auth.uid()`
- Public: `instructors_select_public` — anon can see instructors for approved schools

### `school_images`
- Dashboard: SELECT, INSERT, DELETE — all check `schools.owner_user_id = auth.uid()`
- Public: `school_images_select_public` — anon can see images for approved schools

### `booking_groups`
- SELECT, INSERT, UPDATE — all check `schools.owner_user_id = auth.uid()`
- DELETE: none yet

### `bookings`
- SELECT: checks via booking_groups → schools.owner_user_id
- INSERT: checks booking_groups exists + student linked to school + payment method valid
- UPDATE: similar to insert
- DELETE: none yet

### `audit_logs`
- **SELECT**: `audit_logs_select_owner` — school owner can view logs
- **INSERT**: none — apenas service_role (admin client) escreve

### Storage Buckets (3 buckets, all public for read / RLS for write)
- `school-logos`: public read (CDN), INSERT/DELETE via RLS (owner only, migration 0018)
- `school-images`: public read (CDN), INSERT/DELETE via RLS (owner only, migration 0018)
- `instructor-avatars`: public read (CDN), INSERT/DELETE via RLS (owner only, migration 0018)

### Schools SELECT (anon)
- Applied to `schools` table for public directory page
- Allows anon SELECT on rows where `owner_user_id IS NOT NULL` and `deleted_at IS NULL`

## File Structure

```
src/
├── lib/
│   ├── supabase/
│   │   ├── server.ts         # createClient() — cookies-based auth
│   │   ├── client.ts         # createClient() — browser
│   │   └── admin.ts          # createAdminClient() — service_role
│   ├── rate-limit.ts         # Rate limiting via Upstash Redis
│   ├── audit.ts              # Audit logging utility
│   └── utils/
│       └── validate-image.ts # Magic bytes validation (PNG/JPEG/WEBP)
│
├── app/
│   ├── layout.tsx                       # Root layout (includes PublicNavbar)
│   ├── page.tsx                         # Landing page
│   │
│   ├── _components/
│   │   └── public-navbar.tsx            # Shared navbar: "Pesquisar escolas" search | Alaia | Entrar + Registar
│   │
│   ├── escolas/
│   │   ├── page.tsx                     # (directory — 404s, not implemented)
│   │   ├── actions.ts                   # searchSchools() — debounced search, 5+5 results
│   │   └── [slug]/
│   │       ├── page.tsx                 # Public school page (server component, fetches data)
│   │       ├── actions.ts               # getPublicSchoolData(), getPublicSessionsForMonth(), criarReservaPublica()
│   │       └── _components/
│   │           ├── escola-view.tsx      # Main layout: gallery, info card, services, service picker modal, instructors
│   │           ├── public-calendar.tsx  # Calendar with month nav, day grid, session list, "+" buttons, bottom bar
│   │           ├── booking-modal.tsx    # Booking modal — not yet fully wired
│   │           └── lightbox.tsx         # Image lightbox with keyboard nav
│   │
│   └── dashboard/
│       ├── page.tsx                     # Dashboard home (KPI cards, quick actions)
│       ├── _components/
│       │   ├── dashboard-view.tsx       # Dashboard home client component
│       │   └── icons.tsx                # Custom SVG icon components
│       ├── calendario/
│       │   ├── page.tsx                 # Server component, fetches schoolId
│       │   ├── actions.ts               # Server actions: CRUD sessions, bookings, guests
│       │   └── _components/
│       │       └── calendario-view.tsx  # Calendar UI: month grid, sessions list, modals
│       ├── alunos/
│       │   ├── page.tsx                 # Server component, fetches schoolId + students
│       │   ├── actions.ts               # Server actions: getStudents, deleteStudent, createStudent, toggleWaiver
│       │   └── _components/
│       │       └── alunos-view.tsx      # Students list UI, search, filter, student popup, add student modal
│       └── mais/
│           ├── page.tsx                 # Server component, fetches school info
│           ├── actions.ts               # saveSchoolInfo(), saveInstructor(), addSchoolImage() + magic bytes validation
│           └── _components/
│               └── mais-view.tsx        # Business info form, instructor upload (desktop + mobile), showcase images
│
└── supabase/
    ├── migrations/                      # SQL migration files (0001-0019)
    │   ├── 0001_schools_rls.sql
    │   ├── 0002_students_school_students.sql
    │   ├── 0003_sessions.sql
    │   ├── 0004_sessions_cascade.sql
    │   ├── 0005_booking_groups.sql
    │   ├── 0006_bookings.sql
    │   ├── 0007_audit_logs_class_types.sql
    │   ├── 0008_schools_table.sql
    │   ├── 0009_school_slug.sql
    │   ├── 0010_school_slug_check.sql
    │   ├── 0011_favorites_rls.sql
    │   ├── 0012_schools_public_policies.sql
    │   ├── 0013_class_types_category.sql
    │   ├── 0014_schools_phone.sql
    │   ├── 0015_instructors_table.sql
    │   ├── 0016_class_types_total_lessons.sql
    │   ├── 0017_school_images.sql
    │   ├── 0018_storage_bucket_policies.sql
    │   └── 0019_class_types_description.sql
    └── seed-test-session.sql            # Test sessions for June 4-5 2026 (BSS)
```

## Supabase Client Usage

| Client | Key | When to use |
|--------|-----|-------------|
| `createClient()` (server.ts) | anon key + cookies | Server actions, server components (default) |
| `createClient()` (client.ts) | anon key | Browser client components |
| `createAdminClient()` (admin.ts) | service_role | Public page data (bypass RLS), DB operations on tables without school_id column — always after server-side auth + ownership check |



## UI Patterns & Conventions

### Modals (Bottom Sheet)
All modals follow the same pattern:
```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
    <div className="w-full max-w-md rounded-t-2xl bg-surface p-6 pb-10">
      <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-text-muted" />
      <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Título</h3>
      <div className="space-y-4">...</div>
      <div className="flex gap-3 pt-2">
        <button className="flex-1 rounded-xl bg-[#2A2A2A] py-3 ...">Cancelar</button>
        <button className="flex-1 rounded-xl bg-accent py-3 ...">Confirmar</button>
      </div>
    </div>
  </div>
)}
```

### Delete Confirmation
Centered dialog:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
  <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center">
    ...
    <div className="flex gap-3">
      <button className="flex-1 rounded-xl bg-[#2A2A2A] py-3 ...">Cancelar</button>
      <button className="flex-1 rounded-xl bg-error py-3 ...">Sim, eliminar</button>
    </div>
  </div>
</div>
```

### Bottom Navigation (Navbar)
Fixed at bottom, centered, with glass effect:
```tsx
<nav className="fixed left-1/2 z-50 flex w-[90%] max-md -translate-x-1/2 items-center justify-around rounded-full border border-accent/10 bg-surface-container-high px-2 py-2 shadow-lg backdrop-blur-md"
  style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
  {NAV_ITEMS.map(item => (...))}
</nav>
```

### Calendar Layout (Compact Dual-Panel)
The calendar page uses a compact double-width layout:
- **Container**: `<main>` with `maxWidth: 800px`, `height: 95vh`, left-aligned with `px-5`, wrapped in a `relative` div.
- **Header**: "Calendário" title + month nav arrows in same flex row, left-aligned, with same top spacing as dashboard home (`pt-4 + mt-4`).
- **Calendar grid**: Cells `min-h-[48px] mobile / 56px desktop`, day numbers `text-xs`, session text `text-[9px]`, occupancy bar `h-0.5`, cells `p-1`, gap between day number and content `mt-1.5`.
- **Sessions sidebar**: Positioned `absolute` outside `<main>`, inside the `relative` wrapper, with `left: calc(100% + 24px)`, `top-0 bottom-0`, `w-[380px]`, `pt-20`. Does NOT shrink the calendar when visible.
- **Past sessions**: When `session.starts_at < new Date()`, sidebar shows "Realizada" / "Cancelada" instead of "Editar" + "Cancelar" + "Concluir".
- **Month nav**: No divider between title and month. Buttons have border.

### Floating Action Button (FAB)
Primary trigger for session creation:
- **Positioning**: Fixed at `bottom-12 right-16`.
- **Redundancy**: Secondary "Criar aula" buttons in lists are avoided in favor of the centralized FAB.

### Loading States
Use a `loadingSessions` boolean state to show loading indicator. The `fetchSessions` callback:
```tsx
const fetchSessions = useCallback(async (y: number, m: number) => {
  setLoadingSessions(true);
  const data = await getSessionsForMonth(y, m, schoolId);
  setSessions(data);
  setLoadingSessions(false);
}, [schoolId]);
```

### Form Inputs
- Native `<input type="date/time">` preferred over datepicker libraries (opens native OS picker on mobile)
- Date picker styled with `[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert-[0.7]`

## Data Flows

### Calendar: Creating a Session
1. User clicks FAB "+" or "Adicionar aula" on dashboard
2. Modal opens with fields: nome, data, horário, duração, capacidade, instrutores
3. `createSession()` server action:
   - Finds or creates `class_type` by name
   - Creates `sessions` row with starts_at, duration, capacity, class_type_id
4. `fetchSessions()` refreshes calendar data

### Calendar: Adding a Guest Student to Session
1. User expands session, clicks "+ Adicionar aluno", types name
2. Option A: Click existing student → `createBooking()` creates booking_group + booking
3. Option B: Click "+ Novo convidado" → modal with name + optional phone
4. `addGuestToSession()` server action:
   - **Verifica auth** (`auth.getUser()`) + **ownership** (`schools.owner_user_id = user.id`) — se falhar, erro
   - Usa `createAdminClient()` para criar `students` row (bypass RLS — tabela não tem school_id para verificar ownership)
   - Usa `createClient()` para `school_students`, `booking_groups`, `bookings` (RLS verifica ownership)
5. Local state updated immediately (alunos+1, name added to alunosList)
6. `fetchSessions()` called in background to sync with DB

### Calendar: Session Counter
The counter shows `bookings` count for each session. Uses two separate queries (no Supabase join) to avoid FK dependency:
```sql
-- 1. Get bookings for the month's sessions
SELECT session_id, student_id FROM bookings
WHERE session_id IN (...) AND status = 'confirmed';

-- 2. Get student names
SELECT id, full_name FROM students WHERE id IN (...);
```

### Students Page: Data Loading
1. `getStudents(schoolId)` queries `school_students` joined with `students`
2. For each student, queries `bookings` → `sessions` for last/next class date
3. Returns `StudentRecord[]` with classLabel, classDate, classDateRaw

### Students Page: Class Date Logic
- If future sessions exist: show earliest future as "Próxima aula: {date}"
- If only past sessions: show latest past as "Última aula: {date}"
- If none: "Sem aulas"

### Students Page: Adding a Student
1. User clicks "Adicionar aluno" button → modal opens, fetches available packs
2. Fields: Nome (required), Telemóvel (optional, stored for future account linking), Pack (optional dropdown)
3. `createStudent()` server action:
   - Verifies auth + ownership (schools.owner_user_id)
   - Uses `createAdminClient()` to insert into `students` (bypass RLS — no school_id column)
   - Uses `createClient()` to insert into `school_students` (RLS verifies ownership)
   - If pack selected: calls `buyPack()` to create pack_purchase
   - Logs audit with action "create_student"
4. On success: closes modal, calls `router.refresh()` to reload the list

## What Has Been Built

### Dashboard
- Dashboard home with KPI counts, scroll shadow, quick actions
- Calendar page with month navigation, day grid, event dots, session list
- Session CRUD (create, edit, delete with confirmation)
- Student enrollment in sessions (existing students + guest walk-ins)
- Students page with real Supabase data, search, filters, student popup
- Guest student creation with name + optional phone
- Student deletion (from calendar session and from alunos page)
- All RLS policies for security (SELECT, INSERT, UPDATE, DELETE where needed)
- "Próxima aula"/"Última aula" logic on students page
- Rate limiting via Upstash Redis (30 req/min sliding window) on all mutations
- Audit logging (7 actions tracked: create/update/delete session, create booking, add guest, delete student, create student)
- Calendar compact layout (redesigned cells, header, sidebar outside main, past-session buttons)
- Students page: Add student modal with name, phone (optional), and pack purchase (optional)
- `createStudent()` server action in alunos/actions.ts (inserts student + school_student + optional buyPack)

### Mais / Settings
- `mais-view.tsx`: Business info form (name, description, location, phone), instructor upload (desktop panel + mobile bottom sheet), showcase image gallery (grid-cols-3 md:grid-cols-6, max 6 images)
- `saveSchoolInfo()`: updates schools table (name, description, location, phone) with server-side auth + ownership check
- `saveInstructor()`: inserts instructor row, uploads avatar to `instructor-avatars` bucket, validates file type/size/magic bytes (1MB max)
- `addSchoolImage()`: inserts school_images row, uploads to `school-images` bucket, validates file type/size/magic bytes, enforces max 6 images per school
- `validateImageContent()`: checks first 12 bytes for PNG/JPEG/WEBP magic bytes
- Instructor file input `onChange` errors (format/size) displayed via `setInstrutorError()` with `bg-error/10` and warning icon
- Storage buckets: `school-logos`, `school-images`, `instructor-avatars` — all public for read (CDN), RLS policies for INSERT/DELETE (owner only, migration 0018)
- Migration 0019: `description` column on `class_types` (max 1000 chars, applied)
- `getSchoolInfo()` in dashboard/actions.ts — selects name, logo_url, location, description, phone, cancellation_window_hours

### Public School Page (`/escolas/[slug]`)
- `getPublicSchoolData()`: server action using `createAdminClient()` (bypass RLS), fetches real data: school info, class_types with categories/modalities, instructors with avatar URLs, school_images with public storage URLs — no placeholders
- Gallery: always renders (even without images), 65%/35% split (image 1 vs images 2+3), missing images shown as gray placeholder with camera icon, "Ver mais fotos" overlay only when `images.length > 3`
- Info card: school name at 32px (`text-[32px]`), description, Google Maps iframe (`q={name},{location}`)
- Instructors section: query, mapping, 4-column flex layout, circular placeholders with initials
- Category filter buttons always visible (Todas/Aulas/Packs de Aulas/Alugueres) — values: `aula`/`pack`/`aluguer`
- Modality filter dropdown alongside category buttons — only shown when modalities exist
- Service limit 5 on page + bottom-sheet "Ver mais" modal with IntersectionObserver infinite scroll (10 in 10)
- `ServiceCard`: `<div>` with `hover:[&:not(:has(.reservar-btn:hover))]:scale-[1.01] shadow-md` — scales on hover unless hovering reservar button; `reservar-btn` class on "+" button with `hover:scale-105 hover:bg-accent hover:text-white`
- Service detail modal: name, duration, description, price + "Reservar" CTA (border-2 border-accent, outline style)
- Service picker modal: centered max-w-5xl, flex-row (service list flex-1 + right column 320px)
- Right column: calendar for "aula" services, form for pack/aluguer services
- `PublicCalendar`: month nav, 7-col day grid with proper alignment, session list with `border border-gray-100 bg-gray-50`
- Session time format: `dd/mm/aaaa, HH:MM` (zero-padded)
- Full sessions: `opacity-50`, no "+" button, "Completo" text
- "+" button selects session → bottom bar shows `{item} = {price} · {time}` (removed "1x " prefix)
- Bottom bar always visible when service selected; "Continuar" CTA (border-2 border-accent outline, disabled state `border-gray-200 text-gray-300`)
- Pack/aluguer form: name/email/phone inputs with sanitization (name: letters/accented max 80; email: lowercase max 120; phone: digits/+ max 20)
- Form validation: name ≥ 2 chars, email must include @ and ., phone ≥ 6 digits; error message below inputs
- Logged-in user auto-fill from `students` table or auth metadata
- **Pack purchase flow**: `comprarPackPublico()` server action — find/create student by email, create `packs` row on-the-fly if needed, create `pack_purchases` with `lessons_remaining = quantity`
- **Pack credit consumption**: `criarReservaPublica()` accepts `packPurchaseId` — creates booking with `payment_method = 'pack'`, decrements `lessons_remaining`, auto-exhausts at 0
- **Pack detection in BookingModal**: 400ms debounce on email input queries `buscarPackAtivo()` — shows blue banner with remaining credits, auto-uses oldest active pack on submit

### Public Navbar
- Minimal: "Pesquisar escolas" (opens search dropdown) | Alaia (center) | Entrar + Registar (right)
- Search dropdown: input with 300ms debounce, 5 results + "Ver mais" (+5), 64×64 school logo thumbnails, sanitized input (accented chars allowed, max 100, strips special chars)
- `searchSchools()` server action in `src/app/escolas/actions.ts`

### Database Schema Updates
- 19 migrations applied (0001–0019)
- `schools`: slug, description, location, logo_url, phone, timezone, cancellation_window_hours
- `class_types`: category (`aula`/`pack`/`aluguer`), modality, total_lessons, description
- `instructors`: table with name, level, avatar_url (created in migration 0015)
- `school_images`: table with file_path (created in migration 0017)
- `packs`: table with total_lessons, price_cents, class_type_id (created in 0001, modified 0007)
- `pack_purchases`: table with student_id, pack_id, lessons_remaining, status (created in 0001)
- `bookings`: includes `pack_purchase_id` FK + constraint `bookings_pack_consistency_check`
- 3 storage buckets with RLS policies (migration 0018)
- Seed SQL: test sessions for June 4-5 2026 (BSS school)

### Known Issues
- No full end-to-end validation with all features working
- BSS school has 4 class_types with categories; Oporto school has 0 class_types, 0 instructors, 0 images

### Not Started / Pending
- Check-in / attendance marking
- Email/notification system
- Student profile page with full history
- Create test school via onboarding to validate end-to-end
- SEO: meta tags, Open Graph, JSON-LD for school page
- View pack purchases on dashboard (alunos page — remaining credits per student)

## Key Decisions
1. **Admin client with server-side validation** for operations on tables that can't enforce ownership via RLS (e.g. `students` has no `school_id` column). The server action always verifies `auth.getUser()` + `schools.owner_user_id` before using admin client.
2. **Native date/time inputs** over react-datepicker (mobile-native UX, smaller bundle)
3. **Local state update** for session counter after adding student (instant UI feedback, fetch syncs in background)
4. **Composite FK `(id, session_id)`** on booking_groups ensures bookings always reference a valid group + session
5. **Guest students** have `is_guest=true, auth_user_id=null` — identified as distinct from registered users
6. **Service role key** stored in `SUPABASE_SERVICE_ROLE_KEY` env var
7. **Calendar sidebar outside main flow** — positioned `absolute` outside `<main>` to prevent calendar from shrinking when sidebar appears
8. **Past session buttons** — sidebar shows "Realizada"/"Cancelada" (no "Editar") when `session.starts_at < new Date()`
9. **Public page uses `createAdminClient()` (service_role)** — necessary because public RLS policies don't exist for all tables; server-side safety via `getPublicSchoolData()` being a server action
10. **Dashboard uses `createClient()` (anon key)** — respects RLS for all dashboard operations
11. **All storage uploads use `createAdminClient()` (service_role)** — RLS policies on buckets exist as defense-in-depth, not as primary auth mechanism
12. **Storage buckets are public for read (CDN)** — necessary for public page images to load without auth tokens
13. **ServiceCard: `<div>` with `role="button"` instead of `<button>`** — allows nested clickable "Reservar"/"+" span with `e.stopPropagation()`
14. **Hover logic on ServiceCard** — card scales on hover except when hovering the reservar button (`:has(.reservar-btn:hover)`)
15. **Calendar only for "aula" services** — packs/aluguer get a contact form instead (name/email/phone)
16. **Session selection via "+" button** — clicking the whole session row does not select it
17. **Bottom bar always visible when service selected** — even before session is picked; "Continuar" disabled for aula without session, always enabled for pack/aluguer
18. **Category values in DB**: `aula`, `pack`, `aluguer` — display text: "Aulas", "Packs de Aulas", "Alugueres"
19. **Gallery section always renders** even without images — missing images shown as gray placeholder with camera icon
20. **All `&middot;` replaced with Unicode `·`** in JSX
21. **Instructor file validation** runs both client-side (`onChange`) and server-side (`saveInstructor`): file type, size (1MB), magic bytes
22. **Error color**: `--color-error: #EF4444`; `text-error` works in Tailwind v4 via `@theme` custom color
23. **Category filter buttons always visible** regardless of data; modality dropdown only if modalities exist
24. **Unified accent color (`#1E6FA8`) in both themes** — eliminates inconsistent blues between public/dashboard pages. `--color-accent-light` (`#81CAFA`) used where lighter contrast needed on dark backgrounds.
25. **Pack purchase on public page creates `packs` row on-the-fly** if no `packs` row exists for the `class_type_id` (necessary because `pack_purchases` FK references `packs(id)`, not `class_types`)
26. **Student identified by email** across pack purchase and booking — both `comprarPackPublico()` and `criarReservaPublica()` call `findOrCreateStudent()` which reuses existing students by email + school
27. **Theme initialisation via in-body sync script** (no blocking `<head>` script) — runs during HTML parsing before paint, applies `.light` for public pages; `ThemeInit` useEffect restores localStorage preference for dashboard pages
28. **Inline scripts stripped from `<head>` by Next.js** — plain `<script>` tags with `dangerouslySetInnerHTML` in `<body>` render and execute correctly

### Landing Page — Responsive Layout
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1440px` (custom)
- Navbar: < 768px → transparent header, logo branco, hamburger icon; ≥ 768px → pill com nav links + auth
- Hamburger: `text-white` sobre hero escuro, `hover:bg-white/20`
- Dropdown mobile: animação fade + slide (300ms, `opacity-100 translate-y-0` ↔ `opacity-0 -translate-y-2`)
- "Como funciona" secção: mobile `flex-col` texto centrado; md `flex-row` texto left-aligned; gap `16/24/80` conforme breakpoint
- Bullet descriptions: `clamp(0.8125rem,1vw,0.875rem)` (min 13px em tablet)

## Before Making Changes
1. Read this file first
2. Read the relevant files before editing
3. Check `supabase/migrations/` for existing table definitions and RLS policies
4. Match existing UI patterns (bottom sheets, Tailwind classes, naming)
5. Build with `npx next build` before finishing
6. Only commit when explicitly asked
7. For public page work: always use `createAdminClient()` for data fetching (bypass RLS); never send service_role key to client
8. All copy must be in Portuguese (PT)

## Security Checks
1. Security is the most important thing on the software, NEVER compromise it for whatever reason.
2. If you have any question regarding security or something that can break, ask directly to me before commit anything.