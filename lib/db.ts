import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Em produção (Railway), o caminho pode ser configurado via env (Volume mount)
const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'lam.db');
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  ensureSchema(_db);
  return _db;
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lojas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cidade TEXT NOT NULL,
      endereco TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      usuario TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      senha TEXT,
      role TEXT NOT NULL,
      hierarquia INTEGER DEFAULT 5,
      cargo TEXT,
      loja_id INTEGER REFERENCES lojas(id),
      ativo INTEGER DEFAULT 1,
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
      plataforma TEXT NOT NULL UNIQUE,
      nome_conta TEXT,
      conectado INTEGER DEFAULT 0,
      ultima_sync TEXT,
      detalhes TEXT
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    CREATE TABLE IF NOT EXISTS afazeres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

  // Migrações idempotentes (rodam só se a coluna ainda não existe)
  const migrations: Array<[string, string]> = [
    ['campanhas', "ALTER TABLE campanhas ADD COLUMN arquivada INTEGER DEFAULT 0"],
  ];
  for (const [_table, sql] of migrations) {
    try { db.exec(sql); } catch { /* coluna já existe */ }
  }
}
