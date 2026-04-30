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
