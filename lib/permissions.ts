// Helpers síncronos de permissão por role.
// Arquivo separado de lib/auth.ts (que tem 'use server' e só pode exportar async).

export function podeEditar(role?: string | null) {
  if (!role) return false;
  return role !== 'gerente_loja';
}

export function ehAdmin(role?: string | null) {
  return role === 'admin' || role === 'diretor';
}

export function ehGerente(role?: string | null) {
  return role === 'gerente_loja';
}

/**
 * Quem enxerga o seletor de empresas e pode alternar entre LAM e Higix.
 * Vale para quem tem acesso_global marcado OU está no nível 1 da hierarquia
 * (admin), independente do cargo.
 */
export function podeTrocarEmpresa(user?: { acesso_global?: number | null; hierarquia?: number | null } | null) {
  if (!user) return false;
  return user.acesso_global === 1 || user.hierarquia === 1;
}
