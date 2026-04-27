// Tipos compartilhados do domínio LAM Marketing Hub

export type Role = 'admin' | 'diretor' | 'coordenador' | 'gestor_trafego' | 'social_media' | 'designer' | 'gerente_loja';

export interface User {
  id: number;
  nome: string;
  usuario: string;
  email: string;
  senha?: string;
  role: Role;
  hierarquia: number; // 1 (admin) a 9 (visualizador)
  cargo: string | null;
  loja_id: number | null;
  ativo: number;
  avatar_url: string | null;
  created_at: string;
}

export interface Loja {
  id: number;
  nome: string;
  cidade: string;
  endereco: string;
}

export interface Notificacao {
  id: number;
  user_id: number;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'success' | 'warning' | 'urgent';
  link: string | null;
  lida: number;
  created_at: string;
}

export interface Influencer {
  id: number;
  nome: string;
  handle: string;
  cidade: string;
  loja_id: number | null;
  perfil: string;
  alcance_medio: number;
  engajamento: number;
  cache_mensal: number;
  bonus_pct: number;
  status: 'prospeccao' | 'em_negociacao' | 'ativo' | 'pausado';
  observacoes: string;
  avatar_url: string | null;
  valor_acordo: number;
  acordo_inicio: string | null;
  acordo_fim: string | null;
  created_at: string;
}

export interface InfluencerRede {
  id: number;
  influencer_id: number;
  rede: 'instagram' | 'tiktok' | 'youtube' | 'kwai' | 'twitter' | 'linkedin';
  url: string;
  seguidores: number;
  engajamento: number;
}

export interface InfluencerCampanha {
  id: number;
  influencer_id: number;
  campanha_nome: string;
  data_inicio: string;
  data_fim: string;
  investimento: number;
  vendas_atribuidas: number;
  views: number;
  engajamentos: number;
  observacoes: string;
}

export interface Campanha {
  id: number;
  nome: string;
  slogan: string;
  data_inicio: string;
  data_fim: string;
  orcamento: number;
  kpi_base: string;
  status: 'planejamento' | 'em_execucao' | 'finalizada' | 'pausada';
  capa_cor: string;
  arquivada: number;
}

export interface CampanhaCanal {
  id: number;
  campanha_id: number;
  canal: string;
  conteudo: string;
  ordem: number;
}

export interface Evento {
  id: number;
  titulo: string;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  tipo: 'campanha' | 'lancamento' | 'reuniao' | 'evento_loja' | 'feira' | 'outro';
  local: string | null;
  loja_id: number | null;
  organizador_id: number | null;
  descricao: string;
  ata: string;
  cor: string;
}

export interface EventoConvidado {
  id: number;
  evento_id: number;
  user_id: number;
  status: 'convidado' | 'confirmado' | 'recusou' | 'talvez';
}

export interface Anuncio {
  id: number;
  campanha: string;
  plataforma: 'meta' | 'google' | 'tiktok' | 'youtube';
  status: 'ativo' | 'pausado' | 'finalizado';
  investimento: number;
  impressoes: number;
  cliques: number;
  conversoes: number;
  cpc: number;
  ctr: number;
  data_inicio: string;
  data_fim: string | null;
}

export interface Integracao {
  id: number;
  plataforma: 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'youtube';
  nome_conta: string;
  conectado: number;
  ultima_sync: string;
  detalhes: string;
}

export interface PostSocial {
  id: number;
  titulo: string;
  texto: string;
  rede: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook';
  formato: 'feed' | 'reels' | 'story' | 'video' | 'carrossel';
  status: 'rascunho' | 'agendado' | 'publicado';
  data_publicacao: string;
  hora: string;
  responsavel_id: number | null;
  campanha: string | null;
  hashtags: string;
  midia_url: string;
  observacoes: string;
}

export interface MovimentoFinanceiro {
  id: number;
  tipo: 'saida' | 'entrada';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  campanha: string | null;
  loja_id: number | null;
  fornecedor: string;
  nf_numero: string;
  nf_arquivo: string;
  observacoes: string;
  status: 'pago' | 'pendente' | 'previsto';
}

export interface Solicitacao {
  id: number;
  tipo: 'post' | 'anuncio' | 'video' | 'panfleto' | 'arte' | 'evento' | 'outro';
  titulo: string;
  descricao: string;
  loja_id: number;
  solicitante_id: number;
  responsavel_id: number | null;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberta' | 'em_analise' | 'em_execucao' | 'concluida' | 'recusada';
  prazo: string | null;
  created_at: string;
}

export interface Afazer {
  id: number;
  titulo: string;
  descricao: string;
  coluna: 'a_fazer' | 'em_andamento' | 'em_revisao' | 'concluido';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  time: string | null;
  responsavel_id: number | null;
  campanha: string | null;
  prazo: string | null;
  ordem: number;
  checklist: string;
  anexos: string;
  created_at: string;
}
