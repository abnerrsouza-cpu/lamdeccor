import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Em produção (Railway), o caminho pode ser configurado via env (Volume mount)
const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'lam.db');
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;

/**
 * Versão do schema (PRAGMA user_version). As migrações rodam uma única vez por
 * banco: sem isso, cada worker do `next build` tentava escrever ao mesmo tempo
 * e o SQLite devolvia SQLITE_BUSY. Ao adicionar migração nova, incremente aqui.
 *   1 - multi-empresa (tabela empresas + empresa_id nas tabelas do hub)
 *   2 - módulo de parceiros (parceiros, indicações e conversas)
 */
const SCHEMA_VERSION = 2;

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  // busy_timeout precisa vir primeiro: vários processos (workers do `next build`,
  // dev server) abrem o mesmo arquivo e até o journal_mode disputa lock.
  _db.pragma('busy_timeout = 8000');
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  ensureSchema(_db);
  return _db;
}

function ensureSchema(db: Database.Database) {
  const versao = (db.pragma('user_version', { simple: true }) as number) ?? 0;
  if (versao >= SCHEMA_VERSION) return;

  backupAntesDeMigrar(db, versao);

  db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      subtitulo TEXT DEFAULT 'Marketing Hub',
      logo_url TEXT,
      cor TEXT DEFAULT '#0F2A4A',
      ativa INTEGER DEFAULT 1,
      ordem INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lojas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cidade TEXT NOT NULL,
      endereco TEXT,
      empresa_id INTEGER REFERENCES empresas(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      nome TEXT NOT NULL,
      usuario TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      senha TEXT,
      role TEXT NOT NULL,
      hierarquia INTEGER DEFAULT 5,
      cargo TEXT,
      loja_id INTEGER REFERENCES lojas(id),
      ativo INTEGER DEFAULT 1,
      acesso_global INTEGER DEFAULT 0,
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS acessos_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notificacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      user_id INTEGER REFERENCES users(id),
      titulo TEXT NOT NULL,
      mensagem TEXT,
      tipo TEXT DEFAULT 'info',
      link TEXT,
      lida INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS influencers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      nome TEXT NOT NULL,
      handle TEXT,
      cidade TEXT,
      loja_id INTEGER REFERENCES lojas(id),
      perfil TEXT,
      alcance_medio INTEGER DEFAULT 0,
      engajamento REAL DEFAULT 0,
      cache_mensal REAL DEFAULT 0,
      bonus_pct REAL DEFAULT 0,
      status TEXT DEFAULT 'prospeccao',
      observacoes TEXT,
      avatar_url TEXT,
      valor_acordo REAL DEFAULT 0,
      acordo_inicio TEXT,
      acordo_fim TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS influencer_redes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      rede TEXT NOT NULL,
      url TEXT,
      seguidores INTEGER DEFAULT 0,
      engajamento REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS influencer_campanhas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      campanha_nome TEXT NOT NULL,
      data_inicio TEXT,
      data_fim TEXT,
      investimento REAL DEFAULT 0,
      vendas_atribuidas REAL DEFAULT 0,
      views INTEGER DEFAULT 0,
      engajamentos INTEGER DEFAULT 0,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS campanhas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      nome TEXT NOT NULL,
      slogan TEXT,
      data_inicio TEXT,
      data_fim TEXT,
      orcamento REAL DEFAULT 0,
      kpi_base TEXT,
      status TEXT DEFAULT 'planejamento',
      capa_cor TEXT DEFAULT '#2D5F97',
      arquivada INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campanha_canais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campanha_id INTEGER NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
      canal TEXT NOT NULL,
      conteudo TEXT,
      ordem INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      titulo TEXT NOT NULL,
      data TEXT NOT NULL,
      hora_inicio TEXT,
      hora_fim TEXT,
      tipo TEXT DEFAULT 'campanha',
      local TEXT,
      loja_id INTEGER REFERENCES lojas(id),
      organizador_id INTEGER REFERENCES users(id),
      descricao TEXT,
      ata TEXT,
      cor TEXT DEFAULT '#2D5F97'
    );

    CREATE TABLE IF NOT EXISTS evento_convidados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'convidado'
    );

    CREATE TABLE IF NOT EXISTS anuncios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      campanha TEXT NOT NULL,
      plataforma TEXT NOT NULL,
      status TEXT DEFAULT 'ativo',
      investimento REAL DEFAULT 0,
      impressoes INTEGER DEFAULT 0,
      cliques INTEGER DEFAULT 0,
      conversoes INTEGER DEFAULT 0,
      cpc REAL DEFAULT 0,
      ctr REAL DEFAULT 0,
      data_inicio TEXT,
      data_fim TEXT
    );

    CREATE TABLE IF NOT EXISTS integracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      plataforma TEXT NOT NULL,
      nome_conta TEXT,
      conectado INTEGER DEFAULT 0,
      ultima_sync TEXT,
      detalhes TEXT
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      titulo TEXT NOT NULL,
      texto TEXT,
      rede TEXT NOT NULL,
      formato TEXT NOT NULL,
      status TEXT DEFAULT 'rascunho',
      data_publicacao TEXT,
      hora TEXT,
      responsavel_id INTEGER REFERENCES users(id),
      campanha TEXT,
      hashtags TEXT,
      midia_url TEXT,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS financeiro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      tipo TEXT NOT NULL,
      categoria TEXT,
      descricao TEXT,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      campanha TEXT,
      loja_id INTEGER REFERENCES lojas(id),
      fornecedor TEXT,
      nf_numero TEXT,
      nf_arquivo TEXT,
      observacoes TEXT,
      status TEXT DEFAULT 'pago'
    );

    CREATE TABLE IF NOT EXISTS solicitacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      tipo TEXT DEFAULT 'outro',
      titulo TEXT NOT NULL,
      descricao TEXT,
      loja_id INTEGER NOT NULL REFERENCES lojas(id),
      solicitante_id INTEGER REFERENCES users(id),
      responsavel_id INTEGER REFERENCES users(id),
      prioridade TEXT DEFAULT 'media',
      status TEXT DEFAULT 'aberta',
      prazo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parceiros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      nome TEXT NOT NULL,
      tipo TEXT,
      responsavel TEXT,
      telefone TEXT,
      email TEXT,
      instagram TEXT,
      cidade TEXT,
      endereco TEXT,
      status TEXT DEFAULT 'prospeccao',
      data_ativacao TEXT,
      comissao_pct REAL DEFAULT 0,
      observacoes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parceiro_indicacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parceiro_id INTEGER NOT NULL REFERENCES parceiros(id) ON DELETE CASCADE,
      cliente_nome TEXT NOT NULL,
      cliente_contato TEXT,
      servico TEXT,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'nova',
      valor REAL DEFAULT 0,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS parceiro_conversas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parceiro_id INTEGER NOT NULL REFERENCES parceiros(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      canal TEXT DEFAULT 'whatsapp',
      resumo TEXT,
      autor_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS afazeres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      titulo TEXT NOT NULL,
      descricao TEXT,
      coluna TEXT DEFAULT 'a_fazer',
      prioridade TEXT DEFAULT 'media',
      time TEXT,
      responsavel_id INTEGER REFERENCES users(id),
      campanha TEXT,
      prazo TEXT,
      ordem INTEGER DEFAULT 0,
      checklist TEXT,
      anexos TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ---------------------------------------------------------------------
  // Migrações idempotentes (rodam em bancos que já existiam antes)
  // ---------------------------------------------------------------------
  addColumn(db, 'campanhas', 'arquivada', 'INTEGER DEFAULT 0');
  addColumn(db, 'users', 'acesso_global', 'INTEGER DEFAULT 0');
  for (const t of TABELAS_POR_EMPRESA) {
    addColumn(db, t, 'empresa_id', 'INTEGER REFERENCES empresas(id)');
  }

  // integracoes tinha UNIQUE(plataforma) global; agora é único por empresa
  dropUniquePlataformaIntegracoes(db);

  seedEmpresas(db);

  // Registros anteriores à multi-empresa pertencem à LAM
  for (const t of TABELAS_POR_EMPRESA) {
    db.prepare(`UPDATE ${t} SET empresa_id = ? WHERE empresa_id IS NULL`).run(EMPRESA_LAM);
  }
  // Diretoria/admin nasce com acesso às duas empresas
  db.prepare(
    `UPDATE users SET acesso_global = 1 WHERE role IN ('admin', 'diretor') AND acesso_global = 0`
  ).run();

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_integracoes_empresa_plataforma
      ON integracoes(empresa_id, plataforma);
    CREATE INDEX IF NOT EXISTS idx_indicacoes_parceiro ON parceiro_indicacoes(parceiro_id);
    CREATE INDEX IF NOT EXISTS idx_conversas_parceiro  ON parceiro_conversas(parceiro_id, data DESC);
  `);

  db.pragma(`user_version = ${SCHEMA_VERSION}`);
}

/** Tabelas cujos registros pertencem a uma empresa específica. */
export const TABELAS_POR_EMPRESA = [
  'lojas', 'users', 'notificacoes', 'influencers', 'campanhas', 'eventos',
  'anuncios', 'integracoes', 'posts', 'financeiro', 'solicitacoes', 'afazeres',
  'parceiros',
] as const;

export const EMPRESA_LAM = 1;
export const EMPRESA_HIGIX = 2;

/**
 * Snapshot do banco antes de qualquer migração destrutiva (a tabela integracoes
 * é recriada, por exemplo). Roda uma vez por versão de schema, direto no volume
 * do Railway, e nunca derruba o boot: se o backup falhar, seguimos com log.
 *
 * VACUUM INTO gera uma cópia consistente incluindo o WAL — copiar o .db na mão
 * deixaria transações pendentes para trás.
 */
function backupAntesDeMigrar(db: Database.Database, versaoAtual: number) {
  // Banco recém-criado não tem o que preservar
  const jaExiste = (db.prepare(
    `SELECT COUNT(*) as c FROM sqlite_master WHERE type = 'table' AND name = 'users'`
  ).get() as { c: number }).c;
  if (!jaExiste) return;

  const carimbo = new Date().toISOString().replace(/[:.]/g, '-');
  const destino = path.join(DATA_DIR, `lam.backup-v${versaoAtual}-${carimbo}.db`);
  try {
    // Bind parameter: aspas duplas viram identificador no SQLite, não string
    db.prepare('VACUUM INTO ?').run(destino);
    console.log(`[db] backup pré-migração salvo em ${destino}`);
  } catch (err) {
    console.error('[db] não foi possível gerar o backup pré-migração:', err);
  }
}

function addColumn(db: Database.Database, tabela: string, coluna: string, tipo: string) {
  const cols = db.prepare(`PRAGMA table_info(${tabela})`).all() as Array<{ name: string }>;
  if (cols.some(c => c.name === coluna)) return;
  db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`);
}

function seedEmpresas(db: Database.Database) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO empresas (id, nome, slug, subtitulo, logo_url, cor, ordem)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(EMPRESA_LAM, 'LAM Deccor', 'lam', 'Marketing Hub', '/logo.jpg', '#0F2A4A', 1);
  const higixNova = insert.run(EMPRESA_HIGIX, 'Higix', 'higix', 'Lavagens Especiais', null, '#0B3B36', 2);

  // Solicitacoes.loja_id é NOT NULL, então a empresa nova precisa de ao menos
  // uma unidade para o módulo funcionar. Só na criação — não recria se apagarem.
  if (higixNova.changes > 0) {
    db.prepare('INSERT INTO lojas (nome, cidade, endereco, empresa_id) VALUES (?, ?, ?, ?)')
      .run('Higix Matriz', '', null, EMPRESA_HIGIX);
  }
}

/**
 * A tabela integracoes nasceu com `plataforma TEXT NOT NULL UNIQUE`, o que impede
 * a mesma plataforma (ex: Meta Ads) em duas empresas. SQLite não remove UNIQUE de
 * coluna, então a tabela é recriada quando o índice antigo ainda existe.
 */
function dropUniquePlataformaIntegracoes(db: Database.Database) {
  const indices = db.prepare(`PRAGMA index_list(integracoes)`).all() as Array<{ name: string; unique: number; origin: string }>;
  const antigo = indices.find(i => i.origin === 'u' && i.unique === 1);
  if (!antigo) return;
  const cols = db.prepare(`PRAGMA index_info(${JSON.stringify(antigo.name)})`).all() as Array<{ name: string }>;
  if (!cols.some(c => c.name === 'plataforma') || cols.length !== 1) return;

  db.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    CREATE TABLE integracoes_novo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empresa_id INTEGER REFERENCES empresas(id),
      plataforma TEXT NOT NULL,
      nome_conta TEXT,
      conectado INTEGER DEFAULT 0,
      ultima_sync TEXT,
      detalhes TEXT
    );
    INSERT INTO integracoes_novo (id, empresa_id, plataforma, nome_conta, conectado, ultima_sync, detalhes)
      SELECT id, empresa_id, plataforma, nome_conta, conectado, ultima_sync, detalhes FROM integracoes;
    DROP TABLE integracoes;
    ALTER TABLE integracoes_novo RENAME TO integracoes;
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}
