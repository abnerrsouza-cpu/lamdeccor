'use client';

import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrintBar({ nome }: { nome: string }) {
  return (
    <div className="no-print sticky top-0 z-30 bg-white border-b border-line shadow-soft">
      <div className="max-w-[210mm] mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/relatorios" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2 flex-1 mx-6 min-w-0">
          <span className="text-xs text-slate-muted">Pré-visualização:</span>
          <span className="text-sm font-bold text-navy-900 truncate">{nome}</span>
        </div>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer className="w-4 h-4" /> Baixar PDF / Imprimir
        </button>
      </div>
    </div>
  );
}
