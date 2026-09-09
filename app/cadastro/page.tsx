import Link from 'next/link';
import { listEmpresas } from '@/lib/empresa';
import { criarConta } from './actions';
import CadastroForm from './cadastro-form';

export default async function CadastroPage({ searchParams }: {
  searchParams: { error?: string; empresa?: string };
}) {
  const empresas = await listEmpresas();
  const preSelecionada = Number(searchParams?.empresa) || undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
      <div className="w-full max-w-md">
        <CadastroForm
          empresas={empresas}
          erro={searchParams?.error}
          empresaInicial={preSelecionada}
          acao={criarConta}
        />
        <p className="mt-4 text-center text-xs text-navy-200">
          Já tem conta?{' '}
          <Link href="/login" className="underline hover:text-white">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
