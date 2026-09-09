import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Senhas novas são guardadas como scrypt: "scrypt$<salt-hex>$<hash-hex>".
 * As contas antigas foram criadas com a senha em texto puro, então a
 * verificação aceita os dois formatos — assim ninguém é trancado para fora.
 * Toda senha gravada daqui em diante passa por hashSenha.
 */
const PREFIXO = 'scrypt';

export function hashSenha(senha: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, 64);
  return `${PREFIXO}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function ehHash(guardada: string | null | undefined): boolean {
  return typeof guardada === 'string' && guardada.startsWith(`${PREFIXO}$`);
}

export function verificaSenha(senha: string, guardada: string | null | undefined): boolean {
  if (!guardada) return false;

  if (!ehHash(guardada)) {
    // Conta legada: comparação direta, em tempo constante
    const a = Buffer.from(senha);
    const b = Buffer.from(guardada);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  const [, saltHex, hashHex] = guardada.split('$');
  if (!saltHex || !hashHex) return false;
  try {
    const esperado = Buffer.from(hashHex, 'hex');
    const obtido = scryptSync(senha, Buffer.from(saltHex, 'hex'), esperado.length);
    return timingSafeEqual(esperado, obtido);
  } catch {
    return false;
  }
}
