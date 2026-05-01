import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ImportadorClient from './importador-client';

export const dynamic = 'force-dynamic';

export default function ImportarPage() {
  return (
    <main className="ml-0 lg:ml-60 p-4 sm:p-8 max-w-5xl mx-auto">
      <Link
        href="/social"
        className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-navy-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Social Media
      </Link>

      <header className="mb-6">
        <h1 className="h1">Importar plano de conteúdo</h1>
        <p className="text-sm text-slate-muted mt-1">
          Suba o PDF do cronograma mensal. O sistema detecta cada post (data, formato, hook),
          mostra um preview e cria todos como rascunhos no Instagram em 1 clique.
        </p>
      </header>

      <div className="card p-4 sm:p-6 mb-6 bg-navy-50 border-navy-200">
        <h2 className="font-bold text-navy-900 mb-2">Padrão esperado do PDF</h2>
        <ul className="text-sm text-navy-700 space-y-1 list-disc pl-5">
          <li>Cabeçalho com mês e ano (ex: <code>Maio 2026</code>)</li>
          <li>Cada post começa com a data <code>DD/MM</code> + formato em CAIXA ALTA: <code>REELS</code>, <code>CARROSSEL</code>, <code>FOTO</code>, <code>FILME</code></li>
          <li>Hook entre aspas (<code>"texto da chamada"</code>) — vira o título do post</li>
          <li>Tamanho máximo: 10 MB</li>
        </ul>
      </div>

      <ImportadorClient />
    </main>
  );
}
