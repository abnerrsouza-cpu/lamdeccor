/**
 * Pedaços de anexos que o navegador também precisa conhecer.
 * Fica separado de lib/anexos.ts porque aquele usa fs e SQLite, que não
 * podem entrar no pacote do cliente.
 */

export const TIPOS_ACEITOS = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';
export const TAMANHO_MAX = 10 * 1024 * 1024; // 10 MB

export type Anexo = {
  id: number;
  entidade: string;
  entidade_id: number;
  nome_original: string;
  caminho: string;
  tipo: string;
  tamanho: number;
  created_at: string;
};

export function ehImagem(tipo: string) {
  return tipo.startsWith('image/');
}

export function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
