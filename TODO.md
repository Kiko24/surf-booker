# TODO — Surf Booker

## Críticos (pré-lançamento)

- [ ] **Check-in / marcação de presenças** — funcionalidade core não implementada
- [ ] **Sistema de email/notificações (Resend)** — presente mas incompleto
  - [ ] **Toggles `school_settings` são decorativos** — `notifyOwnerBooking()` nunca lê `notify_email_confirmation`; `cancelSession()` nunca lê `notify_sms_cancellation`; `notify_new_schedule` toggle existe mas zero código de broadcast
  - [ ] **Lembretes 24h (`notify_reminder_24h`)** — não existe qualquer sistema de agendamento/cron/job
  - [ ] **Sem fila de emails** — tudo inline; sem retry, sem dead-letter; falha do Resend = notificação perdida silenciosamente
  - [ ] **Sem provider SMS** — toggle `notify_sms_cancellation` envia email, não SMS
  - [ ] **`RESEND_FROM_EMAIL` não configurado** — fallback para `onboarding@resend.dev`
  - [ ] **Sem `notify_new_schedule`** — toggle guarda mas ninguém dispara notificação de novo horário
- [ ] **Criar escola de teste via onboarding** — validar fluxo completo end-to-end com dados reais
- [ ] **Escola "Oporto" com dados incompletos** — 0 class_types, 0 instrutores, 0 imagens (corrigir seed ou onboarding)

## Importantes

- [ ] **Página de perfil do aluno** — histórico completo de sessões, packs, presenças
- [ ] **Visualizar compras de packs** — no dashboard (alunos page), mostrar créditos restantes por aluno
- [ ] **Cobertura de testes** — atualmente < 1% (apenas `format.test.ts`)

## Melhorias

- [ ] **SEO** — meta tags, Open Graph, JSON‑LD para páginas de escola (`/escolas/[slug]`)

##  Reservas

- adicionar check-box para consentir termos da escola step 3
- Pensar como é que vamos fazer nos packs
- Ligar termos e condições da escola aos termos e condições do site de cada escola.

## Embed
- Criar forma fácil de criar embed para quando clicarem nos botões de book, enviar para esta página - como iframe ou outra forma, analisar isto e fazer isto de forma competente.

## Stripe 
- Dar setup na stripe para os pagamentos
