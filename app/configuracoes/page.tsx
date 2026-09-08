import Topbar from '@/components/topbar';
import { redirect } from 'next/navigation';
import { Plus, Store } from 'lucide-react';
import { getDb } from '@/lib/db';
import { getEmpresaAtiva } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { ehAdmin } from '@/lib/permissions';
import { criarLoja } from './actions';
import LojasTable, { type LojaComUso } from './lojas-table';

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!ehAdmin(user?.role)) redirect('/');

  const empresa = await getEmpresaAtiva();
  const db = getDb();

  // "Em uso" soma tudo que aponta para a loja, para avisar antes de excluir
  const lojas = db.prepare(`
    SELECT l.*,
      (SELECT COUNT(*) FROM solicitacoes WHERE loja_id = l.id)
      + (SELECT COUNT(*) FROM users       WHERE loja_id = l.id)
      + (SELECT COUNT(*) FROM influencers WHERE loja_id = l.id)
      + (SELECT COUNT(*) FROM eventos     WHERE loja_id = l.id)
      + (SELECT COUNT(*) FROM financeiro  WHERE loja_id = l.id) AS em_uso,
      (SELECT COUNT(*) FROM solicitacoes WHERE loja_id = l.id) AS solicitacoes
    FROM lojas l
    WHERE l.empresa_id = ?
    ORDER BY l.nome
  `).all(empresa.id) as LojaComUso[];

  return (
    <>
      <Topbar
        title="Configurações"
        subtitle={`Lojas e unidades da ${empresa.nome}.`}
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-navy-500" />
          <h2 className="h2">Lojas e unidades</h2>
          <span className="badge-slate">{lojas.length}</span>
        </div>

        <p className="text-sm text-slate -mt-2">
          Estas são as lojas da <strong>{empresa.nome}</strong>. Elas alimentam os
          campos de loja em Solicitações, Financeiro, Influencers e Calendário.
          Para gerenciar as da outra empresa, troque de empresa no topo da barra lateral.
        </p>

        <details className="card p-5">
          <summary className="cursor-pointer flex items-center gap-2 h2">
            <Plus className="w-4 h-4" /> Nova loja / unidade
          </summary>
          <form action={criarLoja} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Nome</label>
                <input name="nome" required className="input" placeholder="Ex: LAM Centro SJC" />
              </div>
              <div>
                <label className="label">Cidade</label>
                <input name="cidade" className="input" placeholder="Ex: São José dos Campos" />
              </div>
              <div>
                <label className="label">Endereço</label>
                <input name="endereco" className="input" placeholder="Ex: R. Francisco Paes, 242" />
              </div>
            </div>
            <button type="submit" className="btn-primary">Adicionar loja</button>
          </form>
        </details>

        <LojasTable lojas={lojas} />
      </main>
    </>
  );
}
