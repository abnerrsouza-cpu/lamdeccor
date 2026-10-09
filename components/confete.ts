/**
 * Confete em canvas, sem dependência externa. Desenha partículas que caem
 * com gravidade e somem sozinhas; o canvas se remove no fim.
 * Respeita quem pediu menos animação no sistema.
 */
export function soltarConfete(cores = ['#0F2A4A', '#C9A227', '#2D5F97', '#E8C547', '#FFFFFF']) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const L = window.innerWidth;
  const A = window.innerHeight;

  const particulas = Array.from({ length: 140 }, () => ({
    x: L / 2 + (Math.random() - 0.5) * L * 0.5,
    y: A * 0.35 + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 11,
    vy: Math.random() * -13 - 4,
    larg: 6 + Math.random() * 6,
    alt: 9 + Math.random() * 7,
    giro: Math.random() * Math.PI,
    vgiro: (Math.random() - 0.5) * 0.35,
    cor: cores[Math.floor(Math.random() * cores.length)],
  }));

  const inicio = performance.now();
  const DURACAO = 2600;

  // requestAnimationFrame congela quando a aba perde o foco. Sem esta rede
  // o canvas ficaria preso na tela ao trocar de aba no meio da animação.
  const limpezaForcada = setTimeout(() => canvas.remove(), DURACAO + 1500);

  function quadro(agora: number) {
    const t = agora - inicio;
    ctx!.clearRect(0, 0, L, A);

    for (const p of particulas) {
      p.vy += 0.32;          // gravidade
      p.vx *= 0.995;         // resistência do ar
      p.x += p.vx;
      p.y += p.vy;
      p.giro += p.vgiro;

      ctx!.save();
      ctx!.globalAlpha = Math.max(0, 1 - t / DURACAO);
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.giro);
      ctx!.fillStyle = p.cor;
      ctx!.fillRect(-p.larg / 2, -p.alt / 2, p.larg, p.alt);
      ctx!.restore();
    }

    if (t < DURACAO) {
      requestAnimationFrame(quadro);
    } else {
      clearTimeout(limpezaForcada);
      canvas.remove();
    }
  }

  requestAnimationFrame(quadro);
}
