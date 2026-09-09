import { listEmpresas } from '@/lib/empresa';
import LoginForm from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const empresas = await listEmpresas();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
      <LoginForm empresas={empresas} erro={searchParams?.error} proximo={searchParams?.next} />
    </div>
  );
}
