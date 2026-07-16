# TODO — Surf Booker

## Stripe Checkout (ALTA)

- [ ] **Migration 0028** — `stripe_enabled` column em schools, CHECK constraints para `paid_stripe`/`stripe`
- [ ] **Server actions** — `criarCheckoutSessionAula()` e `criarCheckoutSessionPack()`
- [ ] **UI overlay** — BookingModal decide Stripe vs offline com base em `school.stripe_enabled`
- [ ] **`.env.local`** — configurar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] **Setup dashboard Stripe** — apontar webhook para `/api/webhooks/stripe`

## Agendar aula a partir do pack (MÉDIA)

- [ ] **Opção B** — No `/perfil/packs`, cada pack ativo com `remaining > 0` ter botão "Agendar aula"
  - [ ] Navegar para `/escolas/[slug]` da escola desse pack
  - [ ] Pack já pré-selecionado ao chegar à página da escola

## SEO (MÉDIA)

- [ ] **Meta tags + Open Graph** — em `/escolas/[slug]` (title, description, image, url)
- [ ] **JSON-LD** — structured data para School + Course + Event

## Student booking from profile (BAIXA)

- [ ] **Atalho "Agendar nova aula"** no `/perfil`
  - [ ] Lista escolas favoritas/frequentadas
  - [ ] Ao clicar → `/escolas/[slug]` com contacto pré-preenchido

## Sistema de email/notificações (MÉDIA)

- [ ] **Toggles decorativos** — `notifyOwnerBooking()` nunca lê `notify_email_confirmation`; `cancelSession()` nunca lê `notify_sms_cancellation`
- [ ] **Lembretes 24h** — `notify_reminder_24h` não tem cron/job a enviar emails
- [ ] **Sem fila de emails** — tudo inline; sem retry, sem dead-letter
- [ ] **Sem provider SMS** — toggle `notify_sms_cancellation` envia email, não SMS
- [ ] **`RESEND_FROM_EMAIL`** — configurar domínio próprio (fallback `onboarding@resend.dev`)
- [ ] **`notify_new_schedule`** — toggle guarda mas ninguém dispara notificação

## Check-in / presenças (MÉDIA)

- [ ] **Review UI** — `markAttendance`/`markNoShow` existem mas o fluxo precisa de validação

## Code quality (BAIXA)

- [ ] **`console.log` em produção**
- [ ] **Botões sem `type` explícito**
- [ ] **`step-email` duplicado**
- [ ] **`aria-labels` em falta**

## Embed (BAIXA)

- [ ] **Criar iframe/embed** para escolas colocarem nos seus sites → `/escolas/[slug]`

## Infra & testes (BAIXA)

- [ ] **Criar escola de teste via onboarding** — validar fluxo completo end-to-end
- [ ] **Escola "Oporto" com dados incompletos** — corrigir seed ou onboarding
- [ ] **Cobertura de testes** — atualmente < 1%
