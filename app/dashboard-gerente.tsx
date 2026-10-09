import Link from 'next/link';
import {
  ClipboardCheck, Package, Calendar, Target, Inbox, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { getDb } from '@/lib/db';
import { hojeISO } from './checklist/actions';
import { proximoAviso } from '@/lib/aviso';
import AvisoEvento from './aviso-evento';

type Props = { user: any; emp: number; empresaNome: string };

const STATUS_LABEL: Record<string, string> = {
  aberta: 'aberta', em_analise: 'em análise',
  em_execucao: 'em produção', concluida: 'concluída',
};

/**
 * Painel do gerente de loja. Responde três perguntas: o que preciso fazer
 * hoje, o que o marketing vai me entregar, e o que vem pela frente.
 */
export default async function DashboardGerente({ user, emp, empresaNome }: Props) {
  const db = getDb();
  const hoje = await hojeISO();
  const lojaId = user.loja_id;

  // Rotina de hoje
  const rotina = lojaId ? db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM checklist_itens i
        WHERE i.empresa_id = ? AND i.ativo = 1 AND (i.loja_id IS NULL OR i.loja_id = ?)) AS total,
      (SELECT COUNT(*) FROM checklist_marcacoes m
        JOIN checklist_itens i2 ON i2.id = m.item_id AND i2.ativo = 1
        WHERE m.loja_id = ? AND m.data = ?) AS feitos
  `).get(emp, lojaId, lojaId, hoje) as { total: number; feitos: number }
    : { total: 0, feitos: 0 };

  // O que o marketing já aceitou e está produzindo para esta loja
  const emProducao = lojaId ? db.prepare(`
    SELECT s.*, u.nome AS responsavel_nome
    FROM solicitacoes s
    LEFT JOIN users u ON u.id = s.responsavel_id
    WHERE s.loja_id = ? AND s.status IN ('em_analise', 'em_execucao')
    ORDER BY CASE WHEN s.prazo IS NULL THEN 1 ELSE 0 END, s.prazo
    LIMIT 6
  `).all(lojaId) as any[] : [];

  // Próximos eventos do calendário: os da loja e os gerais
  const eventos = db.prepare(`
    SELECT * FROM eventos
    WHERE empresa_id = ? AND data >= ? AND (loja_id IS NULL OR loja_id = ?)
    ORDER BY data LIMIT 5
  `).all(emp, hoje, lojaId ?? -1) as any[];

  // Campanhas no ar ou chegando
  const campanhas = db.prepare(`
    SELECT * FROM campanhas
    WHERE empresa_id = ? AND arquivada = 0 AND status IN ('em_execucao', 'planejamento')
    ORDER BY CASE WHEN data_inicio IS NULL THEN 1 ELSE 0 END, data_inicio
    LIMIT 4
  `).all(emp) as any[];

  const pct = rotina.total ? Math.round((rotina.feitos / rotina.total) * 100) : 0;
  const rotinaCompleta = rotina.total > 0 && rotina.feitos >= rotina.total;
  const dataBR = (d: string | null) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null;

  const aviso = proximoAviso(emp, user.id, lojaId ?? null, hoje);

  return (
    <main className="p-4 md:p-6 space-y-4 md:space-y-6">
      {aviso && <AvisoEvento evento={aviso} />}

      {/* Rotina de hoje — a ação mais imediata */}
      <Link
        href="/checklist"
        className={`card p-5 block transition-colors ${
          rotinaCompleta ? 'border-emerald-200 bg-emerald-50/50' : 'border-gold/40 bg-gold/5 hover:bg-gold/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            rotinaCompleta ? 'bg-emerald-100' : 'bg-gold/20'
          }`}>
            {rotinaCompleta
              ? <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              : <ClipboardCheck className="w-6 h-6 text-gold-deep" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="h2">
              {rotinaCompleta ? 'Rotina de hoje concluída' : 'Rotina de hoje'}
            </div>
            <p className="text-sm text-slate mt-0.5">
              {rotina.total === 0
                ? 'Nenhum item cadastrado ainda.'
                : rotinaCompleta
                  ? `Tudo certo — ${rotina.total} ${rotina.total === 1 ? 'item' : 'itens'}.`
                  : `Faltam ${rotina.total - rotina.feitos} de ${rotina.total}.`}
            </p>
            {rotina.total > 0 && (
              <div className="h-2 bg-white rounded-full overflow-hidden mt-2 max-w-xs">
                <div
                  className={`h-full rounded-full ${rotinaCompleta ? 'bg-emerald-500' : 'bg-gold'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-slate-muted shrink-0" />
        </div>
      </Link>

      {/* O que o marketing está produzindo para a loja */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-navy-500" />
            <h2 className="h2">Material a caminho</h2>
          </div>
          <Link href="/solicitacoes" className="text-xs text-navy-500 hover:underline">
            ver todas
          </Link>
        </div>

        {emProducao.length === 0 ? (
          <p className="text-sm text-slate-muted py-3">
            Nada em produção agora.{' '}
            <Link href="/solicitacoes" className="text-navy-700 font-semibold hover:underline">
              Pedir um material
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {emProducao.map(s => (
              <li key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-navy-50/40">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy-900">{s.titulo}</div>
                  <div className="text-xs text-slate-muted mt-0.5">
                    {STATUS_LABEL[s.status] ?? s.status}
                    {s.responsavel_nome && ` · com ${s.responsavel_nome}`}
                  </div>
                </div>
                {s.prazo && (
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-muted uppercase tracking-wide">Entrega</div>
                    <div className="text-sm font-bold text-navy-900">{dataBR(s.prazo)}</div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Agenda */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-navy-500" />
            <h2 className="h2">Próximos eventos</h2>
          </div>
          {eventos.length === 0 ? (
            <p className="text-sm text-slate-muted py-3">Nada marcado por enquanto.</p>
          ) : (
            <ul className="space-y-2">
              {eventos.map(e => (
                <li key={e.id} className="flex items-center gap-3">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-sm font-bold text-navy-900">{dataBR(e.data)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy-900 truncate">{e.titulo}</div>
                    {e.local && <div className="text-xs text-slate-muted truncate">{e.local}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Campanhas */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-navy-500" />
            <h2 className="h2">Campanhas</h2>
          </div>
          {campanhas.length === 0 ? (
            <p className="text-sm text-slate-muted py-3">Nenhuma campanha ativa.</p>
          ) : (
            <ul className="space-y-2">
              {campanhas.map(c => (
                <li key={c.id}>
                  <Link
                    href={`/campanhas/${c.id}`}
                    className="block p-3 rounded-lg border border-line hover:border-navy-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={c.status === 'em_execucao' ? 'badge-green' : 'badge-gold'}>
                        {c.status === 'em_execucao' ? 'no ar' : 'planejamento'}
                      </span>
                      {c.data_inicio && (
                        <span className="text-xs text-slate-muted">a partir de {dataBR(c.data_inicio)}</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-navy-900 mt-1">{c.nome}</div>
                    {c.slogan && <div className="text-xs text-slate-muted">{c.slogan}</div>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Link href="/solicitacoes" className="card p-4 flex items-center gap-3 hover:border-navy-300 transition-colors">
        <Inbox className="w-5 h-5 text-navy-500 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-semibold text-navy-900">Precisa de algum material?</div>
          <div className="text-xs text-slate-muted">Abra uma solicitação para o time de marketing da {empresaNome}.</div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-muted" />
      </Link>
    </main>
  );
}
