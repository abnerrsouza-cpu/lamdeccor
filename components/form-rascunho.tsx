'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';

/**
 * Formulário que guarda o que foi digitado no próprio aparelho e devolve
 * se a pessoa sair sem enviar. Resolve a perda de trabalho quando o app
 * reinicia (deploy) ou a aba fecha sem querer.
 *
 * Guarda em localStorage: é instantâneo, não depende de rede e sobrevive
 * ao servidor cair. Fica no aparelho de quem digitou, que é o certo para
 * rascunho. Senhas nunca são guardadas.
 */

const PREFIXO = 'rascunho:';

type Valores = Record<string, string | boolean>;

function coletar(form: HTMLFormElement): Valores {
  const out: Valores = {};
  for (const el of Array.from(form.elements)) {
    const campo = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!campo.name || campo.name.startsWith('$')) continue;
    if (campo instanceof HTMLInputElement) {
      if (campo.type === 'password' || campo.type === 'file' || campo.type === 'hidden') continue;
      if (campo.type === 'checkbox' || campo.type === 'radio') {
        if (campo.type === 'radio' && !campo.checked) continue;
        out[campo.name] = campo.type === 'checkbox' ? campo.checked : campo.value;
        continue;
      }
    }
    out[campo.name] = campo.value;
  }
  return out;
}

function aplicar(form: HTMLFormElement, valores: Valores) {
  for (const [nome, valor] of Object.entries(valores)) {
    const campos = form.elements.namedItem(nome);
    if (!campos) continue;
    const lista = campos instanceof RadioNodeList ? Array.from(campos) : [campos];
    for (const el of lista) {
      const campo = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (campo instanceof HTMLInputElement && campo.type === 'checkbox') {
        campo.checked = valor === true;
      } else if (campo instanceof HTMLInputElement && campo.type === 'radio') {
        campo.checked = campo.value === valor;
      } else if (typeof valor === 'string') {
        campo.value = valor;
      }
    }
  }
}

function temConteudo(v: Valores) {
  return Object.values(v).some(x => (typeof x === 'string' ? x.trim() !== '' : x === true));
}

export default function FormRascunho({
  chave,
  action,
  children,
  className,
  id,
}: {
  /** Identificador do formulário. Inclua o id do registro quando houver. */
  chave: string;
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [restaurado, setRestaurado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const chaveCompleta = PREFIXO + chave;

  // Devolve o rascunho ao abrir
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    try {
      const bruto = localStorage.getItem(chaveCompleta);
      if (!bruto) return;
      const valores = JSON.parse(bruto) as Valores;
      if (!temConteudo(valores)) { localStorage.removeItem(chaveCompleta); return; }
      aplicar(form, valores);
      setRestaurado(true);
    } catch {
      /* localStorage bloqueado ou conteúdo inválido: segue sem rascunho */
    }
  }, [chaveCompleta]);

  // Guarda enquanto digita, sem pesar: espera a pessoa parar
  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout>;

    const aoMudar = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const valores = coletar(form);
          if (temConteudo(valores)) {
            localStorage.setItem(chaveCompleta, JSON.stringify(valores));
            setSalvo(true);
            setTimeout(() => setSalvo(false), 1800);
          } else {
            localStorage.removeItem(chaveCompleta);
          }
        } catch { /* sem espaço ou bloqueado: não atrapalha o uso */ }
      }, 600);
    };

    form.addEventListener('input', aoMudar);
    form.addEventListener('change', aoMudar);
    return () => {
      clearTimeout(timer);
      form.removeEventListener('input', aoMudar);
      form.removeEventListener('change', aoMudar);
    };
  }, [chaveCompleta]);

  const descartar = () => {
    try { localStorage.removeItem(chaveCompleta); } catch { /* ignora */ }
    ref.current?.reset();
    setRestaurado(false);
  };

  return (
    <form
      id={id}
      ref={ref}
      action={action}
      className={className}
      onSubmit={() => {
        // Enviou: o rascunho cumpriu o papel
        try { localStorage.removeItem(chaveCompleta); } catch { /* ignora */ }
        setRestaurado(false);
      }}
    >
      {restaurado && (
        <div className="flex items-center justify-between gap-3 text-xs bg-navy-50 border border-line
                        rounded-lg px-3 py-2">
          <span className="text-navy-700 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Recuperamos o que você tinha começado a preencher.
          </span>
          <button
            type="button"
            onClick={descartar}
            className="text-slate-muted hover:text-rose-600 font-semibold shrink-0"
          >
            Descartar
          </button>
        </div>
      )}

      {children}

      {salvo && (
        <div className="text-[11px] text-emerald-700 flex items-center gap-1">
          <Check className="w-3 h-3" /> rascunho salvo
        </div>
      )}
    </form>
  );
}
