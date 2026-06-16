# Auditoria de Acessibilidade WCAG 2.1 (Nível AA) — Dashboard

**Âmbito**: Todos os componentes do dashboard (8 ecrãs)
**Temas**: dark (padrão) e light
**Data**: 16/06/2026

---

## ✅ Corrigidos (23 issues)

| Issue | Correção |
|-------|----------|
| G1–G5 | `<h1>`, scrollbar visível, `aria-describedby`, `lang="pt"`, skip nav |
| L1 | `aria-label` nos links da nav mobile |
| L2 | `aria-current="page"` nos links da sidebar |
| L3 | `focus-visible:ring-2` em links/botões |
| L5 | `aria-pressed` no toggle de tema |
| C2 | `aria-label="Adicionar evento"` no FAB |
| C3 | Badges "Realizada"/"Cancelada" já têm texto visível (`text-success`/`text-error`) |
| D1 | `aria-expanded` + `aria-controls` nos botões "Ver todas!" |
| D2 | Focus trap + `role="dialog"` + `aria-modal` nos modais |
| C1 | `role="grid"` + `role="gridcell"` + navegação por setas no calendário |
| M1 | `role="tab"`/`tabpanel` + `aria-selected` + navegação por setas |
| A1 | `aria-label` no botão de detalhes de aluno |
| A2 | `role="checkbox"` + `aria-checked` + `aria-label` no waiver |
| A3 | `<label>` + `id` no input de pesquisa de alunos |
| A4 | `aria-pressed` nos filtros de estado |
| M2 | `<label>` + `id` no input de upload de avatar |
| M3 | `aria-expanded` + `aria-controls` no FAQ accordion |
| M4 | `aria-hidden` em SVGs decorativos |
| S1 | `aria-haspopup="dialog"` nos botões de opções |
| S2 | Escape fecha modal de serviço |
| ME1 | `aria-pressed` nos filtros de período |
| ME2 | `aria-label` em valores numéricos |
| ME3 | `role="status"` no loading |

---

## Pendentes

### Contraste de Cores

- **Cor1** — `text-text-muted` no tema claro (verificar)
- **Cor2** — `text-text-secondary` no tema claro (verificar)
- **Cor3** — `bg-error/20` contraste insuficiente (média)

---

## Resumo

| Prioridade | Count | Issues |
|---|---|---|
| **Resolvidas** | 23 | Todas as issues não-cor |
| **Verificar (cor)** | 2 | Cor1, Cor2 |
| **Média (contraste)** | 1 | Cor3 |
| **Total** | **26** | |
