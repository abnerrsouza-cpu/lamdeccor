export const STATUS_PARCEIRO: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'badge-green' },
  em_negociacao: { label: 'Em negociação', className: 'badge-gold' },
  prospeccao: { label: 'Prospecção', className: 'badge-slate' },
  inativo: { label: 'Inativo', className: 'badge-red' },
};

export const STATUS_INDICACAO: Record<string, { label: string; className: string }> = {
  nova: { label: 'Nova', className: 'badge-blue' },
  em_contato: { label: 'Em contato', className: 'badge-gold' },
  agendada: { label: 'Agendada', className: 'badge-purple' },
  fechada: { label: 'Fechada', className: 'badge-green' },
  perdida: { label: 'Perdida', className: 'badge-red' },
};

export const CANAIS: Array<{ id: string; label: string }> = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'presencial', label: 'Presencial' },
  { id: 'email', label: 'Email' },
  { id: 'instagram', label: 'Instagram' },
];

export const canalLabel = (id: string) =>
  CANAIS.find(c => c.id === id)?.label ?? id;

export const TIPOS_SUGERIDOS = [
  'Lavanderia', 'Hotel / pousada', 'Imobiliária', 'Loja de móveis',
  'Decoradora', 'Condomínio', 'Clínica', 'Escritório', 'Indicação pessoal', 'Outro',
];

/** Dias desde a data (formato YYYY-MM-DD), lendo como data local. */
export function diasDesde(iso: string | null): number | null {
  if (!iso) return null;
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return null;
  const alvo = new Date(a, m - 1, d).getTime();
  return Math.round((new Date().setHours(0, 0, 0, 0) - alvo) / 86400000);
}

/** "hoje" / "ontem" / "há 12 dias" */
export function rotuloDias(dias: number | null) {
  if (dias === null) return null;
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

/** Parceiro ativo sem conversa há mais de 30 dias precisa de atenção. */
export const LIMITE_SEM_CONTATO = 30;

export const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
