import { getDb } from './db';

/**
 * Popula o banco com dados de exemplo da LAM Deccor.
 * Roda automaticamente se o banco estiver vazio.
 */
export function seedIfEmpty() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM lojas').get() as { c: number };
  if (count.c > 0) return;

  // ----- Lojas -----
  const insertLoja = db.prepare(
    'INSERT INTO lojas (nome, cidade, endereco) VALUES (?, ?, ?)'
  );
  const lojaIds: number[] = [];
  [
    ['LAM Centro SJC', 'São José dos Campos', 'R. Francisco Paes, 242'],
    ['LAM Shopping Jardim Oriente', 'São José dos Campos', 'Av. dos Imigrantes Italianos'],
    ['LAM Saldão de Fábrica', 'Jacareí', 'Rod. Pres. Dutra (sede)'],
    ['LAM Centro Taubaté', 'Taubaté', 'Rua Souza Alves'],
    ['LAM Shopping Buriti', 'Guaratinguetá', 'Av. João Pessoa'],
  ].forEach(([nome, cidade, end]) => {
    const r = insertLoja.run(nome, cidade, end);
    lojaIds.push(r.lastInsertRowid as number);
  });

  // ----- Users -----
  const insertUser = db.prepare(
    `INSERT INTO users (nome, usuario, email, senha, role, hierarquia, cargo, loja_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const userIds: Record<string, number> = {};

  // Admin (admin / admin123)
  let r = insertUser.run('Abner Rost', 'admin', 'abner@lamdeccor.com.br', 'admin123', 'admin', 1, 'Diretor de Marketing', null);
  userIds.admin = r.lastInsertRowid as number;

  r = insertUser.run('Mariana Souza', 'mariana', 'mariana@lamdeccor.com.br', 'mariana', 'social_media', 4, 'Social Media Lead', null);
  userIds.mariana = r.lastInsertRowid as number;

  r = insertUser.run('Diego Almeida', 'diego', 'diego@lamdeccor.com.br', 'diego', 'gestor_trafego', 3, 'Gestor de Tráfego', null);
  userIds.diego = r.lastInsertRowid as number;

  r = insertUser.run('Camila Roque', 'camila.roque', 'camila.r@lamdeccor.com.br', 'camila', 'designer', 4, 'Designer Sênior', null);
  userIds.camila_designer = r.lastInsertRowid as number;

  r = insertUser.run('Lucas Mendes', 'lucas', 'lucas@lamdeccor.com.br', 'lucas', 'coordenador', 2, 'Coordenador de Marketing', null);
  userIds.lucas = r.lastInsertRowid as number;

  r = insertUser.run('Patricia Vieira', 'patricia', 'patricia@lamdeccor.com.br', 'patricia', 'gerente_loja', 5, 'Gerente Centro SJC', lojaIds[0]);
  userIds.patricia = r.lastInsertRowid as number;
  r = insertUser.run('Rafael Costa', 'rafael', 'rafael@lamdeccor.com.br', 'rafael', 'gerente_loja', 5, 'Gerente Jardim Oriente', lojaIds[1]);
  userIds.rafael = r.lastInsertRowid as number;
  r = insertUser.run('Camila Toledo', 'camila.toledo', 'camila.t@lamdeccor.com.br', 'camila', 'gerente_loja', 5, 'Gerente Saldão Jacareí', lojaIds[2]);
  userIds.camila_gerente = r.lastInsertRowid as number;
  r = insertUser.run('Sergio Pinto', 'sergio', 'sergio@lamdeccor.com.br', 'sergio', 'gerente_loja', 5, 'Gerente Taubaté', lojaIds[3]);
  userIds.sergio = r.lastInsertRowid as number;
  r = insertUser.run('Helena Carvalho', 'helena', 'helena@lamdeccor.com.br', 'helena', 'gerente_loja', 5, 'Gerente Buriti Guara', lojaIds[4]);
  userIds.helena = r.lastInsertRowid as number;

  // ----- Influencers -----
  const insertInf = db.prepare(`
    INSERT INTO influencers
    (nome, handle, cidade, loja_id, perfil, alcance_medio, engajamento,
     cache_mensal, bonus_pct, status, observacoes,
     valor_acordo, acordo_inicio, acordo_fim)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const infs: Array<{ id: number; redes: any[] }> = [];

  const infData: any[] = [
    {
      base: ['Juliana Reis', '@juliareis.casa', 'São José dos Campos', lojaIds[0],
        'Família e lifestyle adulto - decoração e rotina de casa', 85000, 4.2, 3500, 10, 'ativo',
        'Top performer - audiência fiel, alta intenção de compra', 12000, '2026-04-01', '2026-12-31'],
      redes: [
        { rede: 'instagram', url: 'https://instagram.com/juliareis.casa', seguidores: 85000, engajamento: 4.2 },
        { rede: 'tiktok', url: 'https://tiktok.com/@juliareis', seguidores: 32000, engajamento: 6.5 },
      ]
    },
    {
      base: ['Marina Falcão', '@marina_inhome', 'São José dos Campos', lojaIds[1],
        'Mãe 35-45 anos, rotina familiar, dicas de decoração', 62000, 5.8, 2800, 10, 'ativo',
        'Engajamento acima da média do nicho', 9600, '2026-04-15', '2026-10-15'],
      redes: [
        { rede: 'instagram', url: 'https://instagram.com/marina_inhome', seguidores: 62000, engajamento: 5.8 },
        { rede: 'youtube', url: 'https://youtube.com/@marinainhome', seguidores: 18000, engajamento: 3.2 },
      ]
    },
    {
      base: ['Carlos Padilha', '@padilhadiy', 'Jacareí', lojaIds[2],
        'Investidor / casa própria / DIY - tour de fábrica e bastidor', 41000, 3.6, 2200, 10, 'em_negociacao',
        'Bom para conteúdo de processo e personalização', 0, null, null],
      redes: [
        { rede: 'instagram', url: 'https://instagram.com/padilhadiy', seguidores: 41000, engajamento: 3.6 },
        { rede: 'youtube', url: 'https://youtube.com/@padilhadiy', seguidores: 28000, engajamento: 4.1 },
      ]
    },
    {
      base: ['Bia Tavares', '@biatavares.tba', 'Taubaté', lojaIds[3],
        'Lifestyle regional - eventos, gastronomia, vida no Vale', 28000, 6.1, 1800, 10, 'ativo',
        'Ótima cobertura de Festa Junina e eventos locais', 7200, '2026-04-01', '2026-09-30'],
      redes: [
        { rede: 'instagram', url: 'https://instagram.com/biatavares.tba', seguidores: 28000, engajamento: 6.1 },
        { rede: 'tiktok', url: 'https://tiktok.com/@biatavares', seguidores: 15000, engajamento: 8.2 },
      ]
    },
    {
      base: ['Renato Mello', '@renatomello.guara', 'Guaratinguetá', lojaIds[4],
        'Família tradicional do Vale histórico - emocional, raízes', 19000, 7.4, 1500, 10, 'prospeccao',
        'Em avaliação - audiência muito alinhada com ICP', 0, null, null],
      redes: [
        { rede: 'instagram', url: 'https://instagram.com/renatomello.guara', seguidores: 19000, engajamento: 7.4 },
      ]
    },
  ];

  const insertRede = db.prepare(`
    INSERT INTO influencer_redes (influencer_id, rede, url, seguidores, engajamento)
    VALUES (?, ?, ?, ?, ?)
  `);

  infData.forEach(({ base, redes }) => {
    const r = insertInf.run(...base);
    const id = r.lastInsertRowid as number;
    infs.push({ id, redes });
    redes.forEach((rd: any) => insertRede.run(id, rd.rede, rd.url, rd.seguidores, rd.engajamento));
  });

  // Campanhas dos influencers
  const insertCamp = db.prepare(`
    INSERT INTO influencer_campanhas
    (influencer_id, campanha_nome, data_inicio, data_fim, investimento, vendas_atribuidas, views, engajamentos, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCamp.run(infs[0].id, 'Hora da mãe descansar', '2026-04-28', '2026-05-12',
    8500, 38000, 142000, 5800, 'Filme principal com a mãe da Juliana');
  insertCamp.run(infs[1].id, 'Hora da mãe descansar', '2026-04-28', '2026-05-12',
    6500, 22000, 88000, 4900, 'Reels com bastidor da escolha do sofá');
  insertCamp.run(infs[3].id, 'Festa Junina LAM', '2026-06-01', '2026-06-30',
    4200, 0, 0, 0, 'A iniciar - cobertura de festa em Taubaté');

  // ----- Campanhas publicitárias (modelo briefing) -----
  const insertCampanha = db.prepare(`
    INSERT INTO campanhas (nome, slogan, data_inicio, data_fim, orcamento, kpi_base, status, capa_cor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCanal = db.prepare(`
    INSERT INTO campanha_canais (campanha_id, canal, conteudo, ordem)
    VALUES (?, ?, ?, ?)
  `);

  // Campanha Maes 2026
  const cMaes = insertCampanha.run(
    'Hora da mãe descansar',
    'Maio 2026 — Dia das Mães',
    '2026-04-25', '2026-05-12',
    52000,
    'Faturamento de abril como base; comparativo com Maes 2023, 2024 e 2025.',
    'em_execucao',
    '#E8B4D6'
  ).lastInsertRowid as number;

  const canaisM = [
    ['INSTAGRAM', `Cronograma de conteúdos conectando estes temas:
• Família unida
• Sofá sendo usado
• Processo de produção
• Sanar dúvidas
• Durabilidade
• Qualidade
• Sustentabilidade
• Apresentação do produto
• Conteúdo para casa com Pets
• Foco maior na sala de estar
• Vídeo entrega em casarão
• Conteúdo que foque em responder possíveis dúvidas do produto
• Entrevista no Shopping
• Premiação a base de brincadeira no shopping`],
    ['META ADS', `Trabalharemos com todos setor do funil.
• Campanha de leads — somente para remarketing de impactados/interessados. Uma campanha por cidade, direcionando direto ao WhatsApp da loja. Usaremos como criativos os vídeos que melhor performar nos reels e considerações.
• Campanha Engajamento — focando em aumento de views, usando as próprias postagens.
• Campanha Engajamento — focando em aumento curtida e comentário nas postagens existentes.
• Campanha de ganho de seguidores — usando conteúdo de influencers e CTA para seguir.
• Campanha Dia das Mães — leads focando em preenchimento de formulário para WhatsApp.
• Campanha Leads Colchão — público nichado, criativos juntando saúde + conforto + CTA.`],
    ['GOOGLE ADS', `Trabalharemos somente campanhas para fundo do funil.
• Campanha de Pesquisa — somente para pesquisas de sofá, colchão, palavras-chave. Ranking padrão e necessário.
• Campanha Vídeo YouTube ADS — divulgando o vídeo comercial de Dia das Mães. Roteiro storyboard será apresentado em breve.`],
    ['WHATSAPP', `Devemos focar nas postagens e remarketing também, conhecido também como follow-up.
• Postar stories no WhatsApp.
• Postar venda saindo com intuito de efeito manada.
• Disparo CALMO E DE POUCO EM POUCO para compradores de colchão de 4 anos atrás.`],
    ['RECLAME AQUI', `• Conseguir selo verificação pago
• Adicionar foto
• Adicionar capa
• Adicionar vídeo institucional produzido exclusivamente para Reclame Aqui, postado no perfil do YouTube.`],
    ['INFLUENCERS', `Teremos até o dia 31/05 para trabalhar. Os influencers escolhidos devem criar conteúdo presenteando a mãe deles.
Um vídeo emocional, focando no presente e deixando a marca LAM Deccor como secundário, propositalmente, para não infringir o momento emocional com pub agressiva.`],
    ['GMN (Google Meu Negócio)', `• Rever site cadastrado
• Rever número cadastrado
• Subir postagens
• Subir novas fotos
• Subir prints de feedback`],
    ['MÍDIA OFF', `• Token no Shopping
• Pub telão do shopping
• Adesivamento porta de elevador
• Wind Banner da campanha porta da loja
• Cesta de rosas na porta da loja, quinta-domingo, com panfleto da campanha para pessoas que retirarem na porta da loja.`],
    ['DESIGNER', `• Arte oficial da campanha
• Fotos de mães nas lojas
• Arte do Wind Banner
• Arte do panfleto
• Vídeo-arte da campanha para TVs do shopping`],
    ['AUDIOVISUAL', `• Videofilme comercial "Hora da mãe descansar"
• Teaser maes descansando + letreiro`],
    ['DADOS', `Iremos usar como KPI base o faturamento do mês abril para faturamento do mês de maio.
Usaremos como comparativo o Dia das Mães 2023, 2024 e 2025.
As campanhas familiares terão como objetivo de impacto posicionamento a longo prazo.`],
  ];
  canaisM.forEach((c, i) => insertCanal.run(cMaes, c[0], c[1], i));

  // Campanha Festa Junina
  const cJun = insertCampanha.run(
    'Casa cheia, sofá cheio',
    'Junho 2026 — Festa Junina',
    '2026-06-01', '2026-06-30',
    24000,
    'Conteúdo orgânico cresce 15% e ativações com mais de 100 pessoas/loja.',
    'planejamento',
    '#C97B5F'
  ).lastInsertRowid as number;
  [
    ['INSTAGRAM', 'Reels com receitas e decoração junina dentro da fábrica. LAM mostra a própria casa cheia.'],
    ['META ADS', 'Campanhas de awareness regional + remarketing em quem assistiu Reels juninos.'],
    ['INFLUENCERS', 'Bia Tavares cobrindo festa em Taubaté + ativação com clientes existentes.'],
    ['MÍDIA OFF', 'Apoio leve a festas juninas escolares e de bairro nas 5 praças do Vale.'],
    ['AUDIOVISUAL', 'Vídeo curto da festa LAM (B2B+B2C) na loja Centro SJC.'],
  ].forEach((c, i) => insertCanal.run(cJun, c[0], c[1], i));

  // ----- Eventos do calendário -----
  const insertEv = db.prepare(`
    INSERT INTO eventos (titulo, data, hora_inicio, hora_fim, tipo, local, loja_id, organizador_id, descricao, ata, cor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertConv = db.prepare(`
    INSERT INTO evento_convidados (evento_id, user_id, status) VALUES (?, ?, ?)
  `);

  let ev = insertEv.run('Briefing comercial Mães', '2026-04-28', '10:00', '11:30', 'reuniao',
    'Sala de reuniões — fábrica Jacareí', null, userIds.admin,
    'Alinhamento com produtora do filme emocional', '', '#2D5F97').lastInsertRowid as number;
  [userIds.mariana, userIds.diego, userIds.camila_designer, userIds.lucas].forEach(u => insertConv.run(ev, u, 'confirmado'));

  ev = insertEv.run('Início de gravações - Mães', '2026-05-02', '08:00', '18:00', 'campanha',
    'Fábrica + casa de cliente em SJC', null, userIds.mariana,
    'Captação na fábrica e nas casas das três famílias', '', '#0F2A4A').lastInsertRowid as number;
  insertConv.run(ev, userIds.admin, 'confirmado');
  insertConv.run(ev, userIds.lucas, 'confirmado');

  ev = insertEv.run('Dia das Mães', '2026-05-10', null, null, 'campanha', null, null, userIds.admin,
    'Pico da campanha "Hora da mãe descansar"', '', '#C49F5B').lastInsertRowid as number;

  ev = insertEv.run('Treinamento WhatsApp lojas', '2026-05-04', '14:00', '16:00', 'reuniao',
    'Online (Google Meet)', null, userIds.lucas,
    'Script atualizado para janela de Maio', '', '#2D5F97').lastInsertRowid as number;
  Object.values(userIds).filter((_, i) => i >= 5).forEach(u => insertConv.run(ev, u, 'convidado'));

  ev = insertEv.run('Dia dos Namorados', '2026-06-12', null, null, 'campanha', null, null, userIds.admin,
    'Campanha "Casal que escolhe junto"', '', '#143C6B').lastInsertRowid as number;

  ev = insertEv.run('Festa LAM (B2B+B2C)', '2026-06-21', '18:00', '22:00', 'evento_loja',
    'LAM Centro SJC', lojaIds[0], userIds.lucas,
    'Quadrilha + comida típica - clientes e arquitetos', '', '#0F2A4A').lastInsertRowid as number;

  ev = insertEv.run('Feira Decoração LAM (1ª edição)', '2026-08-15', '10:00', '20:00', 'feira',
    'LAM Centro SJC', lojaIds[0], userIds.admin,
    'Edição inaugural - 12 parceiros curados', '', '#C49F5B').lastInsertRowid as number;

  // ----- Anúncios (mock) -----
  const insertAd = db.prepare(`
    INSERT INTO anuncios (campanha, plataforma, status, investimento, impressoes, cliques, conversoes, cpc, ctr, data_inicio, data_fim)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAd.run('Hora da mãe descansar - Awareness', 'meta', 'ativo', 8200, 285000, 6420, 142, 1.28, 2.25, '2026-04-26', null);
  insertAd.run('Hora da mãe descansar - Conversão', 'meta', 'ativo', 12500, 142000, 4830, 98, 2.59, 3.40, '2026-04-26', null);
  insertAd.run('Sofá Verde Musgo', 'meta', 'ativo', 4200, 88000, 2100, 41, 2.00, 2.39, '2026-04-15', null);
  insertAd.run('Always-on - Sofá em L', 'meta', 'ativo', 3500, 65000, 1820, 34, 1.92, 2.80, '2026-04-01', null);
  insertAd.run('YouTube - Tour Fábrica', 'youtube', 'ativo', 2800, 124000, 980, 18, 2.86, 0.79, '2026-04-10', null);
  insertAd.run('Google - Sofá sob medida', 'google', 'ativo', 5400, 42000, 3120, 88, 1.73, 7.43, '2026-03-15', null);
  insertAd.run('Black Friday Teaser', 'meta', 'pausado', 1200, 32000, 480, 6, 2.50, 1.50, '2026-03-20', '2026-04-05');

  // ----- Integrações -----
  const insertInteg = db.prepare(`
    INSERT INTO integracoes (plataforma, nome_conta, conectado, ultima_sync, detalhes)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertInteg.run('meta_ads', '', 0, '', '');
  insertInteg.run('google_ads', '', 0, '', '');
  insertInteg.run('tiktok_ads', '', 0, '', '');
  insertInteg.run('youtube', '', 0, '', '');

  // ----- Posts sociais -----
  const insertPost = db.prepare(`
    INSERT INTO posts (titulo, texto, rede, formato, status, data_publicacao, hora, responsavel_id, campanha, hashtags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPost.run('Bastidor - sofá da Juliana', 'Acompanhe como nasceu o sofá da casa da Juliana...',
    'instagram', 'reels', 'agendado', '2026-04-29', '09:00', userIds.mariana, 'Hora da mãe descansar',
    '#sofalamdeccor #diadasmaes #fabricapropria');
  insertPost.run('Carrossel - 3 tecidos para Mães', 'Veludo, linho ou bouclé? Qual combina com a sua mãe?',
    'instagram', 'carrossel', 'agendado', '2026-05-03', '11:00', userIds.mariana, 'Hora da mãe descansar',
    '#tecidos #decoracao #mae');
  insertPost.run('TikTok - escolhendo sofá da minha mãe', 'POV: depois de 30 anos...',
    'tiktok', 'video', 'rascunho', '2026-05-06', '18:00', userIds.mariana, 'Hora da mãe descansar', '#mae #fyp');
  insertPost.run('Tour pela fábrica', 'Conheça quem faz o seu sofá',
    'youtube', 'video', 'publicado', '2026-04-18', '14:00', userIds.mariana, null, '');
  insertPost.run('Stories - Combo Mãe na Sala', 'Personalize agora',
    'instagram', 'story', 'agendado', '2026-05-05', '10:00', userIds.mariana, 'Hora da mãe descansar', '');

  // ----- Financeiro -----
  const insertFin = db.prepare(`
    INSERT INTO financeiro (tipo, categoria, descricao, valor, data, campanha, loja_id, fornecedor, nf_numero, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFin.run('saida', 'Mídia paga', 'Meta Ads - Awareness Mães', 8200, '2026-04-26', 'Hora da mãe descansar', null, 'Meta Platforms', 'NFE-998811', 'pago');
  insertFin.run('saida', 'Mídia paga', 'Meta Ads - Conversão Mães', 12500, '2026-04-26', 'Hora da mãe descansar', null, 'Meta Platforms', 'NFE-998812', 'pago');
  insertFin.run('saida', 'Produção', 'Produtora filme emocional', 22000, '2026-04-28', 'Hora da mãe descansar', null, 'Estúdio Vale Films', 'NFS-2241', 'pago');
  insertFin.run('saida', 'Influencer', 'Juliana Reis - cachê + bônus', 8500, '2026-04-28', 'Hora da mãe descansar', null, 'Juliana Reis MEI', 'RPA-001', 'pago');
  insertFin.run('saida', 'Influencer', 'Marina Falcão - cachê + bônus', 6500, '2026-04-28', 'Hora da mãe descansar', null, 'Marina Falcão ME', 'RPA-002', 'pago');
  insertFin.run('saida', 'Mídia OFF', 'Painel Vale Sul Shopping', 3800, '2026-04-20', 'Hora da mãe descansar', null, 'Vale Sul Mídia', 'NFS-1118', 'pago');
  insertFin.run('saida', 'Designer', 'Arte Wind Banner + panfletos', 2200, '2026-04-22', 'Hora da mãe descansar', null, 'Camila Roque ME', 'NFS-455', 'pago');
  insertFin.run('saida', 'Mídia paga', 'Google Ads - Pesquisa sofá', 5400, '2026-04-10', null, null, 'Google LLC', 'NFE-887766', 'pago');
  insertFin.run('saida', 'Mídia paga', 'YouTube - Tour fábrica', 2800, '2026-04-10', null, null, 'Google LLC', 'NFE-887765', 'pago');
  insertFin.run('entrada', 'Vendas atribuídas', 'Vendas com origem campanha (parcial)', 184000, '2026-04-25', 'Hora da mãe descansar', lojaIds[0], '', '', 'pago');
  insertFin.run('entrada', 'Vendas atribuídas', 'Vendas always-on (mês)', 68000, '2026-04-25', null, null, '', '', 'pago');

  // ----- Solicitações -----
  const insertSol = db.prepare(`
    INSERT INTO solicitacoes (tipo, titulo, descricao, loja_id, solicitante_id, responsavel_id, prioridade, status, prazo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSol.run('arte', 'Banner novo na vitrine - Mães',
    'Trocar a comunicação visual da loja para o tema "Hora da mãe descansar". Tamanho 2m x 1m.',
    lojaIds[0], userIds.patricia, userIds.camila_designer, 'alta', 'em_execucao', '2026-05-02');
  insertSol.run('panfleto', 'Material impresso para Festa Junina',
    'Flyers e brindes para evento local na praça de Taubaté.',
    lojaIds[3], userIds.sergio, userIds.camila_designer, 'media', 'aberta', '2026-06-01');
  insertSol.run('post', 'Post para reabertura pós-feriado',
    'Loja vai reabrir dia 02. Precisamos de um post de Stories e feed.',
    lojaIds[2], userIds.camila_gerente, userIds.mariana, 'media', 'em_analise', '2026-05-15');
  insertSol.run('anuncio', 'Anúncio local para Jardim Oriente',
    'Aumentar fluxo de loja durante mês de maio - cliente local.',
    lojaIds[1], userIds.rafael, userIds.diego, 'baixa', 'aberta', '2026-05-20');
  insertSol.run('video', 'Vídeo institucional Loja Buriti',
    'Vídeo curto da loja para postar nas nossas redes locais.',
    lojaIds[4], userIds.helena, userIds.mariana, 'media', 'aberta', '2026-06-15');

  // ----- Afazeres -----
  const insertAf = db.prepare(`
    INSERT INTO afazeres (titulo, descricao, coluna, prioridade, time, responsavel_id, campanha, prazo, ordem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAf.run('Aprovar conceito do filme Mães',
    'Validar storyboard completo com diretoria. Apresentar 3 referências e definir tom.',
    'a_fazer', 'urgente', 'Coordenação', userIds.admin, 'Hora da mãe descansar', '2026-04-28', 1);
  insertAf.run('Selecionar produtora',
    'Comparar 3 cotações recebidas: Vale Films, Estúdio Mais, Cabeça de Filme.',
    'a_fazer', 'alta', 'Coordenação', userIds.admin, 'Hora da mãe descansar', '2026-04-29', 2);
  insertAf.run('Mapear influencers para Festa Junina',
    'Cobertura nas 5 praças. Bia Tavares já confirmada em Taubaté.',
    'a_fazer', 'media', 'Mídia', userIds.mariana, 'Casa cheia, sofá cheio', '2026-05-15', 3);
  insertAf.run('Reativar campanha Sofá em L',
    'Performance subiu +100% no Google Trends. Subir verba.',
    'a_fazer', 'baixa', 'Tráfego', userIds.diego, null, '2026-05-08', 4);
  insertAf.run('Briefing de conteúdo da Bia (Taubaté)',
    'Roteiro Reels e Stories - 6 entregas no mês de junho.',
    'em_andamento', 'media', 'Conteúdo', userIds.mariana, 'Casa cheia, sofá cheio', '2026-05-10', 1);
  insertAf.run('Setup das landing pages /maes-2026',
    'Tagueamento UTM completo + integração com WhatsApp Business.',
    'em_andamento', 'alta', 'Tráfego', userIds.diego, 'Hora da mãe descansar', '2026-05-01', 2);
  insertAf.run('Padronizar Google Business das 5 lojas',
    'Auditoria + checklist de fotos, horário, descrições, posts semanais.',
    'em_andamento', 'media', 'Operações', userIds.lucas, null, '2026-05-30', 3);
  insertAf.run('Roteiro do filme - 3 famílias',
    'Casting interno. Entrevistar mães + filhos. Aprovação até 30/04.',
    'em_revisao', 'urgente', 'Audiovisual', userIds.mariana, 'Hora da mãe descansar', '2026-04-30', 1);
  insertAf.run('Combo Mãe na Sala - artes finais',
    'Embalagem premium + flyer da loja. Final dia 03/05.',
    'em_revisao', 'media', 'Design', userIds.camila_designer, 'Hora da mãe descansar', '2026-05-03', 2);
  insertAf.run('Brand book preliminar v1',
    'Paleta + tipografia + tom de voz - documento vivo.',
    'concluido', 'alta', 'Coordenação', userIds.admin, null, '2026-04-22', 1);
  insertAf.run('Pesquisa de produtoras locais',
    'Lista de 8 produtoras do Vale com cotações recebidas.',
    'concluido', 'media', 'Coordenação', userIds.admin, 'Hora da mãe descansar', '2026-04-24', 2);

  // ----- Notificações -----
  const insertNot = db.prepare(`
    INSERT INTO notificacoes (user_id, titulo, mensagem, tipo, link, lida)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNot.run(userIds.admin, 'Filme emocional precisa de aprovação',
    'Storyboard do filme Mães está aguardando sua aprovação para gravação.',
    'urgent', '/afazeres', 0);
  insertNot.run(userIds.admin, 'Nova solicitação - Loja Centro SJC',
    'Patricia abriu uma solicitação de banner para a vitrine.',
    'info', '/solicitacoes', 0);
  insertNot.run(userIds.admin, 'Campanha Mães bateu meta de impressões',
    'A campanha Awareness ultrapassou 285k impressões em 24h.',
    'success', '/anuncios', 0);
  insertNot.run(userIds.admin, 'Lembrete: gravação amanhã',
    'Início de captação na fábrica - 02/05 às 08:00.',
    'warning', '/calendario', 1);
}
