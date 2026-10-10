'use client';

import { useState, useTransition, useRef } from 'react';
import { Paperclip, FileText, ImageIcon, Trash2, Upload, X } from 'lucide-react';
import { TIPOS_ACEITOS, TAMANHO_MAX, formatarTamanho, type Anexo } from '@/lib/anexos-comum';

/** Lista os anexos já enviados, com pré-visualização das imagens. */
export function ListaAnexos({ anexos, onRemover, podeRemover = false }: {
  anexos: Anexo[];
  onRemover?: (id: number) => Promise<void>;
  podeRemover?: boolean;
}) {
  const [pending, start] = useTransition();
  const [aberta, setAberta] = useState<Anexo | null>(null);

  if (anexos.length === 0) return null;

  const imagens = anexos.filter(a => a.tipo.startsWith('image/'));
  const docs = anexos.filter(a => !a.tipo.startsWith('image/'));

  return (
    <div className={`space-y-3 ${pending ? 'opacity-60' : ''}`}>
      {imagens.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imagens.map(a => (
            <div key={a.id} className="relative group">
              <button
                type="button"
                onClick={() => setAberta(a)}
                className="block w-full aspect-[4/3] rounded-lg overflow-hidden border border-line
                           bg-navy-50 hover:opacity-90 transition-opacity"
              >
                {/* next/image exigiria configurar domínio; aqui o arquivo é local e pequeno */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/arquivo/${a.id}`} alt={a.nome_original}
                  className="w-full h-full object-cover" loading="lazy" />
              </button>
              {podeRemover && onRemover && (
                <button
                  type="button"
                  title="Remover imagem"
                  onClick={() => {
                    if (!confirm(`Remover "${a.nome_original}"?`)) return;
                    start(async () => { await onRemover(a.id); });
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-white/90 rounded text-rose-500
                             hover:text-rose-700 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {docs.map(a => (
        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-line group">
          <FileText className="w-5 h-5 text-rose-600 shrink-0" />
          <a
            href={`/api/arquivo/${a.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0"
          >
            <div className="text-sm font-semibold text-navy-900 truncate hover:underline">
              {a.nome_original}
            </div>
            <div className="text-xs text-slate-muted">PDF · {formatarTamanho(a.tamanho)}</div>
          </a>
          {podeRemover && onRemover && (
            <button
              type="button"
              title="Remover arquivo"
              onClick={() => {
                if (!confirm(`Remover "${a.nome_original}"?`)) return;
                start(async () => { await onRemover(a.id); });
              }}
              className="p-1.5 rounded text-rose-400 hover:text-rose-700 hover:bg-rose-50 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

      {aberta && (
        <div
          onClick={() => setAberta(null)}
          className="fixed inset-0 z-[9997] bg-navy-900/80 flex items-center justify-center p-4"
        >
          <button type="button" aria-label="Fechar"
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/arquivo/${aberta.id}`} alt={aberta.nome_original}
            className="max-w-full max-h-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}

/** Campo de envio. Mostra o nome escolhido antes de salvar. */
export function CampoAnexo({ name = 'arquivo', label = 'Anexar imagem ou PDF', ajuda }: {
  name?: string;
  label?: string;
  ajuda?: string;
}) {
  const [escolhido, setEscolhido] = useState<{ nome: string; tamanho: number; img: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="label">{label}</label>
      <input
        ref={ref}
        type="file"
        name={name}
        accept={TIPOS_ACEITOS}
        onChange={e => {
          const f = e.target.files?.[0];
          setErro(null);
          if (!f) { setEscolhido(null); return; }
          if (f.size > TAMANHO_MAX) {
            setErro(`Arquivo muito grande (máximo ${TAMANHO_MAX / 1024 / 1024} MB).`);
            e.target.value = '';
            setEscolhido(null);
            return;
          }
          setEscolhido({ nome: f.name, tamanho: f.size, img: f.type.startsWith('image/') });
        }}
        className="block w-full text-sm text-slate file:mr-3 file:py-2 file:px-4 file:rounded-lg
                   file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700
                   hover:file:bg-navy-100 file:cursor-pointer cursor-pointer"
      />
      {escolhido && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate">
          {escolhido.img ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          <span className="truncate">{escolhido.nome}</span>
          <span className="text-slate-muted">{formatarTamanho(escolhido.tamanho)}</span>
          <button
            type="button"
            onClick={() => { if (ref.current) ref.current.value = ''; setEscolhido(null); }}
            className="text-slate-muted hover:text-rose-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {erro && <p className="mt-1 text-xs text-rose-600">{erro}</p>}
      {ajuda && !erro && <p className="mt-1 text-[11px] text-slate-muted">{ajuda}</p>}
    </div>
  );
}
