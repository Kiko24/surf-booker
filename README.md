# Alaia

Plataforma de gestão para escolas de surf e desportos aquáticos. Os alunos reservam online, o dono da escola gere tudo num só lugar — calendário, alunos, serviços e pagamentos.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL, RLS, Storage)
- **Auth**: Supabase Auth (magic link + password)
- **Rate Limiting**: Upstash Redis

## Funcionalidades

### Página Pública
- Diretório de escolas com pesquisa semântica
- Página de cada escola com galeria, info, serviços e instrutores
- Calendário público com reserva online (auth + guest)
- Comprar packs com créditos consumidos automaticamente

### Dashboard (dono da escola)
- Visão geral com KPIs
- Gestão de calendário: criar/editar/cancelar aulas (sessões)
- Check-in de alunos em cada sessão
- Gestão de alunos: lista, pesquisa, histórico, waivers
- Configurações: info do negócio, instrutores, imagens, definições

### Perfil do Cliente
- Visão geral com histórico e estatísticas
- Histórico de aulas
- Lista de packs e créditos restantes
- Definições da conta
- Favoritos (escolas guardadas)
- Waivers assinados

### Segurança
- Row Level Security (RLS) em todas as tabelas
- Server actions validam auth + ownership
- Admin client (service_role) usado apenas após verificação no servidor
- Rate limiting em todas as ações críticas
- Audit logging em operações destrutivas
- Validação de uploads (tamanho, tipo, magic bytes)

## Estrutura

```
src/
├── app/
│   ├── _components/        # Componentes partilhados
│   ├── escolas/[slug]/     # Página pública da escola
│   ├── dashboard/          # Dashboard do dono
│   ├── perfil/             # Perfil do cliente
│   └── onboarding/         # Setup inicial
├── lib/
│   ├── supabase/           # Clientes server, client, admin
│   ├── rate-limit.ts       # Rate limiting (Upstash)
│   └── audit.ts            # Audit logging
└── supabase/migrations/    # Migrations SQL (0021)
```

## Desenvolvimento

```bash
npm install
npm run dev
```

## Migrations

As migrations estão em `supabase/migrations/` e são aplicadas manualmente via `supabase migration up`. Cada migration tem um prefixo numérico (0001–0021).

## Licença

Uso privado.
