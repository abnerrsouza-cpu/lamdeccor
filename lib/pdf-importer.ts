/**
 * Parser específico para PDFs de cronograma de conteúdo no padrão LAM Deccor.
 * Sem IA, sem custo. Funciona com qualquer PDF que siga o template:
 *   - Cabeçalho do mês (ex: "Maio 2026" ou "MAIO 2026")
 *   - Cada post começa com "DD/MM" seguido do FORMATO (REELS|CARROSSEL|FOTO|FILME|STORY)
 *   - Linha do hook/título logo após
 */

export type PostExtraido = {
  data: string;          // YYYY-MM-DD
  formato: string;       // reels | carrossel | foto | filme | story
  titulo: string;        // hook (frase curta)
  descricao: string;     // resumo do roteiro
  campanha?: string;     // nome da campanha se mencionada
  observacoes?: string;
};

const MESES_PT: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, 'março': 3, abril: 4, maio: 5,
  junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const FORMATOS_VALIDOS = ['reels', 'carrossel', 'foto', 'filme', 'story', 'feed'];

function detectarMesAno(texto: string): { ano: number; mes: number } {
  // Procura "Maio 2026" ou "MAIO 2026" no início do texto
  const re = new RegExp(
    `\\b(${Object.keys(MESES_PT).join('|')})\\s+(20\\d{2})\\b`,
    'i'
  );
  const m = texto.match(re);
  if (m) {
    const mes = MESES_PT[m[1].toLowerCase()];
    return { ano: parseInt(m[2], 10), mes };
  }
  // Fallback: ano e mês atuais
  const now = new Date();
  return { ano: now.getFullYear(), mes: now.getMonth() + 1 };
}

function detectarCampanhaPrincipal(texto: string): string | undefined {
  const m = texto.match(/CAMPANHA[\s·:-]+([A-Z][A-ZÁ-Úa-zá-ú\s'"-]{3,80})/);
  if (m) {
    return m[1].trim().replace(/[\s.]+$/, '');
  }
  return undefined;
}

/**
 * Parser principal — recebe texto extraído do PDF, devolve lista de posts.
 */
export function parsearTextoCronograma(texto: string): {
  ano: number;
  mes: number;
  campanha_principal?: string;
  posts: PostExtraido[];
} {
  const { ano, mes } = detectarMesAno(texto);
  const campanha_principal = detectarCampanhaPrincipal(texto);

  const posts: PostExtraido[] = [];

  // Padrão: "DD/MM" seguido (perto) por FORMATO em maiúsculas
  // Ex: "01/05 REELS VOXPOP"
  const blocoRe = /(\d{2})\/(\d{2})\s+(REELS|CARROSSEL(?:\s*·\s*\d+\s*SLIDES)?|FOTO|FILME(?:\s+OFICIAL)?|STORY)\s+([A-ZÁ-Ú][^\n]{0,120})/g;
  let match: RegExpExecArray | null;
  const matches: { dia: number; mesPost: number; formato: string; tema: string; idx: number }[] = [];

  while ((match = blocoRe.exec(texto)) !== null) {
    const dia = parseInt(match[1], 10);
    const mesPost = parseInt(match[2], 10);
    let formato = match[3].toLowerCase();
    if (formato.startsWith('carrossel')) formato = 'carrossel';
    else if (formato.startsWith('filme')) formato = 'filme';
    if (!FORMATOS_VALIDOS.includes(formato)) formato = 'reels';

    matches.push({
      dia,
      mesPost,
      formato,
      tema: match[4].trim(),
      idx: match.index,
    });
  }

  // Pra cada match, extrai o trecho até o próximo (ou +1500 chars), e tenta
  // pegar o "título/hook" como primeira linha entre aspas.
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const fim = next ? next.idx : Math.min(cur.idx + 2000, texto.length);
    const trecho = texto.slice(cur.idx, fim);

    // Hook: primeira frase entre aspas
    let titulo = '';
    const hookMatch = trecho.match(/["“]([^"”\n]{8,200})["”]/);
    if (hookMatch) {
      titulo = hookMatch[1].trim();
    } else {
      // Fallback: usa o tema
      titulo = cur.tema;
    }

    // Descricao: junta as primeiras linhas significativas após o hook
    let descricao = '';
    const linhas = trecho
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 10 && !/^\d{2}\/\d{2}/.test(l) && !l.includes(titulo));
    descricao = linhas.slice(0, 4).join(' ').slice(0, 500);

    const dataIso = `${ano}-${String(cur.mesPost).padStart(2, '0')}-${String(cur.dia).padStart(2, '0')}`;

    posts.push({
      data: dataIso,
      formato: cur.formato,
      titulo: titulo.slice(0, 200),
      descricao,
      campanha: campanha_principal,
      observacoes: cur.tema !== titulo ? cur.tema : undefined,
    });
  }

  // Dedup por (data + formato): se o regex pegou o mesmo post 2x (cabeçalho + corpo)
  const dedupMap = new Map<string, PostExtraido>();
  for (const p of posts) {
    const key = `${p.data}__${p.formato}`;
    const existing = dedupMap.get(key);
    if (!existing || p.titulo.length > existing.titulo.length) {
      dedupMap.set(key, p);
    }
  }

  return {
    ano,
    mes,
    campanha_principal,
    posts: Array.from(dedupMap.values()).sort((a, b) => a.data.localeCompare(b.data)),
  };
}

/**
 * Recebe Buffer do PDF, extrai texto via pdf-parse e devolve posts.
 */
export async function extrairPostsDoPdf(pdfBuffer: Buffer): Promise<{
  ano: number;
  mes: number;
  campanha_principal?: string;
  posts: PostExtraido[];
}> {
  // Lazy import — pdf-parse tem side-effect ao carregar
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(pdfBuffer);
  const texto = data.text;

  if (!texto || texto.trim().length < 100) {
    throw new Error(
      'Não foi possível extrair texto do PDF. Verifique se o arquivo não está protegido por senha ou se é só imagem (escaneado).'
    );
  }

  const resultado = parsearTextoCronograma(texto);

  if (resultado.posts.length === 0) {
    throw new Error(
      'Nenhum post detectado. O PDF precisa seguir o padrão "DD/MM REELS/CARROSSEL/FOTO/FILME". ' +
      'Veja o template em DEPLOY-RAILWAY.md.'
    );
  }

  return resultado;
}
