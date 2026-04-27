# LAM Marketing Hub

Painel interno do time de marketing da LAM Deccor.
**Next.js 14** + **TypeScript** + **Tailwind CSS** + **SQLite** + **Montserrat**.

## Login

- **Usuário:** `admin`
- **Senha:** `admin123`

Outros usuários (Mariana, Diego, etc.) usam o **primeiro nome em minúsculas** como senha (`mariana`, `diego`...).

## Como rodar

```bash
cd "/Users/abnerrost/Documents/Claude/Projects/ANALISE MKT"
npm install
npm run dev
```

Abre em `http://localhost:3000`. Banco SQLite criado automaticamente em `./data/lam.db` com dados de exemplo.

## Módulos

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs, alertas, próximos eventos, solicitações, afazeres em andamento |
| **Afazeres** | Kanban com botão por coluna; cards abrem modal completo (título, descrição, time, urgência, prazo, checklist, campanha, responsável) |
| **Influencers** | CRUD com foto, abas de redes sociais (IG/TikTok/YT/Kwai/Twitter/LinkedIn), valor e vigência do acordo, campanhas, ROI |
| **Campanhas** | Briefing por canal estilo "Hora da mãe descansar": Instagram, Meta Ads, Google, WhatsApp, RA, Influencers, GMN, Mídia OFF, Designer, Audiovisual, Dados |
| **Calendário** | Grid mensal estilo Google Agenda. Eventos com convidados (multi-select), local, descrição, ata de reunião |
| **Anúncios** | Dashboard + botão **Integrações** para conectar Meta Ads / Google Ads / TikTok / YouTube |
| **Social Media** | 3 visualizações (cards, lista, calendário). Cada post abre página individual com edição |
| **Financeiro** | Gráfico pizza por categoria, fechamento do mês, ROI por campanha. Cada lançamento tem página individual com upload de NF |
| **Solicitações** | Gerentes de loja abrem pedidos tipados (post, anúncio, vídeo, panfleto, arte, evento). Atribuição de responsável e mudança rápida de status |
| **Notificações** | Central de notificações + dropdown na topbar |
| **Usuários** | Cadastro com hierarquia (1 admin → 9 visualizador), monitoramento de acessos |

## Estrutura

```
ANALISE MKT/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Dashboard
│   ├── globals.css                   # Montserrat + design system
│   ├── login/                        # Tela de login
│   ├── api/logout/                   # POST /api/logout
│   ├── afazeres/                     # Kanban com modal
│   ├── influencers/[id]/             # Detalhe + redes + campanhas
│   ├── campanhas/[id]/               # Briefing por canal
│   ├── calendario/[id]/              # Detalhe com convidados/ata
│   ├── anuncios/integracoes/         # Conexão Meta/Google/TikTok/YT
│   ├── social/[id]/                  # Página individual de post
│   ├── financeiro/[id]/              # Página individual + NF
│   ├── solicitacoes/                 # Inbox de pedidos
│   ├── notificacoes/                 # Central
│   └── usuarios/                     # Hierarquia + acessos
├── components/                        # Sidebar, Topbar, StatCard
├── lib/
│   ├── db.ts                          # SQLite + schema
│   ├── auth.ts                        # Login simples por cookie
│   ├── seed.ts                        # Dados de exemplo
│   └── types.ts                       # Tipos do domínio
├── middleware.ts                      # Protege rotas
└── data/                              # SQLite (gitignored)
```

## Tecnologia

- **Next.js 14** App Router + Server Actions
- **better-sqlite3** — banco embarcado, zero setup
- **Tailwind CSS** com paleta navy/cream/gold + **Montserrat**
- **lucide-react** para ícones
- **date-fns** com locale pt-BR
- **TypeScript strict mode**

## Hierarquia de usuários

| Nível | Papel típico |
|---|---|
| 1 | Admin / Diretor |
| 2 | Coordenação |
| 3 | Gestão (tráfego) |
| 4 | Liderança (social, design) |
| 5 | Operacional / Gerente de loja |
| 6 | Estagiário |
| 9 | Visualizador (somente leitura) |

## Próximos passos

1. **Senha real** com `bcryptjs` (hoje plain text — só para MVP)
2. **Sync API Meta Ads / Google Ads** — botão Integrações já tem o fluxo, faltam os jobs cron
3. **Upload real de arquivos** (NF, peças, anexos) com S3/R2
4. **Drag-and-drop otimista** no Kanban com `dnd-kit`
5. **Notificações em tempo real** com WebSocket ou polling
6. **App mobile** simplificado para gerentes de loja abrirem solicitações pelo celular
7. **Migrar para PostgreSQL** quando o time for além de uso local

---

**Da nossa fábrica para sua casa.**
