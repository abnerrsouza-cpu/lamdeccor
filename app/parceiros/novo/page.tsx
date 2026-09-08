import Topbar from '@/components/topbar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getEmpresaAtiva } from '@/lib/empresa';
import { getCurrentUser } from '@/lib/auth';
import { podeEditar } from '@/lib/permissions';
import { moduloVisivel } from '@/lib/modulos';
import { criarParceiro } from '../actions';
import ParceiroCampos from '../parceiro-form';

export default async function NovoParceiroPage() {
  const empresa = await getEmpresaAtiva();
  if (!moduloVisivel('/parceiros', empresa.slug)) redirect('/');

  const user = await getCurrentUser();
  if (!podeEditar(user?.role)) redirect('/parceiros');

  return (
    <>
      <Topbar title="Novo parceiro" subtitle="Cadastre quem indica clientes e acompanhe o retorno." />
      <main className="p-4 md:p-6">
        <Link href="/parceiros" className="text-sm text-navy-500 hover:underline flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <form action={criarParceiro} className="card p-6 max-w-3xl space-y-4">
          <ParceiroCampos />
          <button type="submit" className="btn-primary">Cadastrar parceiro</button>
        </form>
      </main>
    </>
  );
}
