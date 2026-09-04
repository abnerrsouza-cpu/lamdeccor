import Topbar from '@/components/topbar';
import Link from 'next/link';
import { ArrowLeft, Plug, CheckCircle2, ExternalLink } from 'lucide-react';
import { getDb } from '@/lib/db';
import { getEmpresaId } from '@/lib/empresa';
import { conectarIntegracao, desconectarIntegracao } from './actions';
import type { Integracao } from '@/lib/types';

const PLATAFORMAS = [
  {
    id: 'meta_ads',
    nome: 'Meta Ads',
    descricao: 'Sincronize campanhas e métricas do Facebook e Instagram Ads.',
    instrucoes: [
      'Crie um App em developers.facebook.com',
      'Solicite acesso à Marketing API (revisão da Meta)',
      'Cole o Access Token e o Account ID abaixo',
    ],
    cor: '#1877F2',
    icone: '📊',
  },
  {
    id: 'google_ads',
    nome: 'Google Ads',
    descricao: 'Importe campanhas, palavras-chave e custo por conversão.',
    instrucoes: [
      'Acesse ads.google.com → Ferramentas → Acesso e Segurança',
      'Gere um Developer Token e API client',
      'Cole o Customer ID e o token gerado',
    ],
    cor: '#4285F4',
    icone: '🔍',
  },
  {
    id: 'tiktok_ads',
    nome: 'TikTok Ads',
    descricao: 'Conecte o TikTok Business para extrair métricas de Reels e ads.',
    instrucoes: [
      'Acesse ads.tiktok.com → Ferramentas → API',
      'Gere um App Access Token',
      'Cole o token e o Advertiser ID',
    ],
    cor: '#FE2C55',
    icone: '🎵',
  },
  {
    id: 'youtube',
    nome: 'YouTube Ads',
    descricao: 'Métricas de vídeos publicados e anúncios in-stream.',
    instrucoes: [
      'Use as credenciais do Google Ads (mesma conta)',
      'Habilite o YouTube Data API no Cloud Console',
      'Cole o ID do canal',
    ],
    cor: '#FF0000',
    icone: '▶️',
  },
];

export default async function IntegracoesPage() {
  const db = getDb();
  const emp = await getEmpresaId();
  const integracoes = db.prepare('SELECT * FROM integracoes WHERE empresa_id = ?').all(emp) as Integracao[];
  const map: Record<string, Integracao> = {};
  integracoes.forEach(i => { map[i.plataforma] = i; });

  return (
    <>
      <Topbar
        title="Integrações de anúncios"
        subtitle="Conecte as plataformas para sincronização automática de métricas."
      />
      <main className="p-6 space-y-6">
        <Link href="/anuncios" className="text-sm text-navy-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar para Anúncios
        </Link>

        <div className="card p-5 bg-navy-50 border-navy-200">
          <p className="text-sm text-navy-700">
            <strong>Como funciona:</strong> Cada plataforma exige credenciais (token/API key) que você gera no painel oficial do anunciante.
            Quando ligamos, o sistema sincroniza diariamente as métricas (impressões, cliques, conversões) e alimenta o dashboard automático.
            Esta versão MVP guarda os tokens — o sync real entra na próxima sprint.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {PLATAFORMAS.map(p => {
            const integ = map[p.id];
            const conectado = integ?.conectado === 1;
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: p.cor + '15', color: p.cor }}
                    >
                      {p.icone}
                    </div>
                    <div>
                      <h3 className="h3">{p.nome}</h3>
                      <p className="text-xs text-slate-muted">{p.descricao}</p>
                    </div>
                  </div>
                  {conectado ? (
                    <span className="badge-green flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Conectado
                    </span>
                  ) : (
                    <span className="badge-slate">Desconectado</span>
                  )}
                </div>

                {conectado ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
                    <div className="text-xs text-emerald-700 font-semibold">Conta conectada</div>
                    <div className="text-sm text-navy-900 font-mono">{integ.nome_conta}</div>
                    {integ.ultima_sync && (
                      <div className="text-[11px] text-slate-muted">
                        Última sync: {integ.ultima_sync}
                      </div>
                    )}
                    <form action={desconectarIntegracao.bind(null, p.id)} className="pt-2">
                      <button className="text-xs text-rose-600 hover:underline">desconectar</button>
                    </form>
                  </div>
                ) : (
                  <form action={conectarIntegracao} className="space-y-3">
                    <input type="hidden" name="plataforma" value={p.id} />
                    <div className="text-xs text-slate-muted bg-navy-50/50 p-3 rounded-lg">
                      <div className="font-semibold text-navy-700 mb-1">Como conectar:</div>
                      <ol className="list-decimal list-inside space-y-0.5">
                        {p.instrucoes.map((inst, i) => <li key={i}>{inst}</li>)}
                      </ol>
                    </div>
                    <div>
                      <label className="label">Nome da conta / Account ID</label>
                      <input name="nome_conta" required className="input"
                        placeholder="Ex: act_123456789" />
                    </div>
                    <div>
                      <label className="label">Access token / API key</label>
                      <input name="token" type="password" required className="input"
                        placeholder="••••••••••••••••" />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                      <Plug className="w-4 h-4" /> Conectar {p.nome}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
