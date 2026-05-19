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
- `text-accent` — cor de ação/accento (laranja #FF6B35) + `bg-accent` + `text-primary-foreground`
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
| name | text | |
| created_at | timestamptz | |

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
| default_duration_minutes | int | |
| price_cents | int | |
| is_active | boolean | default true |

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

### `sessions`
- SELECT, INSERT, UPDATE — all check `schools.owner_user_id = auth.uid()`
- **DELETE**: `sessions_delete_owner` (added in migration 0004)

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

## File Structure (Dashboard)

```
src/
├── lib/
│   ├── supabase/
│   │   ├── server.ts         # createClient() — cookies-based auth
│   │   ├── client.ts         # createClient() — browser
│   │   └── admin.ts          # createAdminClient() — service_role
│   ├── rate-limit.ts         # Rate limiting via Upstash Redis
│   └── audit.ts              # Audit logging utility
└── app/dashboard/
    ├── page.tsx                          # Dashboard home (KPI cards, quick actions)
├── _components/
│   ├── dashboard-view.tsx            # Dashboard home client component
│   └── icons.tsx                     # Custom SVG icon components
├── calendario/
│   ├── page.tsx                      # Server component, fetches schoolId
│   ├── actions.ts                    # Server actions: CRUD sessions, bookings, guests
│   └── _components/
│       └── calendario-view.tsx       # Calendar UI: month grid, sessions list, modals
├── alunos/
│   ├── page.tsx                      # Server component, fetches schoolId + students
│   ├── actions.ts                    # Server actions: getStudents, deleteStudent
│   └── _components/
│       └── alunos-view.tsx           # Students list UI, search, filter, student popup
├── equipamento/                      # (not implemented yet)
│   └── page.tsx
└── mais/                             # (not implemented yet)
    └── page.tsx
```

## Supabase Clients

### `src/lib/supabase/server.ts`
- `createClient()` — async, reads cookies via `next/headers`, uses anon key
- **Usar em**: server actions, server components (default)

### `src/lib/supabase/client.ts`
- `createClient()` — browser client for client components (`"use client"`)
- **Usar em**: client components that need direct Supabase access

### `src/lib/supabase/admin.ts`
- `createAdminClient()` — sync, uses `SUPABASE_SERVICE_ROLE_KEY`, bypasses ALL RLS
- **Usar APENAS quando não há política RLS OU quando a tabela não tem coluna para verificar ownership**:
  - `addGuestToSession()` in calendario/actions.ts (students table não tem school_id, impossível verificar ownership via RLS; validação feita server-side antes do insert)
  - `deleteStudent()` in alunos/actions.ts (deletes across 4 tables)

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
<nav className="fixed left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-accent/10 bg-surface-container-high px-2 py-2 shadow-lg backdrop-blur-md"
  style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
  {NAV_ITEMS.map(item => (...))}
</nav>
```

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

## What Has Been Built

### Completed
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
- Audit logging (6 actions tracked: create/update/delete session, create booking, add guest, delete student)

### Not Started / Pending
- Equipment page (`/dashboard/equipamento`)
- More/Settings page (`/dashboard/mais`)
- Pack management (payment packs for students)
- Instructor management
- Check-in / attendance marking
- Email/notification system
- Student profile page (detailed view with history)

## Key Decisions
1. **Admin client with server-side validation** for operations on tables that can't enforce ownership via RLS (e.g. `students` has no `school_id` column). The server action always verifies `auth.getUser()` + `schools.owner_user_id` before using admin client.
2. **Native date/time inputs** over react-datepicker (mobile-native UX, smaller bundle)
3. **Local state update** for session counter after adding student (instant UI feedback, fetch syncs in background)
4. **Composite FK `(id, session_id)`** on booking_groups ensures bookings always reference a valid group + session
5. **Guest students** have `is_guest=true, auth_user_id=null` — identified as distinct from registered users
6. **Service role key** stored in `SUPABASE_SERVICE_ROLE_KEY` env var

## Before Making Changes
1. Read this file first
2. Read the relevant files before editing
3. Check `supabase/migrations/` for existing table definitions and RLS policies
4. Match existing UI patterns (bottom sheets, Tailwind classes, naming)
5. Build with `npx next build` before finishing
6. Only commit when explicitly asked
