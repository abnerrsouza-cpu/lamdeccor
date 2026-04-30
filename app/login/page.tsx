import { login } from '@/lib/auth';
import Image from 'next/image';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-card mb-4">
            <Image
              src="/logo.jpg"
              alt="LAM Deccor"
              width={200}
              height={200}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <p className="text-[11px] text-slate-muted uppercase tracking-widest font-bold">
            Marketing Hub
          </p>
        </div>

        <h2 className="text-xl font-bold text-navy-900 mb-1 text-center">
          Entre na sua conta
        </h2>
        <p className="text-sm text-slate mb-6 text-center">
          Acesse o painel de marketing.
        </p>

        <form action={login} className="space-y-4">
          <div>
            <label className="label">Usuário ou email</label>
            <input name="email" required className="input" placeholder="admin" defaultValue="admin" />
          </div>
          <div>
            <label className="label">Senha</label>
            <input type="password" name="senha" required className="input" placeholder="••••••••" />
          </div>
          {searchParams?.error && (
            <p className="text-sm text-rose-600">{searchParams.error}</p>
          )}
          <button type="submit" className="btn-primary w-full">Entrar</button>
        </form>

        <div className="mt-6 pt-6 border-t border-line text-xs text-slate-muted text-center">
          <p><strong className="text-navy-700">Demo:</strong> usuário <code className="bg-navy-50 px-1.5 py-0.5 rounded">admin</code> / senha <code className="bg-navy-50 px-1.5 py-0.5 rounded">admin123</code></p>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-muted italic">
          Da nossa fábrica para sua casa.
        </p>
      </div>
    </div>
  );
}
