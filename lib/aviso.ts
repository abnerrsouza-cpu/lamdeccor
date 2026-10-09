import { getDb } from './db';
import type { AvisoEvento } from '@/app/aviso-evento';

/**
 * O próximo evento que merece aviso em destaque: começa nos próximos 15 dias
 * (ou está em curso) e ainda não teve ciência confirmada por esta pessoa.
 * Eventos da loja da pessoa ou gerais.
 */
export function proximoAviso(emp: number, userId: number, lojaId: number | null, hoje: string) {
  const db = getDb();
  return db.prepare(`
    SELECT e.id, e.titulo, e.data, e.data_fim, e.cor,
      CAST(julianday(e.data) - julianday(?) AS INTEGER) AS dias,
      CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS confirmado
    FROM eventos e
    LEFT JOIN evento_ciencias c ON c.evento_id = e.id AND c.user_id = ?
    WHERE e.empresa_id = ?
      AND COALESCE(e.data_fim, e.data) >= ?
      AND e.data <= date(?, '+15 days')
      AND (e.loja_id IS NULL OR e.loja_id = ?)
      AND c.id IS NULL
    ORDER BY e.data
    LIMIT 1
  `).get(hoje, userId, emp, hoje, hoje, lojaId ?? -1) as AvisoEvento | undefined;
}
