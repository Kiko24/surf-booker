# Surf Booker — Checklist (Pendente)

## 🐛 Known Issues (Por Corrigir)
- [ ] BSS school tem dados; Oporto school tem 0 class_types, 0 instructors, 0 images

## 📌 Not Started (Por Implementar)
- [ ] Check-in / attendance marking
- [ ] Email/notification system (agendado para depois do Stripe)
- [ ] Student profile page with full history
- [ ] Integração Stripe (pendente — última prioridade)
- [ ] Criar test school via onboarding para validar end-to-end
- [ ] SEO: meta tags, Open Graph, JSON-LD para school page
- [ ] Dashboard alunos: ver pack_purchases com créditos restantes
- [x] `/escolas` directory page — resolvida (criada DirectoryView + search)
- [x] Wire `booking-modal.tsx` + `criarReservaPublica()` for aula sessions
- [x] Wire pack/aluguer "Continuar" — `comprarPackPublico()` + créditos
- [x] `getSchoolInfo()` — `phone` field na query (já estava incluído)
- [x] Tema — accent unificado (`#1E6FA8`) em ambos os temas

## ✅ WCAG 2.1 AA — Global Issues (Corrigido)
- [x] **G1** — `<h2>` → `<h1>` no `dashboard-view.tsx`
- [x] **G2** — Scrollbar oculta substituída por visível fina em `dashboard-layout.tsx` e `metricas-view.tsx`
- [x] **G3** — `aria-describedby` + `aria-invalid` nos inputs com erro em `servicos-view.tsx`
- [x] **G4** — `lang="pt-PT"` (já estava no `layout.tsx`)
- [x] **G5** — Link "Saltar para o conteúdo principal" + `id="main-content"` no `dashboard-layout.tsx`

## ✅ Before Making Changes
- [ ] Ler `AGENTS.md` primeiro
- [ ] Ler os ficheiros relevantes antes de editar
- [ ] Verificar `supabase/migrations/` para tabelas/policies existentes
- [ ] Respeitar UI patterns existentes (bottom sheets, Tailwind classes, naming)
- [ ] Build: `npx next build` antes de finalizar
- [ ] Apenas commit quando explicitamente pedido
- [ ] Cópia em Português (PT)
- [ ] Dúvida de segurança? Perguntar antes de commitar
