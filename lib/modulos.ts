/**
 * Módulos exclusivos de certas empresas, por slug.
 * Href ausente do mapa = módulo disponível em todas as empresas.
 * Usado pela sidebar (para esconder) e pela própria rota (para bloquear).
 */
export const MODULOS_EXCLUSIVOS: Record<string, string[]> = {
  '/parceiros': ['higix'],
};

export function moduloVisivel(href: string, empresaSlug: string) {
  const slugs = MODULOS_EXCLUSIVOS[href];
  return !slugs || slugs.includes(empresaSlug);
}
