import { getDb } from '@/lib/db';
import PrintBar from './print-button';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MODULO_LABEL: Record<string, string> = {
  geral: 'Resumo geral',
  afazeres: 'Afazeres',
  campanhas: 'Campanhas',
  influencers: 'Influencers',
  calendario: 'Calendário',
  anuncios: 'Anúncios',
  social: 'Social Media',
  financeiro: 'Financeiro',
  solicitacoes: 'Solicitações',
  usuarios: 'Usuários',
};

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const fmtNum = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

export default function PreviewPage({ searchParams }: {
  searchParams: { modulo?: string; nome?: string; inicio?: string; fim?: string };
}) {
  const modulo = searchParams.modulo ?? 'geral';
  const nome = searchParams.nome ?? 'Relatório';
  const inicio = searchParams.inicio || null;
  const fim = searchParams.fim || null;

  return (
    <div className="bg-white min-h-screen">
      <PrintBar nome={nome} />

      <article className="report-page max-w-[210mm] mx-auto px-12 py-10 bg-white">
        {/* Cabeçalho */}
        <header className="border-b-2 border-navy-800 pb-5 mb-8 flex items-start gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0">
            <Image src="/logo.jpg" alt="LAM Deccor" width={160} height={160} className="object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-navy-500 font-bold">
              LAM DECCOR · Marketing Hub
            </p>
            <h1 className="text-2xl font-bold text-navy-900 mt-1 leading-tight">{nome}</h1>
            <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-slate-muted uppercase tracking-wider font-semibold">Módulo</div>
                <div className="font-semibold text-navy-900">{MODULO_LABEL[modulo] ?? modulo}</div>
              </div>
              <div>
                <div className="text-slate-muted uppercase tracking-wider font-semibold">Período</div>
                <div className="font-semibold text-navy-900">
                  {inicio || '—'} {(inicio || fim) && '→'} {fim || '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-muted uppercase tracking-wider font-semibold">Emitido em</div>
                <div className="font-semibold text-navy-900">
                  {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Corpo do relatório */}
        {modulo === 'geral' && <SecaoGeral inicio={inicio} fim={fim} />}
        {modulo === 'afazeres' && <SecaoAfazeres inicio={inicio} fim={fim} />}
        {modulo === 'campanhas' && <SecaoCampanhas inicio={inicio} fim={fim} />}
        {modulo === 'influencers' && <SecaoInfluencers inicio={inicio} fim={fim} />}
        {modulo === 'calendario' && <SecaoCalendario inicio={inicio} fim={fim} />}
        {modulo === 'anuncios' && <SecaoAnuncios inicio={inicio} fim={fim} />}
        {modulo === 'social' && <SecaoSocial inicio={inicio} fim={fim} />}
        {modulo === 'financeiro' && <SecaoFinanceiro inicio={inicio} fim={fim} />}
        {modulo === 'solicitacoes' && <SecaoSolicitacoes inicio={inicio} fim={fim} />}
        {modulo === 'usuarios' && <SecaoUsuarios inicio={inicio} fim={fim} />}

        <footer className="mt-12 pt-5 border-t border-line text-center text-xs text-slate-muted">
          <p className="font-bold text-navy-700">LAM DECCOR · Da nossa fábrica para sua casa</p>
          <p className="mt-1">Documento confidencial · Uso interno · {format(new Date(), 'yyyy')}</p>
        </footer>
      </article>
    </div>
  );
}

// =================== SEÇÕES ===================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-navy-900 mb-3 mt-6 pb-1 border-b border-navy-200 uppercase tracking-wider">
      {children}
    </h2>
  );
}

function rangeFilter(field: string, inicio: string | null, fim: string | null) {
  const conds: string[] = [];
  const params: any[] = [];
  if (inicio) { conds.push(`${field} >= ?`); params.push(inicio); }
  if (fim)    { conds.push(`${field} <= ?`); params.push(fim); }
  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

function SecaoGeral({ inicio, fim }: { inicio: string | null; fim: string | null }) {
  return (
    <>
      <SecaoFinanceiro inicio={inicio} fim={fim} compacto />
      <SecaoAnuncios inicio={inicio} fim={fim} compacto />
      <SecaoCampanhas inicio={inicio} fim={fim} compacto />
      <SecaoInfluencers inicio={inicio} fim={fim} compacto />
      <SecaoAfazeres inicio={inicio} fim={fim} compacto />
      <SecaoSolicitacoes inicio={inicio} fim={fim} compacto />
    </>
  );
}

function SecaoAfazeres({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('a.created_at', inicio, fim);
  const rows = db.prepare(`
    SELECT a.*, u.nome as resp
    FROM afazeres a
    LEFT JOIN users u ON u.id = a.responsavel_id
    ${where}
    ORDER BY a.coluna, a.ordem
  `).all(...params) as any[];

  const porColuna: Record<string, any[]> = { a_fazer: [], em_andamento: [], em_revisao: [], concluido: [] };
  rows.forEach(r => { (porColuna[r.coluna] ?? []).push(r); });

  return (
    <section className="report-section mb-6">
      <SectionTitle>Afazeres ({rows.length})</SectionTitle>
      {Object.entries(porColuna).map(([col, items]) => items.length > 0 && (
        <div key={col} className="mb-4">
          <h3 className="text-sm font-bold text-navy-700 mb-2 capitalize">{col.replace('_', ' ')}</h3>
          <table className="w-full text-xs border border-line">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-2 py-1.5 text-left">Título</th>
                <th className="px-2 py-1.5 text-left">Time</th>
                <th className="px-2 py-1.5 text-left">Responsável</th>
                <th className="px-2 py-1.5 text-left">Prioridade</th>
                <th className="px-2 py-1.5 text-left">Prazo</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t border-line">
                  <td className="px-2 py-1.5 font-semibold text-navy-900">{it.titulo}</td>
                  <td className="px-2 py-1.5">{it.time ?? '—'}</td>
                  <td className="px-2 py-1.5">{it.resp ?? '—'}</td>
                  <td className="px-2 py-1.5 capitalize">{it.prioridade}</td>
                  <td className="px-2 py-1.5">{it.prazo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoCampanhas({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('data_inicio', inicio, fim);
  const rows = db.prepare(`SELECT * FROM campanhas ${where} ORDER BY data_inicio DESC`).all(...params) as any[];

  return (
    <section className="report-section mb-6">
      <SectionTitle>Campanhas ({rows.length})</SectionTitle>
      <table className="w-full text-xs border border-line">
        <thead className="bg-navy-50">
          <tr>
            <th className="px-2 py-1.5 text-left">Nome</th>
            <th className="px-2 py-1.5 text-left">Slogan</th>
            <th className="px-2 py-1.5 text-left">Período</th>
            <th className="px-2 py-1.5 text-right">Orçamento</th>
            <th className="px-2 py-1.5 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.id} className="border-t border-line">
              <td className="px-2 py-1.5 font-semibold text-navy-900">
                {c.nome} {c.arquivada ? <span className="text-[10px] text-slate-muted">(arquivada)</span> : ''}
              </td>
              <td className="px-2 py-1.5">{c.slogan}</td>
              <td className="px-2 py-1.5">{c.data_inicio} → {c.data_fim}</td>
              <td className="px-2 py-1.5 text-right font-semibold">{fmtBRL(c.orcamento)}</td>
              <td className="px-2 py-1.5 capitalize">{c.status.replace('_', ' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoInfluencers({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('i.created_at', inicio, fim);
  const rows = db.prepare(`
    SELECT i.*, l.nome as loja_nome
    FROM influencers i
    LEFT JOIN lojas l ON l.id = i.loja_id
    ${where}
    ORDER BY i.alcance_medio DESC
  `).all(...params) as any[];

  const totalAcordo = rows.filter(r => r.status === 'ativo').reduce((s, r) => s + r.valor_acordo, 0);

  return (
    <section className="report-section mb-6">
      <SectionTitle>Influencers ({rows.length})</SectionTitle>
      <p className="text-xs text-slate mb-2">
        Valor total de acordos vigentes: <strong className="text-navy-900">{fmtBRL(totalAcordo)}</strong>
      </p>
      <table className="w-full text-xs border border-line">
        <thead className="bg-navy-50">
          <tr>
            <th className="px-2 py-1.5 text-left">Nome</th>
            <th className="px-2 py-1.5 text-left">Cidade / Loja</th>
            <th className="px-2 py-1.5 text-right">Alcance</th>
            <th className="px-2 py-1.5 text-right">Engaj.</th>
            <th className="px-2 py-1.5 text-right">Acordo</th>
            <th className="px-2 py-1.5 text-left">Vigência</th>
            <th className="px-2 py-1.5 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(i => (
            <tr key={i.id} className="border-t border-line">
              <td className="px-2 py-1.5 font-semibold text-navy-900">{i.nome}<div className="text-[10px] text-slate-muted">{i.handle}</div></td>
              <td className="px-2 py-1.5">{i.cidade}{i.loja_nome ? ` / ${i.loja_nome}` : ''}</td>
              <td className="px-2 py-1.5 text-right">{fmtNum(i.alcance_medio)}</td>
              <td className="px-2 py-1.5 text-right">{i.engajamento.toFixed(1)}%</td>
              <td className="px-2 py-1.5 text-right">{i.valor_acordo > 0 ? fmtBRL(i.valor_acordo) : '—'}</td>
              <td className="px-2 py-1.5 text-[10px]">{i.acordo_inicio ?? '—'} → {i.acordo_fim ?? '—'}</td>
              <td className="px-2 py-1.5 capitalize">{i.status.replace('_', ' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoCalendario({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('data', inicio, fim);
  const rows = db.prepare(`
    SELECT e.*, u.nome as organizador, l.nome as loja_nome,
      (SELECT COUNT(*) FROM evento_convidados WHERE evento_id = e.id) as convidados
    FROM eventos e
    LEFT JOIN users u ON u.id = e.organizador_id
    LEFT JOIN lojas l ON l.id = e.loja_id
    ${where}
    ORDER BY data, hora_inicio
  `).all(...params) as any[];

  return (
    <section className="report-section mb-6">
      <SectionTitle>Calendário ({rows.length} eventos)</SectionTitle>
      <table className="w-full text-xs border border-line">
        <thead className="bg-navy-50">
          <tr>
            <th className="px-2 py-1.5 text-left">Data</th>
            <th className="px-2 py-1.5 text-left">Horário</th>
            <th className="px-2 py-1.5 text-left">Evento</th>
            <th className="px-2 py-1.5 text-left">Tipo</th>
            <th className="px-2 py-1.5 text-left">Local</th>
            <th className="px-2 py-1.5 text-left">Organizador</th>
            <th className="px-2 py-1.5 text-right">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(e => (
            <tr key={e.id} className="border-t border-line">
              <td className="px-2 py-1.5">{e.data}</td>
              <td className="px-2 py-1.5">{e.hora_inicio ?? '—'}{e.hora_fim ? ` → ${e.hora_fim}` : ''}</td>
              <td className="px-2 py-1.5 font-semibold text-navy-900">{e.titulo}</td>
              <td className="px-2 py-1.5 capitalize">{e.tipo.replace('_', ' ')}</td>
              <td className="px-2 py-1.5">{e.local ?? e.loja_nome ?? '—'}</td>
              <td className="px-2 py-1.5">{e.organizador ?? '—'}</td>
              <td className="px-2 py-1.5 text-right">{e.convidados}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoAnuncios({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('data_inicio', inicio, fim);
  const rows = db.prepare(`SELECT * FROM anuncios ${where} ORDER BY investimento DESC`).all(...params) as any[];
  const totalInvest = rows.reduce((s, r) => s + r.investimento, 0);
  const totalConv = rows.reduce((s, r) => s + r.conversoes, 0);

  return (
    <section className="report-section mb-6">
      <SectionTitle>Anúncios ({rows.length})</SectionTitle>
      <p className="text-xs text-slate mb-2">
        Investimento total: <strong className="text-navy-900">{fmtBRL(totalInvest)}</strong> ·
        Conversões: <strong className="text-navy-900">{totalConv}</strong>
      </p>
      <table className="w-full text-xs border border-line">
        <thead className="bg-navy-50">
          <tr>
            <th className="px-2 py-1.5 text-left">Campanha</th>
            <th className="px-2 py-1.5 text-left">Plataforma</th>
            <th className="px-2 py-1.5 text-left">Status</th>
            <th className="px-2 py-1.5 text-right">Investido</th>
            <th className="px-2 py-1.5 text-right">Impressões</th>
            <th className="px-2 py-1.5 text-right">CTR</th>
            <th className="px-2 py-1.5 text-right">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id} className="border-t border-line">
              <td className="px-2 py-1.5 font-semibold text-navy-900">{a.campanha}</td>
              <td className="px-2 py-1.5 capitalize">{a.plataforma}</td>
              <td className="px-2 py-1.5 capitalize">{a.status}</td>
              <td className="px-2 py-1.5 text-right">{fmtBRL(a.investimento)}</td>
              <td className="px-2 py-1.5 text-right">{fmtNum(a.impressoes)}</td>
              <td className="px-2 py-1.5 text-right">{a.ctr.toFixed(2)}%</td>
              <td className="px-2 py-1.5 text-right">{a.conversoes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoSocial({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('data_publicacao', inicio, fim);
  const rows = db.prepare(`
    SELECT p.*, u.nome as resp
    FROM posts p LEFT JOIN users u ON u.id = p.responsavel_id
    ${where}
    ORDER BY data_publicacao DESC
  `).all(...params) as any[];

  return (
    <section className="report-section mb-6">
      <SectionTitle>Social Media ({rows.length} posts)</SectionTitle>
      <table className="w-full text-xs border border-line">
        <thead className="bg-navy-50">
          <tr>
            <th className="px-2 py-1.5 text-left">Data</th>
            <th className="px-2 py-1.5 text-left">Rede</th>
            <th className="px-2 py-1.5 text-left">Formato</th>
            <th className="px-2 py-1.5 text-left">Título</th>
            <th className="px-2 py-1.5 text-left">Campanha</th>
            <th className="px-2 py-1.5 text-left">Status</th>
            <th className="px-2 py-1.5 text-left">Resp.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(p => (
            <tr key={p.id} className="border-t border-line">
              <td className="px-2 py-1.5">{p.data_publicacao} {p.hora}</td>
              <td className="px-2 py-1.5 capitalize">{p.rede}</td>
              <td className="px-2 py-1.5 capitalize">{p.formato}</td>
              <td className="px-2 py-1.5 font-semibold text-navy-900">{p.titulo}</td>
              <td className="px-2 py-1.5">{p.campanha ?? '—'}</td>
              <td className="px-2 py-1.5 capitalize">{p.status}</td>
              <td className="px-2 py-1.5">{p.resp ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoFinanceiro({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('data', inicio, fim);
  const rows = db.prepare(`
    SELECT f.*, l.nome as loja_nome
    FROM financeiro f LEFT JOIN lojas l ON l.id = f.loja_id
    ${where}
    ORDER BY data DESC
  `).all(...params) as any[];

  const totalSaida = rows.filter(r => r.tipo === 'saida').reduce((s, r) => s + r.valor, 0);
  const totalEntrada = rows.filter(r => r.tipo === 'entrada').reduce((s, r) => s + r.valor, 0);
  const saldo = totalEntrada - totalSaida;
  const roi = totalSaida > 0 ? ((totalEntrada / totalSaida - 1) * 100) : 0;

  return (
    <section className="report-section mb-6">
      <SectionTitle>Financeiro ({rows.length} lançamentos)</SectionTitle>
      <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
        <KPI label="Saídas" value={fmtBRL(totalSaida)} color="text-rose-700" />
        <KPI label="Entradas" value={fmtBRL(totalEntrada)} color="text-emerald-700" />
        <KPI label="Saldo" value={fmtBRL(saldo)} color={saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'} />
        <KPI label="ROI" value={totalSaida > 0 ? `${roi.toFixed(0)}%` : '—'} color="text-navy-900" />
      </div>
      {!compacto && (
        <table className="w-full text-xs border border-line">
          <thead className="bg-navy-50">
            <tr>
              <th className="px-2 py-1.5 text-left">Data</th>
              <th className="px-2 py-1.5 text-left">Tipo</th>
              <th className="px-2 py-1.5 text-left">Categoria</th>
              <th className="px-2 py-1.5 text-left">Descrição</th>
              <th className="px-2 py-1.5 text-left">Campanha</th>
              <th className="px-2 py-1.5 text-left">NF</th>
              <th className="px-2 py-1.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.id} className="border-t border-line">
                <td className="px-2 py-1.5">{m.data}</td>
                <td className="px-2 py-1.5 capitalize">{m.tipo}</td>
                <td className="px-2 py-1.5">{m.categoria}</td>
                <td className="px-2 py-1.5 font-semibold text-navy-900">{m.descricao}</td>
                <td className="px-2 py-1.5">{m.campanha ?? '—'}</td>
                <td className="px-2 py-1.5">{m.nf_numero || '—'}</td>
                <td className={'px-2 py-1.5 text-right font-bold ' + (m.tipo === 'saida' ? 'text-rose-700' : 'text-emerald-700')}>
                  {m.tipo === 'saida' ? '−' : '+'}{fmtBRL(m.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoSolicitacoes({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('s.created_at', inicio, fim);
  const rows = db.prepare(`
    SELECT s.*, l.nome as loja, u.nome as solicitante, r.nome as responsavel
    FROM solicitacoes s
    LEFT JOIN lojas l ON l.id = s.loja_id
    LEFT JOIN users u ON u.id = s.solicitante_id
    LEFT JOIN users r ON r.id = s.responsavel_id
    ${where}
    ORDER BY s.created_at DESC
  `).all(...params) as any[];

  return (
    <section className="report-section mb-6">
      <SectionTitle>Solicitações ({rows.length})</SectionTitle>
      <table className="w-full text-xs border border-line">
        <thead className="bg-navy-50">
          <tr>
            <th className="px-2 py-1.5 text-left">Tipo</th>
            <th className="px-2 py-1.5 text-left">Título</th>
            <th className="px-2 py-1.5 text-left">Loja</th>
            <th className="px-2 py-1.5 text-left">Solicitante</th>
            <th className="px-2 py-1.5 text-left">Responsável</th>
            <th className="px-2 py-1.5 text-left">Prioridade</th>
            <th className="px-2 py-1.5 text-left">Status</th>
            <th className="px-2 py-1.5 text-left">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id} className="border-t border-line">
              <td className="px-2 py-1.5 capitalize">{s.tipo}</td>
              <td className="px-2 py-1.5 font-semibold text-navy-900">{s.titulo}</td>
              <td className="px-2 py-1.5">{s.loja}</td>
              <td className="px-2 py-1.5">{s.solicitante ?? '—'}</td>
              <td className="px-2 py-1.5">{s.responsavel ?? '—'}</td>
              <td className="px-2 py-1.5 capitalize">{s.prioridade}</td>
              <td className="px-2 py-1.5 capitalize">{s.status.replace('_', ' ')}</td>
              <td className="px-2 py-1.5">{s.prazo ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function SecaoUsuarios({ inicio, fim, compacto = false }: any) {
  const db = getDb();
  const { where, params } = rangeFilter('u.created_at', inicio, fim);
  const rows = db.prepare(`
    SELECT u.*, l.nome as loja_nome FROM users u
    LEFT JOIN lojas l ON l.id = u.loja_id
    ${where}
    ORDER BY u.hierarquia, u.nome
  `).all(...params) as any[];

  return (
    <section className="report-section mb-6">
      <SectionTitle>Usuários ({rows.length})</SectionTitle>
      <table className="w-full text-xs border border-line">
        <thead className="bg-navy-50">
          <tr>
            <th className="px-2 py-1.5 text-left">Nome</th>
            <th className="px-2 py-1.5 text-left">Login</th>
            <th className="px-2 py-1.5 text-left">Email</th>
            <th className="px-2 py-1.5 text-left">Função</th>
            <th className="px-2 py-1.5 text-left">Hierarquia</th>
            <th className="px-2 py-1.5 text-left">Loja</th>
            <th className="px-2 py-1.5 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id} className="border-t border-line">
              <td className="px-2 py-1.5 font-semibold text-navy-900">{u.nome}</td>
              <td className="px-2 py-1.5">{u.usuario}</td>
              <td className="px-2 py-1.5">{u.email}</td>
              <td className="px-2 py-1.5 capitalize">{u.role.replace('_', ' ')}</td>
              <td className="px-2 py-1.5">{u.hierarquia}</td>
              <td className="px-2 py-1.5">{u.loja_nome ?? '—'}</td>
              <td className="px-2 py-1.5">{u.ativo ? 'ativo' : 'inativo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-xs text-slate-muted italic">Sem registros no período.</p>}
    </section>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-line rounded p-2">
      <div className="text-[10px] text-slate-muted uppercase tracking-wider font-bold">{label}</div>
      <div className={`text-base font-bold ${color}`}>{value}</div>
    </div>
  );
}
