import Topbar from '@/components/topbar';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

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

async function emitirRelatorio(formData: FormData) {
  'use server';
  const params = new URLSearchParams({
    modulo: String(formData.get('modulo') ?? 'geral'),
    nome: String(formData.get('nome') ?? 'Relatório'),
    inicio: String(formData.get('inicio') ?? ''),
    fim: String(formData.get('fim') ?? ''),
  });
  redirect(`/relatorios/preview?${params.toString()}`);
}

export default function NovoRelatorioPage({ searchParams }: { searchParams: { modulo?: string } }) {
  const moduloInicial = searchParams.modulo ?? 'geral';
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioPadrao = new Date();
  inicioPadrao.setDate(inicioPadrao.getDate() - 30);
  const inicioStr = inicioPadrao.toISOString().slice(0, 10);

  return (
    <>
      <Topbar
        title="Emitir relatório"
        subtitle={`Configurar e gerar relatório de ${MODULO_LABEL[moduloInicial] ?? 'área selecionada'}.`}
      />
      <main className="p-6">
        <Link href="/relatorios" className="text-sm text-navy-500 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Voltar para relatórios
        </Link>

        <form action={emitirRelatorio} className="card p-6 max-w-2xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-line">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-navy-700" />
            </div>
            <div>
              <h2 className="h2">Configurar relatório</h2>
              <p className="text-xs text-slate-muted">Preencha os campos abaixo para gerar o PDF.</p>
            </div>
          </div>

          <div>
            <label className="label">Módulo</label>
            <select name="modulo" defaultValue={moduloInicial} required className="input">
              {Object.entries(MODULO_LABEL).map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nome do relatório</label>
            <input
              name="nome"
              required
              className="input"
              placeholder={`Ex: Relatório ${MODULO_LABEL[moduloInicial]} - ${hoje}`}
              defaultValue={`Relatório ${MODULO_LABEL[moduloInicial]} - ${hoje}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data inicial</label>
              <input type="date" name="inicio" defaultValue={inicioStr} className="input" />
            </div>
            <div>
              <label className="label">Data final</label>
              <input type="date" name="fim" defaultValue={hoje} className="input" />
            </div>
          </div>

          <p className="text-xs text-slate-muted bg-navy-50/50 p-3 rounded-lg">
            <strong className="text-navy-700">Dica:</strong> deixe as datas em branco para gerar um relatório com todos os registros disponíveis.
            Para alguns módulos (como Influencers e Usuários), o filtro de datas usa a data de cadastro.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Link href="/relatorios" className="btn-secondary">Cancelar</Link>
            <button type="submit" className="btn-primary">
              <FileText className="w-4 h-4" /> Gerar relatório
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
