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
| payment_iban | text? | IBAN para pagamento offline (migração 0027) |
| payment_mbway | text? | MBWay para pagamento offline (migração 0027) |
| stripe_enabled | boolean | default false — ativar Stripe Checkout (futura migração) |
| stripe_secret_key | text? | Stripe secret key específica da escola (opcional, futura migração) |

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
| name | text | partial unique index per school, excludes aluguer (migration 0023) |
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
| payment_method | text | 'single' / 'pack' / 'stripe' |
| payment_status | text | 'unpaid' / 'paid_offline' / 'paid_stripe' |
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
| Proteção CSRF (origin vs host) em todas as 24 server actions mutáveis | ✅ |
| Password policy consistente (min 8, maiúscula, número) em signup + perfil | ✅ |
| Invalidação de sessão após alteração de password (força re-login) | ✅ |

## Guardrails — Action Creator Helper

Para quebrar o ciclo de "fix → novo bug → fix", todas as **novas** server actions devem usar `defineMutation`, `defineQuery`, ou `definePublicAction` de `src/lib/create-action.ts`. Estes helpers garantem auth, CSRF, rate limit, ownership e sanitização de erros **sem o developer se lembrar de os adicionar**.

### `defineMutation` (escritas autenticadas)
```typescript
export const createSession = defineMutation({
  name: "createSession",
  schema: z.object({ schoolId: z.string().uuid(), /* ... */ }),
  rateLimit: "default",        // "default" | "expensive" | false
  checkAccess: (input) => requireOwner(input.schoolId),
  execute: async ({ input, supabase, admin, user }) => {
    // só lógica de negócio — CSRF, auth, rate limit já verificados
  }
})
```

### `defineQuery` (leituras autenticadas)
```typescript
export const getStudents = defineQuery({
  name: "getStudents",
  schema: z.object({ schoolId: z.string().uuid() }),
  execute: async ({ input, supabase }) => {
    const { data } = await supabase.from("school_students").select("...")
    return { data }
  }
})
```

### `definePublicAction` (endpoints públicos)
```typescript
export const submitContact = definePublicAction({
  name: "submitContact",
  schema: ContactSchema,
  rateLimit: { maxRequests: 5, window: "60 s" },
  execute: async ({ input, supabase }) => { ... }
})
```

### `requireServerContext` (migração incremental)
Para actions existentes que não podem usar `defineMutation` ainda, substitui o boilerplate auth + CSRF:
```typescript
export async function oldAction(id: string): Promise<MutationResult> {
  let ctx: ActionContext;
  try { ctx = await requireServerContext(); } catch { return { ok: false, error: "..." }; }
  // ...
}
```

## Security Files

| Ficheiro | Função |
|----------|--------|
| `src/lib/create-action.ts` | `defineMutation()`, `defineQuery()`, `definePublicAction()`, `requireServerContext()` — guardrails que combinam auth + CSRF + rate limit + ownership + sanitização |
| `src/lib/csrf.ts` | `assertValidOrigin()` — valida `origin` vs `host`, dev-safe com bypass localhost, fallback para `ALLOWED_ORIGINS` env var |
| `src/lib/rate-limit.ts` | `rateLimitPublic()` e `rateLimitByUser()` via Upstash Redis |
| `src/lib/audit.ts` | `logAudit()` — registo de operações destrutivas/mutações |
| `src/lib/school.ts` | `requireOwner()` — verifica `schools.owner_user_id = auth.uid()` |
| `src/lib/validation/signup-owner.ts` | `passwordSchema` — validação Zod partilhada (min 8, maiúscula, número) |
| `src/proxy.ts` | CSP headers, HSTS, auth redirect — `object-src 'none'`, `frame-ancestors 'none'`, `img-src` restrito a `*.supabase.co` |

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
│   ├── create-action.ts      # defineMutation/defineQuery/definePublicAction — guardrails auth+CSRF+rate limit+ownership
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
    ├── migrations/                      # SQL migration files (0001-0025)
    │   ├── 0001_init.sql
    │   ├── 0002_rls.sql
    │   ├── 0003_profiles_and_class_types.sql
    │   ├── 0004_students_insert_policy.sql
    │   ├── 0005_audit_logs.sql
    │   ├── 0007_service_refactor.sql
    │   ├── 0008_instructors_rls.sql
    │   ├── 0008_school_images.sql
    │   ├── 0009_instructor_and_payment.sql
    │   ├── 0010_alert_dismissals.sql
    │   ├── 0011_school_settings.sql
    │   ├── 0011_waiver_signed.sql
    │   ├── 0012_add_completed_status.sql
    │   ├── 0013_class_types_category.sql
    │   ├── 0014_favorites.sql
    │   ├── 0014_school_phone.sql
    │   ├── 0015_set_service_categories.sql
    │   ├── 0016_class_types_total_lessons.sql
    │   ├── 0017_instructor_avatars_bucket.sql
    │   ├── 0018_storage_bucket_policies.sql
    │   ├── 0019_class_types_description.sql
    │   ├── 0020_atomic_pack_decrement.sql
    │   ├── 0021_student_self_service.sql
    │   ├── 0022_fix_rls_recursion.sql
    │   ├── 0023_allow_duplicate_rental_names.sql
│   ├── 0024_add_group_size.sql
│   ├── 0025_add_bookings_participants.sql
│   ├── 0026_add_pack_metadata.sql
│   ├── 0027_add_pack_payment_status.sql
│   └── 0028_stripe_support.sql          # (futura) stripe_enabled, CHECK constraints para paid_stripe/stripe
```

## Server Actions com Proteção CSRF

Todas as 26 server actions mutáveis chamam `await assertValidOrigin()` após verificação de auth. A proteção CSRF verifica que o header `origin` corresponde ao `host` (ou está listado em `ALLOWED_ORIGINS`), prevenindo ataques de cross-site request forgery. Em desenvolvimento, localhost é automaticamente permitido.

| Ficheiro | Ações protegidas |
|----------|---------------|
| `dashboard/calendario/actions/sessions.ts` | createSession, deleteSession, cancelSession, markAttendance, closeSession, updateSession, updateSessionDate |
| `dashboard/calendario/actions/bookings.ts` | createBooking, addGuestToSession, addGroupBooking, togglePaymentStatus, cancelBooking, cancelBookingsBulk |
| `dashboard/alunos/actions.ts` | toggleWaiver, deleteStudent, deleteStudentsBulk, createStudent, cancelPackPurchase, updatePackRemaining |
| `perfil/actions.ts` | updateProfile, updatePassword |
| `dashboard/mais/actions/profile.ts` | saveProfile |
| `(auth)/login/actions.ts` | signIn, resendConfirmationFromLogin |
| `(auth)/reset-password/actions.ts` | updatePassword |

## Invalidação de Sessão pós-Password

Após alteração de password (via `updateUser()`), as actions chamam `supabase.auth.signOut()` + `redirect("/login")`, forçando re-autenticação e prevenindo uso de tokens antigos:

| Fiche | Função |
|-------|--------|
| `perfil/actions.ts` | `updatePassword()` |
| `(auth)/reset-password/actions.ts` | `updatePassword()` |
| `dashboard/mais/actions/profile.ts` | `saveProfile()` (quando password é alterada) |

## Password Policy

Todas as validações de password usam o mesmo `passwordSchema` exportado de `signup-owner.ts`: mínimo 8 caracteres, pelo menos 1 maiúscula, pelo menos 1 número. Aplicado em signup, perfil e dashboard.

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

### Perfil / Student Area
- `perfil/actions.ts`: `updateProfile` e `updatePassword` migradas para `requireServerContext()` — auth + CSRF automáticos
- Rate limiting via `rateLimitByUser()` (30 req/min) em ambas as ações
- Audit logging (`logAudit()`) em `updateProfile` e `updatePassword`
- `updatePassword`: session invalidation (`signOut() + redirect("/login")`) após log de auditoria
- Zod validation field-level: `trimmedString`, `optionalEmailSchema`, `optionalPhoneSchema`, `passwordSchema`
- Phone input: dois campos de texto livre (prefixo + número) com `maxLength` e sanitização client-side
- Build verificado: `npx next build` → `✓ Compiled successfully`

### Database Schema Updates
- 27 migrations applied (0001–0027)
- `schools`: slug, description, location, logo_url, phone, timezone, cancellation_window_hours
- `class_types`: category (`aula`/`pack`/`aluguer`), modality, total_lessons, description
- `instructors`: table with name, level, avatar_url (created in migration 0015)
- `school_images`: table with file_path (created in migration 0017)
- `packs`: table with total_lessons, price_cents, class_type_id (created in 0001, modified 0007)
- `pack_purchases`: table with student_id, pack_id, lessons_remaining, status (created in 0001)
- `bookings`: includes `pack_purchase_id` FK + constraint `bookings_pack_consistency_check`
- `pack_purchases`: `payment_status` ('pendente'/'pago'/'reembolsado'), `payment_method` ('stripe'/'multibanco'/'mbway'/'transferencia') — migration 0027
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
- **Stripe Checkout** (plano documentado na secção "Stripe Integration Guide" abaixo)

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
29. **Rental grouping by name**: `getPublicSchoolData()` collapses same-name rentals (aluguer) into one `PublicService` with a `rental_options[]` array; `ServiceCard` shows duration chips; detail modal and ServicePicker right column show a duration/price selector; bottom bar and `handleContinue` use `selectedRentalVariantId` (or fall back to the first option). `comprarPackPublico()` receives the variant's `class_type_id` when purchasing a grouped rental.

### Landing Page — Responsive Layout
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1440px` (custom)
- Navbar: < 768px → transparent header, logo branco, hamburger icon; ≥ 768px → pill com nav links + auth
- Hamburger: `text-white` sobre hero escuro, `hover:bg-white/20`
- Dropdown mobile: animação fade + slide (300ms, `opacity-100 translate-y-0` ↔ `opacity-0 -translate-y-2`)
- "Como funciona" secção: mobile `flex-col` texto centrado; md `flex-row` texto left-aligned; gap `16/24/80` conforme breakpoint
- Bullet descriptions: `clamp(0.8125rem,1vw,0.875rem)` (min 13px em tablet)

### A5 — Notificações Fire-and-Forget
Emails de notificação ao owner (`notifyOwnerBooking()`) usam `.catch()` em vez de `await` na reserva pública (`escolas/[slug]/actions.ts`), garantindo que a resposta ao utilizador não depende da entrega do email.

## Before Making Changes
1. Read this file first
2. Read the relevant files before editing
3. Check `supabase/migrations/` for existing table definitions and RLS policies
4. Match existing UI patterns (bottom sheets, Tailwind classes, naming)
5. Build with `npx next build` before finishing
6. Only commit when explicitly asked
7. For public page work: always use `createAdminClient()` for data fetching (bypass RLS); never send service_role key to client
8. All copy must be in Portuguese (PT)
9. **Novas server actions**: usar `defineMutation()`, `defineQuery()`, ou `definePublicAction()` de `src/lib/create-action.ts` — nunca escrever auth/CSRF/rate-limit manualmente
10. **CI valida automaticamente**: CSP headers, `poweredByHeader`, `bodySizeLimit`, migrations, `.gitignore`, presença de `create-action.ts` — corre em cada PR via `.github/workflows/ci.yml`

## Progress

### Cleanup Completed
| Item | What |
|------|------|
| P1 | `middleware.ts` → `proxy.ts` rename |
| P2 | `expose-debug.ts` deleted |
| P3 | `landing-page-view.tsx` (647 linhas) → 8 componentes em `_components/landing/` |
| P4 | `schemas.ts` (496 linhas) → `validation/schemas/{helpers,schools,students,...}.ts` |
| P6 | Lógica signup extraída para `lib/auth/signup.ts` |
| P15 | `requireOwner()` extraído para `lib/school.ts` |
| P19 | `calendario/actions.ts` e `mais/actions.ts` partidos por domínio |
| P20 | `StepPersonal` partilhado em `components/auth/step-personal.tsx` |
| P10+17 | `AGENTS.md` atualizado com 25 migrations |
| P18 | Ref `seed-test-session` removida |
| Low | `eslint.json` apagado; pastas vazias removidas; dead code removido; -3 unused images; placeholder disclaimers removidos |
| CSS | `react-datepicker` + `fadeSlideDown` dead CSS removido de `global.css` |
| Zod | `cancelledAtRefinement()` extraído para `helpers.ts`, aplicado em 4 schemas de bookings |

### COMPLETO
| Item | O quê |
|------|-------|
| BottomSheet | Componente partilhado criado e aplicado em alunos(3), servicos(2), mais(5), metricas(1) — 11 instâncias |
| ConfirmDialog | Componente partilhado criado e aplicado em alunos(2), calendario(1), servicos(1) — 4 instâncias |
| ErrorBoundary | Componente partilhado criado |
| `school.name` fix | `select("id")` → `select("id, name")` em `alunos/actions.ts` |
| `.find()` type fix | Tipo `{ email: string }` removido do callback em `alunos/actions.ts` |
| Perfil security | `updateProfile` + `updatePassword` migradas para `requireServerContext()`, rate limit, audit logging, Zod validation field-level, phone split input, build verified |

### Mantido como está
- `dashboard-view.tsx` modais (Sessões + Alertas) — usam header `border-b` com "Fechar", sem handle, sem footer — não alinha com BottomSheet atual

### Pendentes (HIGH)
- `console.log` em produção
- Botões sem `type` explícito
- `step-email` duplicado
- `aria-labels` em falta

## Security Checks
1. Security is the most important thing on the software, NEVER compromise it for whatever reason.
2. If you have any question regarding security or something that can break, ask directly to me before commit anything.
3. **Usa os helpers do `create-action.ts` sempre que possível** — eles impõem todos os 7 pontos automaticamente:
   - `defineMutation()` — CSRF + auth + rate limit + ownership (`checkAccess`) + sanitização de erros
   - `defineQuery()` — auth + ownership para leituras
   - `definePublicAction()` — público com rate limit opcional
   - `requireServerContext()` — migração incremental de actions manuais
4. Todo o código NOVO (features, endpoints, componentes, actions, formulários públicos, integrações) deve ser verificado contra estes 7 pontos de segurança antes de ser considerado completo:
   - Proteção CSRF (origin vs host) em server actions mutáveis
   - Rate limiting (público com Turnstile, autenticado por user)
   - Input validation com Zod schemas partilhados
   - Auth + ownership verificados no servidor antes de usar admin client
   - Dados sensíveis (passwords, tokens) nunca em logs ou respostas de erro
   - Sessão invalidada após alteração de password
   - Audit logging para operações destrutivas

## Rate Limit & Captcha
- `getClientIp()` usa o último IP da cadeia `x-forwarded-for` (confiável do proxy) para prevenir spoofing
- Cloudflare Turnstile nas actions públicas (`comprarPackPublico`, `criarReservaPublica`) — gratuito, sem limites, invisível para o utilizador
- `TURNSTILE_SECRET_KEY` e `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no .env.local
- Se a chave não estiver configurada, o Turnstile é ignorado (dev-safe)
- Ficheiros: `src/lib/turnstile.ts` (verificação server-side), `src/app/escolas/[slug]/_components/turnstile-widget.tsx` (hook React `useTurnstile()`)

---

## Stripe Integration Guide

Este documento descreve o plano de integração Stripe Checkout. Deve ser lido antes de qualquer implementação Stripe para garantir que o agente segue o desenho acordado.

### Visão Geral

O Stripe Checkout substitui o atual fluxo offline (exibir IBAN/MBWay) por um checkout hospedado pela Stripe. O **Step 3 (Dados do Pagador)** mantém-se inalterado — os campos `name` e `email` são copiados para preencher automaticamente o Stripe Checkout (`customer_email`, `customer_name`). O `phone` fica apenas na nossa base de dados (Stripe Checkout não aceita telefone no prefill).

Existem 3 cenários de checkout:

| Cenário | Server action | O que cria | Stripe Checkout contém |
|---------|--------------|------------|------------------------|
| Aula (múltiplas sessões) | `criarReservaPublica()` | booking_groups + bookings (unpaid) | line_items com cada sessão, customer_email, customer_name |
| Aluguer | `criarReservaAluguer()` | session + booking_group + booking (unpaid) | line_item com o aluguer, customer_email, customer_name |
| Pack | `comprarPackPublico()` | pack_purchases (pendente) | line_item com o pack, customer_email, customer_name |

### Fluxo Completo (Aula/Aluguer)

```
1. Utilizador preenche Step 3 (nome, email, telefone)
2. Server action cria a reserva com payment_status = 'unpaid'
3. Em vez de mostrar overlay IBAN/MBWay → criar Stripe Checkout Session
4. Redirecionar para URL do Stripe Checkout
5. Utilizador paga no Stripe
6. Webhook checkput.session.completed → atualizar payment_status = 'paid_stripe'
```

### Fluxo Completo (Pack)

```
1. Utilizador preenche formulário (nome, email, telefone)
2. comprarPackPublico() cria pack_purchases com status = 'pendente'
3. Criar Stripe Checkout Session com metadata.pack_purchase_id
4. Redirecionar para Stripe Checkout
5. Webhook → ativar pack: status = 'active', payment_status = 'pago'
```

### O que NÃO muda

- Step 3 (Dados do Pagador) — **mantém-se exatamente como está**. Os campos `name`, `email`, `phone` continuam a ser guardados na BD.
- Toda a validação existente (Zod, servidor, base de dados).
- O fluxo offline (IBAN/MBWay) continua a funcionar para escolas sem Stripe ativo.

### Variáveis de Ambiente

| Variável | Onde | Obrigatória? | Uso |
|----------|------|--------------|-----|
| `STRIPE_SECRET_KEY` | servidor (server action) | Sim (se stripe_enabled) | Criar Stripe Checkout Sessions |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | cliente | Sim (se stripe_enabled) | Inicializar Stripe.js (se necessário) |
| `STRIPE_WEBHOOK_SECRET` | servidor (webhook handler) | Sim (se stripe_enabled) | Verificar assinatura dos webhooks |
| `NEXT_PUBLIC_BASE_URL` | servidor + cliente | Sim | URLs de retorno (success_url, cancel_url) — provavelmente já existe |

### Schema Alterações (Migration 0028)

```sql
-- 1. Flag para ativar Stripe por escola
alter table schools add column stripe_enabled boolean not null default false;

-- 2. Permitir novos valores de pagamento em bookings
alter table bookings drop constraint bookings_payment_method_check;
alter table bookings add constraint bookings_payment_method_check
  check (payment_method in ('single', 'pack', 'stripe'));

alter table bookings drop constraint bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'paid_offline', 'paid_stripe'));
```

### Webhook Stripe

**Endpoint**: `POST /api/webhooks/stripe`

```typescript
// Pseudocódigo do webhook handler
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { booking_group_id, pack_purchase_id } = session.metadata;

    if (booking_group_id) {
      // Marcar bookings como pagos
      await admin.from('bookings')
        .update({ payment_status: 'paid_stripe' })
        .eq('booking_group_id', booking_group_id);
    }

    if (pack_purchase_id) {
      // Ativar pack
      await admin.from('pack_purchases')
        .update({ status: 'active', payment_status: 'pago' })
        .eq('id', pack_purchase_id);
    }
  }

  return NextResponse.json({ received: true });
}
```

**Nota**: O Stripe verifica a assinatura antes de qualquer lógica de negócio. Nunca confiar no body não verificado.

### Segurança no Webhook

1. **Idempotência via Redis** — Stripe pode entregar o mesmo evento `checkout.session.completed` várias vezes. O handler verifica `stripe:idempotent:{session.id}` antes de atualizar a BD:
   ```typescript
   const jáProcessado = await redis.get(`stripe:session:${session.id}`);
   if (jáProcessado) return NextResponse.json({ received: true });
   await redis.set(`stripe:session:${session.id}`, true, { ex: 86400 });
   ```

2. **Assinatura obrigatória** — `stripe.webhooks.constructEvent()` rejeita qualquer payload não assinado com `STRIPE_WEBHOOK_SECRET`. Nunca processar um evento sem esta verificação.

3. **Validação de metadata** — `booking_group_id` e `pack_purchase_id` são UUIDs (não incrementais), sem risco de enumeração. Validar que são UUIDs antes de usar.

4. **Rate limiting no endpoint** — o webhook Stripe tem um IP fixo documentado, mas por segurança aplicar rate limit por IP no handler.

5. **Logging de eventos** — registar todos os eventos recebidos com `logger.info()` para auditoria e debugging.

### Segurança nas Server Actions (Checkout Session)

1. **Rate limiting** — `criarCheckoutSessionAula()` e `criarCheckoutSessionPack()` devem usar rate limit (ex: 10 req/min por IP) para evitar abuso (gerar sessões Stripe sem intenção de pagar).

2. **CSRF** — ambas as actions são chamadas do frontend público e devem usar `assertValidOrigin()`.

3. **Validar stripe_enabled** — verificar que a escola tem `stripe_enabled = true` antes de criar sessão. Devolver erro se Stripe não estiver ativo.

4. **Validar valores** — `price_cents` > 0, `customer_email` com formato válido, `customer_name` não vazio.

5. **Sem exposição de secrets** — o `STRIPE_SECRET_KEY` nunca sai do servidor. Cliente só vê o `url` da sessão.

### Validação ao Arranque

Na inicialização do servidor (ou lazy import), validar que se alguma escola tem `stripe_enabled = true`, então `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` existem:

```typescript
// src/lib/stripe-server.ts
const requiredVars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;
for (const v of requiredVars) {
  if (!process.env[v]) {
    throw new Error(`Falta variável de ambiente: ${v}`);
  }
}
```

Isto evita falhas silenciosas quando um utilizador tenta pagar e a chave não está configurada.

### Criar Stripe Checkout Session (Aula/Aluguer)

Após a criação da reserva com sucesso (mas antes de mostrar overlay), o frontend chama uma nova server action (ou a mesma devolve o URL):

```typescript
export async function criarCheckoutSessionAula(
  bookingGroupIds: string[],
  customerEmail: string,
  customerName: string,
): Promise<{ url: string } | { error: string }> {
  const schoolId = await getSchoolIdFromBooking(bookingGroupIds[0]);
  const school = await getSchoolStripeInfo(schoolId);
  if (!school?.stripe_enabled) return { error: 'Stripe não ativado' };

  const lineItems = await buildLineItemsForBookings(bookingGroupIds);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,     // ← preenchido do Step 3
    line_items: lineItems,
    metadata: {
      booking_group_id: bookingGroupIds[0],
      school_id: schoolId,
    },
    success_url: `${baseUrl}/escolas/${schoolSlug}?stripe=success`,
    cancel_url: `${baseUrl}/escolas/${schoolSlug}?stripe=cancel`,
  });

  return { url: session.url! };
}
```

### Criar Stripe Checkout Session (Pack)

```typescript
export async function criarCheckoutSessionPack(
  packPurchaseId: string,
  packPriceCents: number,
  packName: string,
  customerEmail: string,
  customerName: string,
  schoolId: string,
): Promise<{ url: string } | { error: string }> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,     // ← preenchido do Step 3
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: packName },
        unit_amount: packPriceCents,
      },
      quantity: 1,
    }],
    metadata: {
      pack_purchase_id: packPurchaseId,
      school_id: schoolId,
    },
    success_url: `${baseUrl}/escolas/${slug}?stripe=success`,
    cancel_url: `${baseUrl}/escolas/${slug}?stripe=cancel`,
  });

  return { url: session.url! };
}
```

### Decisão UI: Quando mostrar Stripe vs Offline

O overlay de sucesso atual (que mostra IBAN/MBWay) deve verificar:

```typescript
if (school.stripe_enabled) {
  // Criar Stripe Checkout Session e redirecionar
  const { url } = await criarCheckoutSessionAula(bookingGroupIds, email, name);
  window.location.href = url;
} else {
  // Mostrar overlay offline atual (IBAN/MBWay)
  showOfflinePaymentOverlay(iban, mbway);
}
```

### Checklist de Implementação

- [ ] Migration 0028: adicionar `stripe_enabled` a schools, atualizar CHECK constraints
- [ ] Criar `src/lib/stripe-server.ts` — inicializar Stripe com `STRIPE_SECRET_KEY`
- [ ] Criar `POST /api/webhooks/stripe` — handler com verificação de assinatura
- [ ] Criar server action `criarCheckoutSessionAula()` (aceita bookingGroupIds + email + name)
- [ ] Criar server action `criarCheckoutSessionPack()` (aceita packPurchaseId + email + name)
- [ ] Alterar overlay de sucesso: se stripe_enabled → redirecionar para Stripe Checkout
- [ ] Configurar Stripe Webhook no dashboard Stripe (apontar para `/api/webhooks/stripe`)
- [ ] Adicionar variáveis de ambiente ao .env.local e à plataforma de deployment
- [ ] Testar fluxo completo: reserva → Stripe Checkout → webhook → booking paid_stripe
- [ ] Testar fluxo offline continua a funcionar (escolas sem stripe_enabled)