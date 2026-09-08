import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { criarInfluencer } from '../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Loja } from '@/lib/types';

export default async function NovoInfluencerPage() {
  const db = getDb();
  const emp = await getEmpresaId();
  const lojas = db.prepare('SELECT * FROM lojas WHERE empresa_id = ? ORDER BY nome').all(emp) as Loja[];

  return (
    <>
      <Topbar title="Novo influencer" subtitle="Cadastre um novo parceiro de comunicação." />
      <main className="p-6">
        <Link href="/influencers" className="text-sm text-navy-500 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Voltar para a Central
        </Link>

        <form action={criarInfluencer} className="card p-6 max-w-3xl space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome completo</label>
              <input name="nome" required className="input" placeholder="Juliana Reis" />
            </div>
            <div>
              <label className="label">Handle / @</label>
              <input name="handle" className="input" placeholder="@juliareis.casa" />
            </div>
          </div>

          <div>
            <label className="label">URL da foto de perfil</label>
            <input name="avatar_url" type="url" className="input" placeholder="https://..." />
            <p className="text-xs text-slate-muted mt-1">Cole o link de uma foto pública (Instagram, Drive, etc.). Adicione redes sociais detalhadas depois.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cidade</label>
              <input name="cidade" className="input" />
            </div>
            <div>
              <label className="label">Loja / unidade associada</label>
              <select name="loja_id" className="input">
                <option value="">— Sem associação —</option>
                {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Perfil de audiência</label>
            <textarea name="perfil" rows={2} className="input"
              placeholder="Mãe 35-45 anos, lifestyle, dicas de decoração..." />
          </div>

          <div className="border-t border-line pt-5">
            <h3 className="h3 mb-4">Métricas principais (Instagram)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Alcance médio</label>
                <input type="number" name="alcance_medio" className="input" placeholder="50000" />
              </div>
              <div>
                <label className="label">Engajamento %</label>
                <input type="number" step="0.1" name="engajamento" className="input" placeholder="4.5" />
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <h3 className="h3 mb-4">Acordo comercial</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Valor do acordo (R$)</label>
                <input type="number" name="valor_acordo" className="input" placeholder="12000" />
              </div>
              <div>
                <label className="label">Vigência início</label>
                <input type="date" name="acordo_inicio" className="input" />
              </div>
              <div>
                <label className="label">Vigência fim</label>
                <input type="date" name="acordo_fim" className="input" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <label className="label">Cachê mensal</label>
                <input type="number" name="cache_mensal" className="input" placeholder="2500" />
              </div>
              <div>
                <label className="label">Bônus por venda %</label>
                <input type="number" step="0.1" name="bonus_pct" className="input" placeholder="10" />
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" className="input">
                  <option value="prospeccao">Prospecção</option>
                  <option value="em_negociacao">Em negociação</option>
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Observações internas</label>
            <textarea name="observacoes" rows={3} className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Link href="/influencers" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary">Cadastrar influencer</button>
          </div>
        </form>
      </main>
    </>
  );
}
