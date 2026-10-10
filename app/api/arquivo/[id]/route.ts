import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getDb, UPLOADS_DIR } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getEmpresaId } from '@/lib/empresa';

/**
 * Serve um anexo pelo id. O caminho em disco vem do banco, nunca da URL —
 * assim não existe caminho relativo que o visitante possa manipular para
 * ler outro arquivo do servidor.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse('Não autorizado', { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return new NextResponse('Inválido', { status: 400 });

  const anexo = getDb().prepare(
    'SELECT caminho, tipo, nome_original FROM anexos WHERE id = ? AND empresa_id = ?'
  ).get(id, await getEmpresaId()) as
    { caminho: string; tipo: string; nome_original: string } | undefined;

  if (!anexo) return new NextResponse('Não encontrado', { status: 404 });

  const completo = path.join(UPLOADS_DIR, anexo.caminho);
  // Cinto e suspensório: mesmo vindo do banco, confere que não escapou da pasta
  if (!path.resolve(completo).startsWith(path.resolve(UPLOADS_DIR))) {
    return new NextResponse('Não encontrado', { status: 404 });
  }
  if (!fs.existsSync(completo)) return new NextResponse('Arquivo não está mais no servidor', { status: 404 });

  const arquivo = fs.readFileSync(completo);
  // Aspas escapadas no nome: senão um nome com " quebraria o cabeçalho
  const nomeSeguro = anexo.nome_original.replace(/["\\]/g, '');

  return new NextResponse(new Uint8Array(arquivo), {
    headers: {
      'Content-Type': anexo.tipo,
      'Content-Length': String(arquivo.length),
      'Content-Disposition': `inline; filename="${nomeSeguro}"`,
      'Cache-Control': 'private, max-age=3600',
      // O arquivo é de terceiros: impede que o navegador o trate como script
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
