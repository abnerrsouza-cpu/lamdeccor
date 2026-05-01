'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle2, AlertCircle, FileText, Calendar, Hash, Loader2 } from 'lucide-react';
import { previewPdf, criarPostsEmLote } from '../actions';
import type { PostExtraido } from '@/lib/pdf-importer';

type EstadoPreview = {
  ano: number;
  mes: number;
  campanha_principal?: string;
  posts: PostExtraido[];
};

const FORMATO_BADGE: Record<string, string> = {
  reels: 'badge bg-rose-100 text-rose-700',
  carrossel: 'badge bg-amber-100 text-amber-800',
  foto: 'badge bg-emerald-100 text-emerald-700',
  filme: 'badge bg-violet-100 text-violet-700',
  story: 'badge bg-sky-100 text-sky-700',
  feed: 'badge bg-slate-100 text-slate-700',
};

export default function ImportadorClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [preview, setPreview] = useState<EstadoPreview | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [pendingPreview, startPreview] = useTransition();
  const [pendingSalvar, startSalvar] = useTransition();
  const [sucesso, setSucesso] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setErro(null);
    setPreview(null);
    setSucesso(null);
  }

  function processar() {
    if (!file) {
      setErro('Selecione um PDF antes de continuar.');
      return;
    }
    setErro(null);
    setSucesso(null);
    startPreview(async () => {
      const fd = new FormData();
      fd.append('pdf', file);
      const r = await previewPdf(fd);
      if (!r.ok) {
        setErro(r.erro || 'Falha ao processar.');
        return;
      }
      setPreview({
        ano: r.ano!,
        mes: r.mes!,
        campanha_principal: r.campanha_principal,
        posts: r.posts!,
      });
      setSelecionados(new Set(r.posts!.map((_, i) => i)));
    });
  }

  function toggleAll() {
    if (!preview) return;
    if (selecionados.size === preview.posts.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(preview.posts.map((_, i) => i)));
    }
  }

  function toggle(i: number) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      novo.has(i) ? novo.delete(i) : novo.add(i);
      return novo;
    });
  }

  function salvar() {
    if (!preview) return;
    const escolhidos = preview.posts.filter((_, i) => selecionados.has(i));
    if (escolhidos.length === 0) {
      setErro('Marque pelo menos 1 post pra criar.');
      return;
    }
    setErro(null);
    startSalvar(async () => {
      const r = await criarPostsEmLote(escolhidos);
      if (!r.ok) {
        setErro(r.erro || 'Falha ao salvar.');
        return;
      }
      setSucesso(`${r.criados} post(s) criado(s) como rascunho no Instagram.`);
      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setTimeout(() => router.push('/social'), 1500);
    });
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="card p-4 sm:p-6">
        <label className="label">Arquivo PDF do cronograma</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={onFileChange}
            className="input"
          />
          <button
            onClick={processar}
            disabled={!file || pendingPreview}
            className="btn-primary whitespace-nowrap"
          >
            {pendingPreview ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Detectar posts
              </>
            )}
          </button>
        </div>
        {file && (
          <p className="text-xs text-slate-muted mt-2">
            <FileText className="w-3 h-3 inline mr-1" />
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="card p-4 bg-rose-50 border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">{erro}</div>
        </div>
      )}
      {sucesso && (
        <div className="card p-4 bg-emerald-50 border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">{sucesso} Redirecionando...</div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="card p-4 sm:p-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-line">
            <div>
              <h2 className="h2">
                {preview.posts.length} posts detectados
              </h2>
              <p className="text-xs text-slate-muted mt-1">
                Mês {String(preview.mes).padStart(2, '0')}/{preview.ano}
                {preview.campanha_principal && (
                  <>
                    {' · '}
                    Campanha:{' '}
                    <span className="font-semibold text-navy-700">
                      {preview.campanha_principal}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleAll} className="btn-ghost text-xs">
                {selecionados.size === preview.posts.length
                  ? 'Desmarcar todos'
                  : 'Marcar todos'}
              </button>
              <button
                onClick={salvar}
                disabled={pendingSalvar || selecionados.size === 0}
                className="btn-primary"
              >
                {pendingSalvar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Criar {selecionados.size} post(s)
                  </>
                )}
              </button>
            </div>
          </header>

          <div className="space-y-2">
            {preview.posts.map((p, i) => {
              const sel = selecionados.has(i);
              return (
                <label
                  key={i}
                  className={`flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    sel
                      ? 'border-navy-300 bg-navy-50'
                      : 'border-line bg-white hover:border-navy-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggle(i)}
                    className="mt-1 shrink-0 accent-navy-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-navy-700">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {p.data}
                      </span>
                      <span className={FORMATO_BADGE[p.formato] ?? FORMATO_BADGE.feed}>
                        {p.formato}
                      </span>
                      {p.observacoes && (
                        <span className="text-[10px] uppercase tracking-wider text-slate-muted">
                          <Hash className="w-3 h-3 inline" /> {p.observacoes}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-navy-900 break-words">
                      {p.titulo}
                    </h3>
                    {p.descricao && (
                      <p className="text-xs text-slate mt-1 line-clamp-2">{p.descricao}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
