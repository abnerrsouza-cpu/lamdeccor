import { login } from '@/lib/auth';
import { Sparkles } from 'lucide-react';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-md bg-gold flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-navy-900" />
          </div>
          <div>
            <h1 className="font-bold text-navy-900 text-lg leading-none">LAM</h1>
            <p className="text-[11px] text-slate uppercase tracking-wider">Marketing Hub</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-navy-900 mb-1">Entre na sua conta</h2>
        <p className="text-sm text-slate mb-6">Acesse o painel de marketing da LAM Deccor.</p>

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

        <div className="mt-6 pt-6 border-t border-line text-xs text-slate-muted">
          <p><strong className="text-navy-700">Demo:</strong> usuário <code className="bg-navy-50 px-1.5 py-0.5 rounded">admin</code> / senha <code className="bg-navy-50 px-1.5 py-0.5 rounded">admin123</code></p>
        </div>
      </div>
    </div>
  );
}
