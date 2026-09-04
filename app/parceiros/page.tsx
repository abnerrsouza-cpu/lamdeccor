import Topbar from '@/components/topbar';
import { getDb } from '@/lib/db';
import { getEmpresaAtiva } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { moduloVisivel } from '@/lib/modulos';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Handshake, Share2, TrendingUp, AlertCircle } from 'lucide-react';
import ParceirosList from './parceiros-list';
import { diasDesde, fmtBRL, LIMITE_SEM_CONTATO } from './constantes';
import type { Parceiro } from '@/lib/types';

export type ParceiroCard = Parceiro & {
  total_indicacoes: number;
  indicacoes_fechadas: number;
  valor_fechado: number;
  ultima_conversa: string | null;
};

export default async function ParceirosPage({ searchParams }: { searchParams: { aba?: string } }) {
  const empresa = await getEmpresaAtiva();
  if (!moduloVisivel('/parceiros', empresa.slug)) redirect('/');

  const user = await getCurrentUser();
  const editar = podeEditar(user?.role);
  const db = getDb();

  const parceiros = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM parceiro_indicacoes i WHERE i.parceiro_id = p.id) AS total_indicacoes,
      (SELECT COUNT(*) FROM parceiro_indicacoes i WHERE i.parceiro_id = p.id AND i.status = 'fechada') AS indicacoes_fechadas,
      (SELECT COALESCE(SUM(i.valor), 0) FROM parceiro_indicacoes i WHERE i.parceiro_id = p.id AND i.status = 'fechada') AS valor_fechado,
      (SELECT MAX(c.data) FROM parceiro_conversas c WHERE c.parceiro_id = p.id) AS ultima_conversa
    FROM parceiros p
    WHERE p.empresa_id = ?
    ORDER BY
      CASE p.status WHEN 'ativo' THEN 1 WHEN 'em_negociacao' THEN 2 WHEN 'prospeccao' THEN 3 ELSE 4 END,
      p.nome
  `).all(empresa.id) as ParceiroCard[];

  const abas = [
    { id: 'todos', label: 'Todos' },
    { id: 'ativo', label: 'Ativos' },
    { id: 'em_negociacao', label: 'Em negociação' },
    { id: 'prospeccao', label: 'Prospecção' },
    { id: 'inativo', label: 'Inativos' },
  ];
  const aba = abas.some(a => a.id === searchParams.aba) ? searchParams.aba! : 'todos';
  const visiveis = aba === 'todos' ? parceiros : parceiros.filter(p => p.status === aba);

  const ativos = parceiros.filter(p => p.status === 'ativo');
  const totalIndicacoes = parceiros.reduce((s, p) => s + p.total_indicacoes, 0);
  const valorFechado = parceiros.reduce((s, p) => s + p.valor_fechado, 0);
  const semContato = ativos.filter(p => {
    const d = diasDesde(p.ultima_conversa);
    return d === null || d > LIMITE_SEM_CONTATO;
  });

  return (
    <>
      <Topbar
        title="Parceiros"
        subtitle={`Rede de parceiros que indicam clientes para a ${empresa.nome}.`}
        action={
          editar ? (
            <Link href="/parceiros/novo" className="btn-primary">
              <Plus className="w-4 h-4" /> Novo parceiro
            </Link>
          ) : undefined
        }
      />

      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
              <Handshake className="w-5 h-5 text-navy-500" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-muted">Parceiros ativos</div>
              <div className="h2">{ativos.length}</div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-navy-500" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-muted">Indicações recebidas</div>
              <div className="h2">{totalIndicacoes}</div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-navy-500" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-muted">Fechado via parceiros</div>
              <div className="h2 truncate">{fmtBRL(valorFechado)}</div>
            </div>
          </div>
          <div className={`card p-4 flex items-center gap-3 ${semContato.length > 0 ? 'border-amber-200 bg-amber-50/40' : ''}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${semContato.length > 0 ? 'bg-amber-100' : 'bg-navy-50'}`}>
              <AlertCircle className={`w-5 h-5 ${semContato.length > 0 ? 'text-amber-700' : 'text-navy-500'}`} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-muted">Sem contato há {LIMITE_SEM_CONTATO}+ dias</div>
              <div className="h2">{semContato.length}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-line overflow-x-auto">
          {abas.map(a => {
            const n = a.id === 'todos' ? parceiros.length : parceiros.filter(p => p.status === a.id).length;
            const ativa = a.id === aba;
            return (
              <Link
                key={a.id}
                href={a.id === 'todos' ? '/parceiros' : `/parceiros?aba=${a.id}`}
                className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  ativa
                    ? 'border-navy-800 text-navy-900'
                    : 'border-transparent text-slate hover:text-navy-700'
                }`}
              >
                {a.label} <span className="text-xs text-slate-muted">{n}</span>
              </Link>
            );
          })}
        </div>

        {visiveis.length === 0 ? (
          <div className="card p-10 text-center">
            <Handshake className="w-8 h-8 text-slate-muted mx-auto mb-3" />
            <p className="text-sm text-slate">
              {parceiros.length === 0
                ? 'Nenhum parceiro cadastrado ainda.'
                : 'Nenhum parceiro com esse status.'}
            </p>
            {editar && parceiros.length === 0 && (
              <Link href="/parceiros/novo" className="btn-primary mt-4 w-fit mx-auto">
                <Plus className="w-4 h-4" /> Cadastrar o primeiro
              </Link>
            )}
          </div>
        ) : (
          <ParceirosList parceiros={visiveis} editar={editar} />
        )}
      </main>
    </>
  );
}
