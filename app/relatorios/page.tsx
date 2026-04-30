import Topbar from '@/components/topbar';
import Link from 'next/link';
import {
  Users, Target, KanbanSquare, Calendar, Megaphone,
  Share2, Wallet, Inbox, Shield, FileText, ArrowRight
} from 'lucide-react';

const MODULOS = [
  { id: 'geral', nome: 'Resumo geral', desc: 'Visão consolidada de todos os módulos no período.', icon: FileText, color: 'bg-navy-800', highlight: true },
  { id: 'afazeres', nome: 'Afazeres', desc: 'Tarefas em todas as colunas do kanban.', icon: KanbanSquare, color: 'bg-navy-500' },
  { id: 'campanhas', nome: 'Campanhas', desc: 'Briefings completos por canal e status.', icon: Target, color: 'bg-navy-500' },
  { id: 'influencers', nome: 'Influencers', desc: 'Acordos, redes sociais e performance.', icon: Users, color: 'bg-navy-500' },
  { id: 'calendario', nome: 'Calendário', desc: 'Eventos do período com convidados e ata.', icon: Calendar, color: 'bg-navy-500' },
  { id: 'anuncios', nome: 'Anúncios', desc: 'Campanhas pagas, investimento e conversões.', icon: Megaphone, color: 'bg-navy-500' },
  { id: 'social', nome: 'Social Media', desc: 'Posts publicados/agendados e desempenho.', icon: Share2, color: 'bg-navy-500' },
  { id: 'financeiro', nome: 'Financeiro', desc: 'Saídas, entradas e ROI por campanha.', icon: Wallet, color: 'bg-navy-500' },
  { id: 'solicitacoes', nome: 'Solicitações', desc: 'Pedidos das lojas, status e prazos.', icon: Inbox, color: 'bg-navy-500' },
  { id: 'usuarios', nome: 'Usuários', desc: 'Cadastro e hierarquia do time.', icon: Shield, color: 'bg-navy-500' },
];

export default function RelatoriosPage() {
  return (
    <>
      <Topbar
        title="Relatórios"
        subtitle="Gere relatórios em PDF com período personalizado para qualquer área do hub."
      />
      <main className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="card p-5 bg-gradient-to-r from-navy-50 to-white border-navy-200">
          <h2 className="h2 mb-2">Como funciona</h2>
          <ol className="text-sm text-slate space-y-1 list-decimal list-inside">
            <li>Escolha o módulo que quer relatar abaixo.</li>
            <li>Defina o nome do relatório e o período (datas inicial e final).</li>
            <li>Na tela de preview, clique em <strong className="text-navy-800">"Baixar PDF"</strong> — o navegador abre o diálogo de impressão; selecione <strong>Salvar como PDF</strong> como destino.</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {MODULOS.map(m => {
            const Icon = m.icon;
            return (
              <Link
                key={m.id}
                href={`/relatorios/novo?modulo=${m.id}`}
                className={`card-hover p-5 flex gap-4 items-start group ${
                  m.highlight ? 'border-gold/40 bg-gradient-to-br from-amber-50/40 to-white' : ''
                }`}
              >
                <div className={`w-12 h-12 rounded-lg ${m.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="h3">{m.nome}</h3>
                    <ArrowRight className="w-4 h-4 text-slate-muted group-hover:text-navy-700 transition-colors" />
                  </div>
                  <p className="text-xs text-slate mt-1">{m.desc}</p>
                  {m.highlight && <span className="badge-gold mt-2 inline-block">Mais usado</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
