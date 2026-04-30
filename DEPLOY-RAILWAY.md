# Deploy do LAM Marketing Hub no Railway

Guia passo-a-passo pra colocar o sistema no ar em produção.

---

## Resumo

- **Plataforma:** Railway (railway.app)
- **Custo:** Plano Hobby cobre o uso (US$ 5/mês) — primeiro mês usa créditos grátis
- **Banco:** SQLite com **Volume persistente** do Railway (não some entre deploys)
- **HTTPS:** automático (Railway emite e renova certificado)
- **Domínio:** `seu-app.up.railway.app` por padrão; pode plugar domínio próprio depois

---

## Pré-requisitos

1. **Conta no GitHub** (railway puxa o código de lá)
2. **Conta no Railway** — `railway.app` (login com GitHub)
3. **Git configurado no Mac** (já temos)

---

## Passo 1: Subir o código pro GitHub

Se ainda não fez:

```bash
cd "/Users/abnerrost/Documents/Claude/Projects/ANALISE MKT"

# Inicializa git
git init
git branch -M main

git config user.name "Abner Rost"
git config user.email "abner@lamdeccor.com.br"

# Cria gitignore se não tiver (já temos)
git add -A
git commit -m "feat: LAM Marketing Hub - pronto para deploy"

# Cria repo no GitHub direto pelo CLI (precisa do gh instalado)
# brew install gh && gh auth login
gh repo create lam-marketing-hub --private --source=. --remote=origin --push
```

Se preferir manual: cria o repo em github.com/new, copia o `git remote add origin ...` que aparece e dá `git push -u origin main`.

---

## Passo 2: Criar projeto no Railway

1. Vai em **railway.app** → login com GitHub
2. Clica em **New Project** → **Deploy from GitHub repo**
3. Autoriza Railway a acessar seus repos
4. Seleciona o `lam-marketing-hub`
5. Railway começa o build automaticamente

⏳ O primeiro build leva uns **5-10 minutos** (compila better-sqlite3 nativo + Next.js).

---

## Passo 3: Adicionar Volume persistente (CRÍTICO)

O Railway tem filesystem efêmero — sem volume o banco SQLite some a cada deploy. Pra persistir:

1. No projeto do Railway, clica no serviço (o card que apareceu)
2. Vai na aba **Settings**
3. Scroll até **Volumes** → **+ New Volume**
4. Configura:
   - **Mount path:** `/app/data`
   - **Size:** 1 GB (mais que suficiente pra começar)
5. Clica em **Add**

Depois disso, vai na aba **Variables** e adiciona:

```
DATABASE_PATH=/app/data/lam.db
```

Isso faz o `lib/db.ts` apontar pro volume montado. Próximo deploy já vai persistir os dados.

---

## Passo 4: Variáveis de ambiente

Em **Settings → Variables** confirme/adicione:

```
NODE_ENV=production
DATABASE_PATH=/app/data/lam.db
```

`PORT` o Railway define sozinho (não mexer).

---

## Passo 5: Domínio público

1. Em **Settings → Networking** → **Generate Domain**
2. Railway gera algo como `lam-marketing-hub-production.up.railway.app`
3. Esse já é o link público com HTTPS pronto

**Domínio próprio (depois):**
- Compra o domínio (ex: `marketing.lamdeccor.com.br`)
- Em **Networking → Custom Domain** cola o domínio
- Configura o DNS no provedor (CNAME apontando pro Railway)

---

## Passo 6: Acessar

Abre o domínio gerado → tela de login aparece → entra com `admin` / `admin123`.

⚠️ **Primeiro acesso pode levar 30s** porque o seed inicial roda (popula 5 lojas, 9 usuários, campanhas, etc.). A partir daí, é instantâneo.

---

## Passo 7: Trocar a senha do admin

Em produção, NÃO deixa a senha como `admin123`. Pra trocar:

**Opção rápida (via banco):**
1. No Railway, abre o **Shell** do serviço (ícone de terminal)
2. Roda:
   ```bash
   cd /app/data
   sqlite3 lam.db
   UPDATE users SET senha = 'sua-senha-forte-aqui' WHERE usuario = 'admin';
   .exit
   ```
3. Logout e login com a nova senha.

**Opção propriamente feita (próxima sprint):**
- Implementar auth com `bcryptjs` e tela de "trocar senha" no app.

---

## Como atualizar o código depois

Toda vez que você der `git push`, o Railway faz redeploy automático. Fluxo:

```bash
# Faz mudanças nos arquivos
# Testa local
npm run dev

# Commita e sobe
git add -A
git commit -m "feat: descrição da mudança"
git push

# Railway detecta o push, builda e deploya em ~3 min
```

Acompanha em tempo real na aba **Deployments** do Railway.

---

## Troubleshooting

### Build falha em `better-sqlite3`
- Confirma que tem `nixpacks.toml` no repo (incluído neste projeto)
- Esse arquivo força o nixpacks a instalar Python e gcc, necessários pra compilar a lib nativa

### Banco resetou após deploy
- Você esqueceu o Volume. Volta no Passo 3.
- Confere que `DATABASE_PATH=/app/data/lam.db` está nas variáveis
- Os dados do banco antigo ficam no Volume — não dá pra recuperar do efêmero

### "502 Bad Gateway" ou "Application failed to respond"
- Vai em **Deployments** → último deploy → **View Logs**
- Procure mensagem de erro vermelha
- 90% das vezes é uma das 3:
  1. Variável de ambiente faltando
  2. Build incompleto (rebuilda manual no botão "Redeploy")
  3. SQLite não conseguiu criar o arquivo (Volume não montou)

### Logo não aparece em produção
- Confirma que o arquivo `public/logo.jpg` foi commitado no git (`git ls-files | grep logo`)
- Se não, faz `git add public/logo.jpg && git commit -m 'add logo' && git push`

### Login não persiste (cookie sumindo)
- Em produção exigimos `secure: true` (cookie só por HTTPS)
- Railway sempre serve em HTTPS, então funciona
- Se você criar domínio custom, certifica que o certificado SSL está válido

---

## Custos esperados

- **Hobby plan**: US$ 5/mês de crédito incluso
- Esse projeto consome ~US$ 2-3/mês com volume + tráfego baixo (uso interno)
- Sobra crédito pra outros projetos pequenos no Hobby

Se passar disso, Railway alerta antes de cobrar.

---

## Backup do banco

Periodicamente vale fazer dump do banco. No Railway Shell:

```bash
cd /app/data
sqlite3 lam.db ".backup '/app/data/backup-$(date +%Y%m%d).db'"
ls -la
```

Pra baixar pra sua máquina, instala o Railway CLI (`npm i -g @railway/cli`):

```bash
railway login
railway link  # liga ao projeto
railway run cp /app/data/lam.db /tmp/lam.db
# Depois usa o "Volume Browser" (paga ou plugin) ou faz dump SQL e copia
```

Pra MVP, fazer um SQL dump de tempos em tempos é suficiente:

```bash
railway run sh -c "cd /app/data && sqlite3 lam.db .dump" > backup.sql
```

---

## Quando migrar pra Postgres

Manter SQLite + Volume é OK até uns ~50 usuários simultâneos ou 10GB de banco. Depois disso, vale migrar pra **Postgres** que o Railway provê com 1 clique:

1. **+ New** → **Database** → **PostgreSQL**
2. Railway gera `DATABASE_URL` automaticamente
3. Migrar de SQLite pra Postgres com Drizzle ORM ou Prisma (próxima sprint quando precisar)

Pra LAM Deccor com 5 lojas e ~10 usuários internos, SQLite + Volume cobre por anos.

---

## Próximos passos depois do deploy

1. Trocar senha `admin123` (Passo 7)
2. Cadastrar usuários reais (substituir os do seed)
3. Apagar dados de exemplo (campanhas, eventos do seed) e cadastrar os reais
4. Configurar domínio próprio se quiser (ex: `marketing.lamdeccor.com.br`)
5. Conectar Meta Ads de verdade (precisa do app review da Meta primeiro)
