'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Star, PartyPopper, CalendarCheck, ThumbsUp, ThumbsDown } from 'lucide-react';
import { soltarConfete } from './confete';
import FormRascunho from './form-rascunho';
import { confirmarAviso, responderPesquisa } from '@/app/avisos/actions';
import { responderRetornoEvento } from '@/app/calendario/actions';
import type { AvisoPendente, PesquisaPendente, EventoParaAvaliar } from '@/lib/pendencias';

/**
 * Janela que trava a tela enquanto houver pendência: primeiro os avisos
 * importantes (confirmar que leu, sem confete — é obrigação), depois a
 * pesquisa do mês (aí sim confete, é contribuição).
 */
export default function BloqueioPendencias({ avisos, eventos, pesquisa }: {
  avisos: AvisoPendente[];
  /** Eventos já passados na loja, aguardando o retorno do gerente */
  eventos: EventoParaAvaliar[];
  pesquisa: PesquisaPendente | null;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [idxEv, setIdxEv] = useState(0);
  const [tudoCerto, setTudoCerto] = useState<'sim' | 'nao' | null>(null);
  const [pesquisaFeita, setPesquisaFeita] = useState(false);
  const [agradecendo, setAgradecendo] = useState(false);
  const [nota, setNota] = useState(0);

  // A janela some sozinha depois do agradecimento, não por troca de props
  const avisoAtual = agradecendo ? undefined : avisos[idx];
  const eventoAtual = agradecendo || avisoAtual ? undefined : eventos[idxEv];
  const mostrarPesquisa = !avisoAtual && !eventoAtual && pesquisa && !pesquisaFeita;

  if (!avisoAtual && !eventoAtual && !mostrarPesquisa && !agradecendo) return null;

  const confirmar = async (id: number) => {
    await confirmarAviso(id);
    setIdx(i => i + 1);
    router.refresh();
  };

  const enviarRetorno = async (form: HTMLFormElement, eventoId: number) => {
    const dados = new FormData(form);
    if (!dados.get('tudo_certo')) return;
    setIdxEv(i => i + 1);
    setTudoCerto(null);
    await responderRetornoEvento(eventoId, dados);
    router.refresh();
  };

  /*
   * Não usamos o envio nativo do formulário: gravar dispara a revalidação
   * do servidor, que desmontaria esta janela antes de a pessoa ler o
   * agradecimento. Mostramos primeiro, gravamos depois.
   */
  const enviarPesquisa = async (form: HTMLFormElement) => {
    const dados = new FormData(form);
    if (!dados.get('nota')) return;

    setPesquisaFeita(true);
    setAgradecendo(true);
    soltarConfete();

    try { localStorage.removeItem(`rascunho:pesquisa-${pesquisa!.referencia}`); } catch { /* ignora */ }

    await responderPesquisa(dados);
    setTimeout(() => { setAgradecendo(false); router.refresh(); }, 3800);
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-navy-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-lg p-6 my-8">
        {agradecendo ? (
          <div className="text-center py-6">
            <PartyPopper className="w-12 h-12 text-gold-deep mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-navy-900">
              Obrigado por contribuir com nosso time de marketing.
            </h2>
            <p className="text-sm text-slate mt-2">
              Sua resposta ajuda a melhorar o apoio que as lojas recebem.
            </p>
          </div>
        ) : avisoAtual ? (
          <>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="eyebrow text-amber-700">Aviso importante</div>
                <h2 className="text-lg font-bold text-navy-900 mt-0.5">{avisoAtual.titulo}</h2>
              </div>
            </div>

            {avisoAtual.corpo && (
              <p className="text-sm text-slate mt-4 whitespace-pre-wrap">{avisoAtual.corpo}</p>
            )}

            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3">
              <span className="text-xs text-slate-muted">
                {avisoAtual.autor_nome && `Publicado por ${avisoAtual.autor_nome}`}
                {avisos.length > 1 && ` · ${idx + 1} de ${avisos.length}`}
              </span>
              <button type="button" onClick={() => confirmar(avisoAtual.id)} className="btn-primary">
                <Check className="w-4 h-4" /> Li e estou ciente
              </button>
            </div>
          </>
        ) : eventoAtual ? (
          <>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-navy-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="eyebrow text-navy-500">Como foi?</div>
                <h2 className="text-lg font-bold text-navy-900 mt-0.5">
                  Tivemos uma data na sua loja
                </h2>
                <p className="text-sm text-slate mt-1">
                  <strong>{eventoAtual.titulo}</strong>
                  {' — '}
                  {new Date((eventoAtual.data_fim ?? eventoAtual.data) + 'T12:00:00')
                    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </p>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                enviarRetorno(e.currentTarget, eventoAtual.id);
              }}
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="tudo_certo" value={tudoCerto ?? ''} />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTudoCerto('sim')}
                  aria-pressed={tudoCerto === 'sim'}
                  className={`py-4 rounded-lg border-2 flex flex-col items-center gap-1.5 transition-colors ${
                    tudoCerto === 'sim'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-line text-slate hover:border-navy-300'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="text-sm font-bold">Deu tudo certo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTudoCerto('nao')}
                  aria-pressed={tudoCerto === 'nao'}
                  className={`py-4 rounded-lg border-2 flex flex-col items-center gap-1.5 transition-colors ${
                    tudoCerto === 'nao'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-line text-slate hover:border-navy-300'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span className="text-sm font-bold">Teve problema</span>
                </button>
              </div>

              <div>
                <label className="label">
                  {tudoCerto === 'nao' ? 'O que deu errado?' : 'Quer contar algo? (opcional)'}
                </label>
                <textarea
                  name="comentario"
                  rows={3}
                  required={tudoCerto === 'nao'}
                  className="input"
                  placeholder={tudoCerto === 'nao'
                    ? 'Descreva o que aconteceu, para o time resolver'
                    : 'Como o público reagiu, o que funcionou...'}
                />
              </div>

              <button
                type="submit"
                disabled={!tudoCerto}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tudoCerto ? 'Enviar' : 'Escolha uma opção acima'}
              </button>
              {eventos.length > 1 && (
                <p className="text-xs text-slate-muted text-center">
                  {idxEv + 1} de {eventos.length}
                </p>
              )}
            </form>
          </>
        ) : (
          <>
            <div className="eyebrow text-navy-500">Pesquisa do mês</div>
            <h2 className="text-lg font-bold text-navy-900 mt-0.5">
              Como foi o apoio do marketing em {pesquisa!.mesNome}?
            </h2>
            <p className="text-sm text-slate-muted mt-1">
              Leva um minuto e é obrigatória no fechamento do mês.
            </p>

            <FormRascunho
              chave={`pesquisa-${pesquisa!.referencia}`}
              action={responderPesquisa}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="label">Nota geral do apoio recebido</label>
                <input type="hidden" name="nota" value={nota || ''} />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNota(n)}
                      aria-label={`Nota ${n}`}
                      aria-pressed={nota === n}
                      className={`flex-1 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-1 ${
                        nota >= n
                          ? 'border-gold bg-gold/15 text-gold-deep'
                          : 'border-line text-slate-muted hover:border-navy-300'
                      }`}
                    >
                      <Star className="w-4 h-4" fill={nota >= n ? 'currentColor' : 'none'} />
                      <span className="text-sm font-bold">{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Os materiais chegaram no prazo?</label>
                <select name="materiais_no_prazo" className="input" defaultValue="">
                  <option value="" disabled>Escolha</option>
                  <option value="sim">Sim, todos no prazo</option>
                  <option value="parcial">Em parte — alguns atrasaram</option>
                  <option value="nao">Não, atrasaram bastante</option>
                  <option value="nao_pedi">Não pedi material este mês</option>
                </select>
              </div>

              <div>
                <label className="label">O que faltou?</label>
                <textarea name="faltou" rows={2} className="input"
                  placeholder="O que o marketing deixou a desejar neste mês" />
              </div>

              <div>
                <label className="label">Sugestões</label>
                <textarea name="sugestoes" rows={2} className="input"
                  placeholder="O que ajudaria sua loja no mês que vem" />
              </div>

              <button
                type="button"
                disabled={!nota}
                onClick={e => {
                  const form = (e.currentTarget as HTMLElement).closest('form');
                  if (form) enviarPesquisa(form as HTMLFormElement);
                }}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nota ? 'Enviar resposta' : 'Dê uma nota para enviar'}
              </button>
            </FormRascunho>
          </>
        )}
      </div>
    </div>
  );
}
