import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getDb, UPLOADS_DIR } from './db';
import type { Anexo } from './anexos-comum';

export { TIPOS_ACEITOS, TAMANHO_MAX, ehImagem, formatarTamanho } from './anexos-comum';
export type { Anexo } from './anexos-comum';

import { TAMANHO_MAX } from './anexos-comum';

/** O que aceitamos receber. Nada de executável, script ou HTML. */
const TIPOS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
} as const;

/** Assinatura real do arquivo, para não confiar só no que o navegador declara. */
function assinaturaConfere(buf: Buffer, tipo: string) {
  const b = buf.subarray(0, 12);
  switch (tipo) {
    case 'application/pdf': return b.subarray(0, 4).toString('latin1') === '%PDF';
    case 'image/jpeg':      return b[0] === 0xff && b[1] === 0xd8;
    case 'image/png':       return b[0] === 0x89 && b.subarray(1, 4).toString('latin1') === 'PNG';
    case 'image/gif':       return b.subarray(0, 3).toString('latin1') === 'GIF';
    case 'image/webp':      return b.subarray(0, 4).toString('latin1') === 'RIFF'
                                && b.subarray(8, 12).toString('latin1') === 'WEBP';
    default: return false;
  }
}

export type ResultadoUpload = { ok: true; id: number } | { ok: false; erro: string };

/**
 * Grava o arquivo no volume e registra o ponteiro no banco.
 * O nome no disco é sempre gerado aqui — o nome que o usuário enviou é
 * guardado só para exibir, nunca para montar caminho.
 */
export async function salvarAnexo(opts: {
  arquivo: File;
  empresaId: number;
  entidade: 'campanha' | 'aviso';
  entidadeId: number;
  autorId: number | null;
}): Promise<ResultadoUpload> {
  const { arquivo, empresaId, entidade, entidadeId, autorId } = opts;

  if (!arquivo || arquivo.size === 0) return { ok: false, erro: 'Nenhum arquivo enviado.' };
  if (arquivo.size > TAMANHO_MAX) {
    return { ok: false, erro: `Arquivo muito grande (máximo ${TAMANHO_MAX / 1024 / 1024} MB).` };
  }

  const ext = TIPOS[arquivo.type as keyof typeof TIPOS];
  if (!ext) return { ok: false, erro: 'Formato não aceito. Envie imagem (JPG, PNG, WEBP, GIF) ou PDF.' };

  const buf = Buffer.from(await arquivo.arrayBuffer());
  if (!assinaturaConfere(buf, arquivo.type)) {
    return { ok: false, erro: 'O arquivo não corresponde ao formato declarado.' };
  }

  const pasta = String(new Date().getFullYear());
  const destinoDir = path.join(UPLOADS_DIR, pasta);
  fs.mkdirSync(destinoDir, { recursive: true });

  const relativo = path.join(pasta, `${randomUUID()}.${ext}`);
  fs.writeFileSync(path.join(UPLOADS_DIR, relativo), buf);

  const db = getDb();
  const r = db.prepare(`
    INSERT INTO anexos (empresa_id, entidade, entidade_id, nome_original, caminho, tipo, tamanho, autor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    empresaId, entidade, entidadeId,
    arquivo.name.slice(0, 180), relativo, arquivo.type, arquivo.size, autorId
  );

  return { ok: true, id: Number(r.lastInsertRowid) };
}

export function listarAnexos(entidade: string, entidadeId: number, empresaId: number) {
  return getDb().prepare(`
    SELECT * FROM anexos
    WHERE entidade = ? AND entidade_id = ? AND empresa_id = ?
    ORDER BY created_at
  `).all(entidade, entidadeId, empresaId) as Anexo[];
}

/** Apaga o registro e o arquivo. Se o arquivo já sumiu, segue sem reclamar. */
export function apagarAnexo(id: number, empresaId: number) {
  const db = getDb();
  const a = db.prepare('SELECT caminho FROM anexos WHERE id = ? AND empresa_id = ?')
    .get(id, empresaId) as { caminho: string } | undefined;
  if (!a) return false;

  try { fs.unlinkSync(path.join(UPLOADS_DIR, a.caminho)); } catch { /* já não existe */ }
  db.prepare('DELETE FROM anexos WHERE id = ?').run(id);
  return true;
}

