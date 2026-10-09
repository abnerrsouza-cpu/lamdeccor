import Topbar from '@/components/topbar';
import FormRascunho from '@/components/form-rascunho';
import { redirect } from 'next/navigation';
import { Plus, ClipboardCheck, Store } from 'lucide-react';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehAdmin } from '@/lib/permissions';
import { criarItem, hojeISO } from './actions';
import ChecklistLoja, { type ItemChecklist } from './checklist-loja';
import type { Loja } from '@/lib/types';

export default async function ChecklistPage({ searchParams }: {
  searchParams: { loja?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const db = getDb();
  const emp = await getEmpresaId();
  const admin = ehAdmin(user.role);
  const hoje = await hojeISO();

  const lojas = db.prepare(
    'SELECT * FROM lojas WHERE empresa_id = ? ORDER BY nome'
  ).all(emp) as Loja[];

  // Gerente fica preso à própria loja; admin escolhe qual acompanhar
  const lojaId = admin
    ? (Number(searchParams?.loja) || lojas[0]?.id)
    : user.loja_id;

  if (!lojaId) {
    return (
      <>
        <Topbar title="Rotina diária" subtitle="Checklist da loja." />
        <main className="p-4 md:p-6">
          <div className="card p-10 text-center">
            <Store className="w-8 h-8 text-slate-muted mx-auto mb-3" />
            <p className="text-sm text-slate">
              {admin
                ? 'Nenhuma loja cadastrada. Crie uma em Configurações.'
                : 'Sua conta ainda não está ligada a uma loja. Peça ao administrador para definir isso em Usuários.'}
            </p>
          </div>
        </main>
      </>
    );
  }

  const lojaAtual = lojas.find(l => l.id === lojaId);

  // Itens que valem para a loja: os globais da empresa + os extras dela
  const itens = db.prepare(`
    SELECT i.id, i.titulo, i.descricao, i.loja_id,
      CASE WHEN m.id IS NULL THEN 0 ELSE 1 END AS feito,
      u.nome AS feito_por_nome
    FROM checklist_itens i
    LEFT JOIN checklist_marcacoes m
      ON m.item_id = i.id AND m.loja_id = ? AND m.data = ?
    LEFT JOIN users u ON u.id = m.feito_por
    WHERE i.empresa_id = ? AND i.ativo = 1 AND (i.loja_id IS NULL OR i.loja_id = ?)
    ORDER BY i.ordem, i.id
  `).all(lojaId, hoje, emp, lojaId) as ItemChecklist[];

  // Painel do admin: como está cada loja hoje
  const porLoja = admin ? db.prepare(`
    SELECT l.id, l.nome,
      (SELECT COUNT(*) FROM checklist_itens i
        WHERE i.empresa_id = ? AND i.ativo = 1 AND (i.loja_id IS NULL OR i.loja_id = l.id)) AS total,
      (SELECT COUNT(*) FROM checklist_marcacoes m
        JOIN checklist_itens i2 ON i2.id = m.item_id AND i2.ativo = 1
        WHERE m.loja_id = l.id AND m.data = ?) AS feitos
    FROM lojas l WHERE l.empresa_id = ? ORDER BY l.nome
  `).all(emp, hoje, emp) as { id: number; nome: string; total: number; feitos: number }[] : [];

  const dataLonga = new Date(hoje + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  return (
    <>
      <Topbar
        title="Rotina diária"
        subtitle={`${dataLonga[0].toUpperCase()}${dataLonga.slice(1)}${lojaAtual ? ` · ${lojaAtual.nome}` : ''}`}
      />

      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        {admin && porLoja.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-4 h-4 text-navy-500" />
              <h2 className="h2">Como estão as lojas hoje</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {porLoja.map(l => {
                const pct = l.total ? Math.round((l.feitos / l.total) * 100) : 0;
                const completo = l.total > 0 && l.feitos >= l.total;
                return (
                  <Link
                    key={l.id}
                    href={`/checklist?loja=${l.id}`}
                    className={`p-3 rounded-lg border transition-colors ${
                      l.id === lojaId ? 'border-navy-800 bg-navy-50/60' : 'border-line hover:border-navy-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-navy-900 truncate">{l.nome}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-navy-50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${completo ? 'bg-emerald-500' : 'bg-gold'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${completo ? 'text-emerald-700' : 'text-slate-muted'}`}>
                        {l.feitos}/{l.total}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <ChecklistLoja itens={itens} lojaId={lojaId} admin={admin} />

        <details className="card p-5">
          <summary className="cursor-pointer flex items-center gap-2 h2">
            <Plus className="w-4 h-4" /> Adicionar item à rotina
          </summary>
          <FormRascunho chave="checklist-item" action={criarItem} className="mt-5 space-y-4">
            <input type="hidden" name="loja_id" value={lojaId} />
            <div>
              <label className="label">O que precisa ser feito</label>
              <input name="titulo" required className="input" placeholder="Ex: Conferir o estoque da vitrine" />
            </div>
            <div>
              <label className="label">Detalhe (opcional)</label>
              <input name="descricao" className="input" placeholder="Uma instrução curta para quem for fazer" />
            </div>
            {admin ? (
              <label className="flex items-center gap-2 text-sm text-slate">
                <input type="checkbox" name="para_todas" value="1" defaultChecked className="w-4 h-4" />
                Vale para <strong>todas as lojas</strong> (desmarque para criar só em {lojaAtual?.nome})
              </label>
            ) : (
              <p className="text-xs text-slate-muted">
                Este item vale só para a {lojaAtual?.nome}.
              </p>
            )}
            <button type="submit" className="btn-primary">Adicionar</button>
          </FormRascunho>
        </details>
      </main>
    </>
  );
}
