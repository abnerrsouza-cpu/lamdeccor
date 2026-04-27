import Topbar from '@/components/topbar';
import StatCard from '@/components/stat-card';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  Wallet, Users, Megaphone, TrendingUp,
  Calendar as CalendarIcon, AlertCircle, ArrowRight, Target
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const db = getDb();

  const totalSaida = (db.prepare(
    `SELECT COALESCE(SUM(valor),0) as v FROM financeiro WHERE tipo='saida'`
  ).get() as { v: number }).v;
  const totalEntrada = (db.prepare(
    `SELECT COALESCE(SUM(valor),0) as v FROM financeiro WHERE tipo='entrada'`
  ).get() as { v: number }).v;
  const roi = totalSaida > 0 ? ((totalEntrada / totalSaida - 1) * 100) : 0;

  const adsAtivos = (db.prepare(
    `SELECT COUNT(*) as c FROM anuncios WHERE status='ativo'`
  ).get() as { c: number }).c;
  const totalConversoes = (db.prepare(
    `SELECT COALESCE(SUM(conversoes),0) as v FROM anuncios`
  ).get() as { v: number }).v;
  const infsAtivos = (db.prepare(
    `SELECT COUNT(*) as c FROM influencers WHERE status='ativo'`
  ).get() as { c: number }).c;

  const proximosEventos = db.prepare(`
    SELECT * FROM eventos WHERE data >= date('now') ORDER BY data ASC LIMIT 5
  `).all() as any[];

  const solicitacoesAbertas = db.prepare(`
    SELECT s.*, l.nome as loja_nome
    FROM solicitacoes s
    LEFT JOIN lojas l ON l.id = s.loja_id
    WHERE s.status IN ('aberta', 'em_analise')
    ORDER BY
      CASE s.prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END
    LIMIT 5
  `).all() as any[];

  const afazeresAndamento = db.prepare(`
    SELECT * FROM afazeres WHERE coluna='em_andamento' ORDER BY ordem ASC LIMIT 4
  `).all() as any[];

  const campanhasAtivas = db.prepare(`
    SELECT * FROM campanhas WHERE status IN ('em_execucao', 'planejamento') ORDER BY data_inicio LIMIT 3
  `).all() as any[];

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const primeiroNome = user?.nome.split(' ')[0] ?? '';

  return (
    <>
      <Topbar
        title={`Bom dia, ${primeiroNome}.`}
        subtitle="Aqui está o panorama do marketing da LAM hoje."
      />

      <main className="p-6 space-y-5">
        {/* Alerta destaque */}
        <div className="card p-5 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-navy-900">
                  Campanha "Hora da mãe descansar" começa em 15 dias
                </h3>
                <span className="badge-gold">URGENTE</span>
              </div>
              <p className="text-sm text-slate mt-1">
                Dia das Mães é em <strong>10/05/2026</strong>. Filme emocional em briefing,
                influencers selecionados, combo Mãe na Sala disponível em todas as 5 lojas.
              </p>
            </div>
            <Link href="/campanhas" className="btn-primary">
              Ver campanha <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="eyebrow">Performance</span>
              <h2 className="h2">Indicadores de marketing</h2>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Investimento total" value={fmtBRL(totalSaida)} icon={Wallet} helper="Saídas acumuladas" />
            <StatCard label="Vendas atribuídas" value={fmtBRL(totalEntrada)} icon={TrendingUp} change={{ pct: 24, up: true }} />
            <StatCard label="ROI estimado" value={`${roi.toFixed(0)}%`} icon={TrendingUp}
              helper={roi > 0 ? 'Investimento se pagou' : 'Avaliar'} highlight={roi > 100} />
            <StatCard label="Anúncios ativos" value={String(adsAtivos)} icon={Megaphone}
              helper={`${totalConversoes} conversões`} />
          </div>
        </div>

        {/* Campanhas ativas */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-navy-500" />
              <h3 className="h2">Campanhas ativas</h3>
            </div>
            <Link href="/campanhas" className="text-xs text-navy-500 hover:underline">ver todas</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {campanhasAtivas.map((c: any) => (
              <Link key={c.id} href={`/campanhas/${c.id}`} className="card-hover p-4 overflow-hidden">
                <div className="h-1 -m-4 mb-3" style={{ backgroundColor: c.capa_cor }} />
                <span className={
                  c.status === 'em_execucao' ? 'badge-green' :
                  c.status === 'planejamento' ? 'badge-gold' : 'badge-slate'
                }>{c.status.replace('_', ' ')}</span>
                <h4 className="mt-2 font-bold text-navy-900">{c.nome}</h4>
                <p className="text-xs text-slate mt-1">{c.slogan}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Grid de 3 blocos */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-navy-500" />
                <h3 className="h3">Próximos eventos</h3>
              </div>
              <Link href="/calendario" className="text-xs text-navy-500 hover:underline">ver todos</Link>
            </div>
            <div className="space-y-3">
              {proximosEventos.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase text-navy-500 font-bold">
                      {format(new Date(ev.data), 'MMM', { locale: ptBR })}
                    </span>
                    <span className="text-base font-bold text-navy-900 leading-none">
                      {format(new Date(ev.data), 'dd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/calendario/${ev.id}`} className="text-sm font-semibold text-navy-900 truncate hover:text-navy-500 block">
                      {ev.titulo}
                    </Link>
                    <div className="text-xs text-slate-muted">
                      {ev.hora_inicio ? `${ev.hora_inicio} · ` : ''}{ev.tipo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-500" />
                <h3 className="h3">Solicitações</h3>
              </div>
              <Link href="/solicitacoes" className="text-xs text-navy-500 hover:underline">ver todas</Link>
            </div>
            <div className="space-y-3">
              {solicitacoesAbertas.map((sol) => (
                <div key={sol.id} className="flex items-start gap-3">
                  <span className={
                    sol.prioridade === 'urgente' ? 'badge-red' :
                    sol.prioridade === 'alta' ? 'badge-gold' :
                    sol.prioridade === 'media' ? 'badge-blue' : 'badge-slate'
                  }>{sol.prioridade}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy-900 truncate">{sol.titulo}</div>
                    <div className="text-xs text-slate-muted truncate">{sol.loja_nome}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-navy-500" />
                <h3 className="h3">Em andamento</h3>
              </div>
              <Link href="/afazeres" className="text-xs text-navy-500 hover:underline">kanban</Link>
            </div>
            <div className="space-y-3">
              {afazeresAndamento.map((af) => (
                <div key={af.id} className="border-l-2 border-navy-500 pl-3 py-0.5">
                  <div className="text-sm font-semibold text-navy-900">{af.titulo}</div>
                  <div className="text-xs text-slate-muted">
                    {af.campanha ?? 'Geral'} · prazo {af.prazo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Influencers */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-navy-500" />
              <h3 className="h2">Central de Influencers</h3>
              <span className="badge-blue">{infsAtivos} ativos</span>
            </div>
            <Link href="/influencers" className="btn-secondary">
              Acessar central <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
