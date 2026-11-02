/* ==========================================================================
   Museu do Médio São Francisco · Bom Jesus da Lapa, Bahia
   Aplicação Principal (Regras 1 a 11 de AGENTS.md)
   ========================================================================== */

(function () {
  "use strict";

  var DADOS = window.MUSEU_DADOS_GERAIS || {};
  var NUCLEOS = [].concat(window.MUSEU_NUCLEOS_1_3 || [], window.MUSEU_NUCLEOS_4_6 || []);
  var EXTRAS = window.MUSEU_EXTRAS || {};

  // Flatten all 19 rooms
  var SALAS = [];
  NUCLEOS.forEach(function (n) {
    (n.eixos || []).forEach(function (eixo) {
      eixo.nucleoRomano = n.romano;
      eixo.nucleoTitulo = n.titulo;
      eixo.nucleoTempo = n.tempo;
      SALAS.push(eixo);
    });
  });

  // Application State
  var STATE = {
    currentView: "museu",
    selectedNucleo: "todos",
    selectedSalaNum: 0, // 0 = show all filtered salas, 1..19 = focused sala
    acervoSubTab: "titulares", // "titulares" | "itens"
    selectedTitularId: "adolpho-lutz-astrogildo-machado",
    titularBioExpanded: false,
    galleryViewMode: "cards", // "lista" | "cards" | "blocos"
    acervoSearchQuery: "",
    acervoFilterTitular: "todos",
    acervoFilterCidade: "todas",
    acervoFilterTema: "todos",
    acervoFilterVerificacao: "todos",
    cidadesSubTab: "cidades", // "cidades" | "caderno"
    selectedCidadeId: "bom-jesus-da-lapa",
    timelineTema: "todos",
    timelineVerificacao: "todos",
    mapaFiltroTipo: "todos",
    pesquisaBusca: "",
    lightboxList: [],
    lightboxIndex: 0,
    leafletMap: null,
    leafletMarkersLayer: null
  };

  // Helper: HTML escape
  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Helper: Verification Badge (Rule 3.2)
  function renderVerificationBadge(status) {
    var st = status || "verificado";
    if (st === "verificado") {
      return '<span class="badge-verificado inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold" title="Conferido na fonte primária ou acervo institucional">✓ Verificado na fonte</span>';
    }
    if (st === "fonte-secundaria") {
      return '<span class="badge-fonte-secundaria inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold" title="Citado por bibliografia secundária; conferência no documento original recomendada">◐ Fonte secundária</span>';
    }
    return '<span class="badge-a-confirmar inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold" title="Hipótese ou relato oral pendente de confirmação em fonte primária">⚠ A confirmar</span>';
  }

  // Helper: License Badge (Rule 3.4)
  function renderLicenseBadge(licenca, exibirImagem) {
    if (!exibirImagem || licenca === "sem-licenca") {
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f3ead8] text-[#1d3b53] border border-[#c9a65b]">🔗 Acervo externo (ficha sem imagem hospedada)</span>';
    }
    if (licenca === "dominio-publico") {
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1d3b53]/10 text-[#1d3b53]">Domínio Público</span>';
    }
    if (licenca === "cc-by") {
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1d3b53]/10 text-[#1d3b53]">Licença Aberta CC BY</span>';
    }
    if (licenca === "cc-by-sa") {
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1d3b53]/10 text-[#1d3b53]">Licença Aberta CC BY-SA</span>';
    }
    if (licenca === "acervo-ims-colorizado-ia") {
      return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fbe6e3] text-[#8c2619] border border-[#ebbab3]">🎨 Original: Marcel Gautherot (IMS) · Colorizado e restaurado por IA</span>';
    }
    return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1d3b53]/10 text-[#1d3b53]">' + esc(licenca) + '</span>';
  }

  // Helper: Filmography & Video References Block
  function renderVideoReferences(videos, sectionHeading) {
    if (!videos || !Array.isArray(videos) || videos.length === 0) return "";
    var heading = sectionHeading || "🎬 Filmografia e Registros em Vídeo (Referências Audiovisuais)";
    var html = '<div class="mt-6 p-5 rounded-xl bg-[#13283a] text-[#f3ead8] border border-[#c9a65b]">';
    html += '  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#c9a65b]/30 pb-3">';
    html += '    <div>';
    html += '      <span class="text-[11px] font-bold uppercase tracking-wider text-[#c9a65b]">Referências Audiovisuais Documentadas na Fonte</span>';
    html += '      <h3 class="font-serif-museu text-lg sm:text-xl font-bold text-white mt-0.5">' + esc(heading) + '</h3>';
    html += '    </div>';
    html += '    <span class="px-2.5 py-1 rounded bg-[#a86f25] text-white text-xs font-bold">' + videos.length + ' filme(s) / registro(s)</span>';
    html += '  </div>';
    html += '  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">';
    videos.forEach(function (v) {
      var targetUrl = v.youtubeUrl || v.link || "#";
      var isYt = Boolean(v.youtubeId);
      html += '    <div class="p-4 rounded-lg bg-[#1d3b53] border border-[#c9a65b]/40 flex flex-col justify-between">';
      html += '      <div>';
      if (isYt) {
        html += '        <a href="' + esc(targetUrl) + '" target="_blank" rel="noopener" class="group relative block w-full h-48 rounded-lg overflow-hidden mb-3 border border-[#c9a65b]/50 bg-black">';
        html += '          <img src="https://i.ytimg.com/vi/' + esc(v.youtubeId) + '/hqdefault.jpg" alt="Miniatura do filme ' + esc(v.titulo) + '" class="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition duration-300" loading="lazy" />';
        html += '          <div class="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition flex items-center justify-center">';
        html += '            <span class="px-4 py-2 rounded-full bg-[#a86f25] group-hover:bg-[#c9a65b] group-hover:text-[#13283a] text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition">▶ Assistir vídeo no YouTube</span>';
        html += '          </div>';
        html += '        </a>';
      }
      html += '        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-[#c9a65b] font-semibold">';
      html += '          <span>' + esc(v.ano) + '</span>';
      if (v.duracao) {
        html += '          <span class="px-2 py-0.5 rounded bg-black/30 text-[#f3ead8] text-[11px]">⏱ ' + esc(v.duracao) + '</span>';
      }
      html += '        </div>';
      html += '        <h4 class="font-serif-museu text-lg font-bold text-white mt-1">🎬 ' + esc(v.titulo) + '</h4>';
      html += '        <p class="text-xs text-[#c9a65b] font-medium mt-0.5">' + esc(v.direcao) + '</p>';
      html += '        <p class="text-xs text-[#f3ead8]/90 mt-2 leading-relaxed">' + esc(v.descricao) + '</p>';
      if (v.resenha) {
        html += '        <div class="mt-3 p-3 rounded bg-[#13283a] border-l-4 border-[#c9a65b] text-xs text-[#f3ead8] leading-relaxed">';
        html += '          ' + esc(v.resenha);
        html += '        </div>';
      }
      html += '      </div>';
      html += '      <div class="mt-3 pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px]">';
      html += '        <span class="text-[#f3ead8]/80"><strong>Acervo / Fonte:</strong> ' + esc(v.acervo) + '</span>';
      if (v.youtubeUrl) {
        html += '        <a href="' + esc(v.youtubeUrl) + '" target="_blank" rel="noopener" class="px-3 py-1.5 rounded bg-[#a86f25] text-white font-bold hover:bg-[#c9a65b] hover:text-[#13283a] transition shrink-0">▶ Assistir no YouTube ↗</a>';
      } else if (v.link) {
        html += '        <a href="' + esc(v.link) + '" target="_blank" rel="noopener" class="px-2.5 py-1 rounded bg-[#c9a65b] text-[#13283a] font-bold hover:bg-white transition shrink-0">Referência externa ↗</a>';
      }
      html += '      </div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';
    return html;
  }

  // ========================================================================
  // Rule 6: Schema Validator (Source of Truth Integrity Check)
  // ========================================================================
  function validateCollectionsSchema() {
    var errors = [];
    var items = EXTRAS.acervo || [];
    items.forEach(function (item, idx) {
      var label = item.id || ("item#" + idx);
      if (!item.credito || String(item.credito).trim() === "") {
        errors.push(label + ": campo obrigatório 'credito' ausente.");
      }
      if (!item.licenca || String(item.licenca).trim() === "") {
        errors.push(label + ": campo obrigatório 'licenca' ausente.");
      }
      if (!item.verificacao || ["verificado", "fonte-secundaria", "a-confirmar"].indexOf(item.verificacao) === -1) {
        errors.push(label + ": campo 'verificacao' inválido.");
      }
      if (!item.fontes || !Array.isArray(item.fontes) || item.fontes.length === 0) {
        errors.push(label + ": campo obrigatório 'fontes' vazio.");
      }
      if (item.exibir_imagem === true && item.licenca === "sem-licenca") {
        errors.push(label + ": VIOLAÇÃO DA REGRA 3.4/6 (exibir_imagem: true com licenca: sem-licenca).");
      }
    });
    return {
      valid: errors.length === 0,
      totalItems: items.length,
      totalTitulares: (EXTRAS.titulares || []).length,
      totalCidades: (EXTRAS.cidades || []).length,
      totalSalas: SALAS.length,
      errors: errors
    };
  }

  // ========================================================================
  // View 1: O MUSEU
  // ========================================================================
  function renderViewMuseu() {
    var el = document.getElementById("view-museu");
    if (!el) return;
    var ap = DADOS.apresentacao || {};
    var imp = EXTRAS.impactoEconomico || {};
    var arq = DADOS.arquitetura || {};
    var soc = DADOS.programaSocioambiental || {};

    var html = '';

    // Hero Banner with Augusto Riedel 1868 (Public Domain) + Museum Crest + Mandatory Credit
    html += '<div class="hero-ims-backdrop text-[#f3ead8] border-b-4 border-[#a86f25]">';
    html += '  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">';
    html += '    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">';
    html += '      <div class="max-w-3xl">';
    html += '        <div class="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded bg-[#13283a]/90 border border-[#c9a65b]/50 text-xs text-[#c9a65b] font-semibold mb-4">';
    html += '          <span>PROJETO CONCEITUAL E ACERVO DIGITAL</span>';
    html += '          <span>·</span>';
    html += '          <span>Bom Jesus da Lapa, Bahia</span>';
    html += '        </div>';
    html += '        <h1 class="font-serif-museu text-3xl sm:text-5xl font-bold text-white leading-tight">';
    html += '          Museu do Médio São Francisco';
    html += '        </h1>';
    html += '        <p class="font-serif-museu text-lg sm:text-2xl text-[#f3ead8] mt-4 leading-relaxed">';
    html += '          “' + esc(ap.missao) + '”';
    html += '        </p>';
    html += '        <p class="text-sm sm:text-base text-[#f3ead8]/90 mt-4 leading-relaxed">';
    html += '          Um museu vivo de natureza, ciência, arte e história no coração do Velho Chico. Enquanto o edifício físico está em fase de articulação institucional, <strong>este portal é a nossa primeira sala aberta ao público</strong> — reunindo as 19 salas temáticas, os titulares de coleção, as fotografias históricas de 1868 e 1912 em domínio público e o Caderno do Trecho pelos viajantes do século XIX.';
    html += '        </p>';
    html += '        <div class="mt-7 flex flex-wrap gap-3">';
    html += '          <button type="button" onclick="navigateTo(\'salas\')" class="px-5 py-2.5 rounded-md bg-[#a86f25] hover:bg-[#835418] text-white font-semibold text-sm shadow transition cursor-pointer">Explorar as 19 Salas →</button>';
    html += '          <button type="button" onclick="navigateTo(\'acervo\')" class="px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white border border-[#c9a65b] font-semibold text-sm transition cursor-pointer">Acervo &amp; Titulares (Modelo IMS)</button>';
    html += '          <button type="button" onclick="openCadernoDoTrecho()" class="px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-[#c9a65b] border border-[#c9a65b]/60 font-semibold text-sm transition cursor-pointer">Ler o Caderno do Trecho (1852–1880)</button>';
    html += '        </div>';
    html += '        <p class="mt-6 text-[11px] text-[#f3ead8]/80 border-l-2 border-[#c9a65b] pl-3">';
    html += '          <strong>Imagem de fundo:</strong> Augusto Riedel, <em>Bom Jesus da Lapa</em>, 1868. Coleção D. Pedro II, Biblioteca Nacional / Library of Congress. Domínio público.';
    html += '        </p>';
    html += '      </div>';
    html += '      <div class="shrink-0 flex flex-col items-center mx-auto lg:mx-0">';
    html += '        <img src="assets/divulgacao/brasao-museu.jpg" alt="Brasão oficial do Museu do Médio São Francisco · Bom Jesus da Lapa, Bahia" class="w-44 h-44 sm:w-56 sm:h-56 rounded-full object-cover border-4 border-[#c9a65b] shadow-2xl" />';
    html += '        <span class="mt-2 text-[11px] text-[#c9a65b] font-semibold text-center">Brasão Institucional do Museu<br/><em class="text-[10px] opacity-80">(Arte digital conceitual — Regra 3.4)</em></span>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // Key Metrics Strip
    html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">';
    html += '  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">';
    (ap.metricasChave || []).forEach(function (m) {
      html += '<div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-4 shadow-sm">';
      html += '  <div class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53]">' + esc(m.valor) + '</div>';
      html += '  <div class="text-xs font-bold uppercase tracking-wider text-[#a86f25] mt-1">' + esc(m.rotulo) + '</div>';
      html += '  <p class="text-xs text-[#5a5248] mt-1">' + esc(m.detalhe) + '</p>';
      html += '</div>';
    });
    html += '  </div>';
    html += '</div>';

    // Section: Três Públicos (Regra 1) + Por que em Bom Jesus da Lapa
    html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">';
    html += '  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">';
    html += '    <div class="lg:col-span-1 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-6">';
    html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Território e Vocação</span>';
    html += '      <h2 class="font-serif-museu text-2xl font-bold text-[#1d3b53] mt-1">Por que em Bom Jesus da Lapa?</h2>';
    html += '      <p class="text-sm text-[#2b2620] mt-3 leading-relaxed">' + esc(ap.porQueNaLapa) + '</p>';
    html += '      <p class="text-sm text-[#2b2620] mt-3 leading-relaxed">' + esc(ap.referenciaModelo) + '</p>';
    html += '    </div>';

    html += '    <div class="lg:col-span-2 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-6">';
    html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Acesso para Três Públicos (Regra 1)</span>';
    html += '      <h2 class="font-serif-museu text-2xl font-bold text-[#1d3b53] mt-1">Para quem este site e o museu foram feitos</h2>';
    html += '      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">';
    html += '        <div class="p-4 rounded bg-[#f3ead8] border border-[#dccdb4]">';
    html += '          <h3 class="font-serif-museu font-bold text-base text-[#1d3b53]">1. Moradores e Romeiros</h3>';
    html += '          <p class="text-xs text-[#2b2620] mt-1.5 leading-relaxed">Linguagem direta e clara, sem jargão acadêmico, valorizando a fé no Bom Jesus, os remeiros, as agrovilas da Serra do Ramalho e os quilombos.</p>';
    html += '          <button type="button" onclick="navigateTo(\'participe\')" class="mt-3 text-xs font-bold text-[#a86f25] underline cursor-pointer">Conte sua história →</button>';
    html += '        </div>';
    html += '        <div class="p-4 rounded bg-[#f3ead8] border border-[#dccdb4]">';
    html += '          <h3 class="font-serif-museu font-bold text-base text-[#1d3b53]">2. Professores e Estudantes</h3>';
    html += '          <p class="text-xs text-[#2b2620] mt-1.5 leading-relaxed">Cada uma das 19 salas traz perguntas prontas para debate em sala de aula, quadros comparativos e linha do tempo para as escolas da região.</p>';
    html += '          <button type="button" onclick="navigateTo(\'salas\')" class="mt-3 text-xs font-bold text-[#a86f25] underline cursor-pointer">Ver roteiro das 19 salas →</button>';
    html += '        </div>';
    html += '        <div class="p-4 rounded bg-[#f3ead8] border border-[#dccdb4]">';
    html += '          <h3 class="font-serif-museu font-bold text-base text-[#1d3b53]">3. Pesquisadores</h3>';
    html += '          <p class="text-xs text-[#2b2620] mt-1.5 leading-relaxed">Nenhum fato sem fonte: indicação exata de página, citação com grafia de época, selo de verificação, licença e localização física do original.</p>';
    html += '          <button type="button" onclick="navigateTo(\'pesquisa\')" class="mt-3 text-xs font-bold text-[#a86f25] underline cursor-pointer">Bibliografia e originais →</button>';
    html += '        </div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // Section: Os 6 Núcleos e as 19 Salas (Visão Geral Rápida)
    html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">';
    html += '  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#dccdb4] pb-4">';
    html += '    <div>';
    html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Percurso Museológico</span>';
    html += '      <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53]">Os 6 Núcleos e as 19 Salas Temáticas</h2>';
    html += '    </div>';
    html += '    <button type="button" onclick="navigateTo(\'salas\')" class="text-sm font-bold text-[#a86f25] hover:underline cursor-pointer">Abrir todas as 19 salas detalhadas →</button>';
    html += '  </div>';
    html += '  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">';
    NUCLEOS.forEach(function (n) {
      html += '<div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-5 flex flex-col justify-between">';
      html += '  <div>';
      html += '    <div class="flex items-center justify-between text-xs font-bold text-[#a86f25]">';
      html += '      <span>NÚCLEO ' + esc(n.romano) + '</span>';
      html += '      <span class="text-[#5a5248]">' + esc(n.tempo) + '</span>';
      html += '    </div>';
      html += '    <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-1">' + esc(n.titulo) + '</h3>';
      html += '    <p class="text-xs text-[#5a5248] mt-1.5">' + esc(n.resumo) + '</p>';
      html += '    <ul class="mt-3 space-y-1.5 border-t border-[#dccdb4] pt-3">';
      (n.eixos || []).forEach(function (e) {
        html += '      <li>';
        html += '        <button type="button" onclick="openSala(' + e.numero + ')" class="text-left text-xs text-[#1d3b53] hover:text-[#a86f25] font-medium hover:underline cursor-pointer">';
        html += '          <strong>Sala ' + e.numero + '.</strong> ' + esc(e.titulo);
        html += '        </button>';
        html += '      </li>';
      });
      html += '    </ul>';
      html += '  </div>';
      html += '</div>';
    });
    html += '  </div>';
    html += '</div>';

    // Section: Destaque — As 5 Fotografias de Adolpho Lutz e Astrogildo Machado (8 de maio de 1912)
    html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">';
    html += '  <div class="surface-card bg-[#1d3b53] text-[#f3ead8] rounded-xl p-6 sm:p-8 border border-[#c9a65b]">';
    html += '    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">';
    html += '      <div>';
    html += '        <span class="inline-block px-2.5 py-0.5 rounded bg-[#a86f25] text-white text-xs font-bold uppercase tracking-wider">Novo no Acervo · Domínio Público (Fiocruz)</span>';
    html += '        <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-white mt-2">Bom Jesus da Lapa em 8 de maio de 1912: as lentes de Lutz e Machado</h2>';
    html += '        <p class="text-sm text-[#f3ead8]/90 mt-2 max-w-3xl">Cinco fotografias históricas em negativo de vidro e papel tomadas pelos cientistas Adolpho Lutz e Astrogildo Machado (Instituto Oswaldo Cruz) mostram a entrada da gruta, as gameleiras na rocha, os lapiás no cume e as ruas paralelas até o rio.</p>';
    html += '      </div>';
    html += '      <div class="flex flex-wrap gap-2 shrink-0">';
    html += '        <button type="button" onclick="openTitular(\'adolpho-lutz-astrogildo-machado\')" class="px-4 py-2 rounded bg-[#c9a65b] text-[#1d3b53] font-bold text-xs hover:bg-white transition cursor-pointer">Ver Coleção Lutz &amp; Machado →</button>';
    html += '        <button type="button" onclick="openSala(9)" class="px-4 py-2 rounded border border-[#c9a65b] text-[#f3ead8] font-bold text-xs hover:bg-white/10 transition cursor-pointer">Ir para a Sala 9 (Saúde)</button>';
    html += '      </div>';
    html += '    </div>';
    html += '    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">';
    ["item-24", "item-25", "item-26", "item-27", "item-28"].forEach(function (id) {
      var it = (EXTRAS.acervo || []).find(function (x) { return x.id === id; });
      if (!it) return;
      html += '<button type="button" onclick="openLightboxById(\'' + it.id + '\')" class="group text-left bg-[#13283a] rounded-lg overflow-hidden border border-[#c9a65b]/40 hover:border-[#c9a65b] transition cursor-pointer flex flex-col">';
      html += '  <img src="' + esc(it.arquivo) + '" alt="' + esc(it.titulo) + '" class="w-full h-36 object-cover group-hover:opacity-90 transition" loading="lazy" />';
      html += '  <div class="p-3 flex-1 flex flex-col justify-between">';
      html += '    <div class="text-xs font-bold text-white line-clamp-2">' + esc(it.titulo) + '</div>';
      html += '    <div class="text-[10px] text-[#c9a65b] mt-1.5">8 de maio de 1912 · COC/Fiocruz</div>';
      html += '  </div>';
      html += '</button>';
    });
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // Section: Impacto Econômico e Retorno para a Cidade
    html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">';
    html += '  <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-6 sm:p-8">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Desenvolvimento Regional</span>';
    html += '    <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53] mt-1">' + esc(imp.titulo) + '</h2>';
    html += '    <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(imp.resumo) + '</p>';
    html += '    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">';
    (imp.cenarios || []).forEach(function (c, idx) {
      var highlight = idx === 1 ? "border-2 border-[#a86f25] bg-[#f3ead8]" : "border border-[#dccdb4] bg-white";
      html += '<div class="rounded-lg p-5 ' + highlight + '">';
      html += '  <div class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">' + esc(c.nome) + '</div>';
      html += '  <div class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-1">' + esc(c.visitantesAno) + '</div>';
      html += '  <dl class="mt-3 space-y-1.5 text-xs">';
      html += '    <div class="flex justify-between"><dt class="text-[#5a5248]">No museu:</dt><dd class="font-semibold">' + esc(c.gastoDiretoNoMuseu) + '</dd></div>';
      html += '    <div class="flex justify-between"><dt class="text-[#5a5248]">No comércio local:</dt><dd class="font-semibold">' + esc(c.gastoForaDoMuseu) + '</dd></div>';
      html += '    <div class="flex justify-between border-t border-[#dccdb4] pt-1"><dt class="font-bold text-[#1d3b53]">Impacto Total:</dt><dd class="font-bold text-[#a86f25]">' + esc(c.impactoTotal) + '</dd></div>';
      html += '    <div class="pt-1 text-[#2b2620]"><strong>Empregos:</strong> ' + esc(c.empregos) + '</div>';
      html += '  </dl>';
      html += '</div>';
    });
    html += '    </div>';
    html += '    <div class="mt-5 p-4 rounded bg-[#f3ead8] border-l-4 border-[#1d3b53] text-xs sm:text-sm text-[#2b2620]">';
    html += '      <strong>Efeito retenção da romaria (+1 dia na cidade):</strong> ' + esc(imp.efeitoPernoite);
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // Section: Arquitetura (3.750 m² / cota 625 cm) & Programa Socioambiental / Clube de Espeleologia
    html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">';
    html += '  <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-6">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Partido Arquitetônico (~3.750 m²)</span>';
    html += '    <h2 class="font-serif-museu text-2xl font-bold text-[#1d3b53] mt-1">Arquitetura Bioclimática sobre Pilotis</h2>';
    html += '    <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(arq.conceito) + '</p>';
    html += '    <p class="text-xs text-[#5a5248] mt-2 leading-relaxed">' + esc(arq.clima) + '</p>';
    html += '    <h3 class="font-serif-museu font-bold text-base text-[#1d3b53] mt-4">Programa de Áreas</h3>';
    html += '    <div class="mt-2 divide-y divide-[#dccdb4] text-xs">';
    (arq.programaAreas || []).forEach(function (row) {
      html += '      <div class="py-1.5 flex justify-between gap-2"><span>' + esc(row[0]) + '</span><strong class="text-[#1d3b53]">' + esc(row[1]) + '</strong></div>';
    });
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-6">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Ação Viva no Território</span>';
    html += '    <h2 class="font-serif-museu text-2xl font-bold text-[#1d3b53] mt-1">Programa Socioambiental &amp; Clube de Espeleologia</h2>';
    html += '    <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(soc.introducao) + '</p>';
    html += '    <div class="mt-4 space-y-2.5">';
    (soc.frentes || []).forEach(function (f) {
      html += '      <div class="p-3 rounded bg-[#f3ead8] text-xs">';
      html += '        <strong class="text-[#1d3b53]">' + esc(f[0]) + ':</strong> ' + esc(f[1]);
      html += '      </div>';
    });
    html += '    </div>';
    if (soc.clubeEspeleologia) {
      var ce = soc.clubeEspeleologia;
      html += '    <div class="mt-5 rounded-lg border border-[#a86f25] bg-white overflow-hidden shadow-xs">';
      if (ce.imagem) {
        html += '      <div class="relative bg-[#13283a]">';
        html += '        <img src="' + esc(ce.imagem) + '" alt="' + esc(ce.legendaImagem || ce.titulo) + '" class="w-full h-56 sm:h-64 object-cover object-center" loading="lazy" />';
        html += '        <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-4 text-white">';
        html += '          <span class="text-[10px] uppercase font-bold tracking-widest text-[#c9a65b]">Pesquisa de Campo &amp; Proteção de Grutas</span>';
        html += '          <h3 class="font-serif-museu font-bold text-lg sm:text-xl text-[#f3ead8] leading-tight">' + esc(ce.titulo) + '</h3>';
        html += '        </div>';
        html += '      </div>';
        if (ce.legendaImagem) {
          html += '      <div class="px-4 py-2 bg-[#f3ead8] text-[11px] text-[#5a5248] border-b border-[#dccdb4] leading-snug flex flex-col gap-0.5">';
          html += '        <span>' + esc(ce.legendaImagem) + '</span>';
          if (ce.avisoIA) {
            html += '        <span class="text-[10px] text-[#a86f25] italic">' + esc(ce.avisoIA) + '</span>';
          }
          html += '      </div>';
        }
      } else {
        html += '      <div class="p-4 border-b border-[#dccdb4]"><h3 class="font-serif-museu font-bold text-base text-[#1d3b53]">' + esc(ce.titulo) + '</h3></div>';
      }
      html += '      <div class="p-4">';
      html += '        <p class="text-xs text-[#2b2620] leading-relaxed">' + esc(ce.descricao) + '</p>';
      if (ce.acoes && ce.acoes.length) {
        html += '        <div class="mt-3 pt-3 border-t border-[#dccdb4]/60">';
        html += '          <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#1d3b53] mb-1.5">Linhas de Ação e Parcerias:</h4>';
        html += '          <ul class="text-xs text-[#5a5248] space-y-1 list-disc list-inside">';
        ce.acoes.forEach(function (ac) {
          html += '            <li>' + esc(ac) + '</li>';
        });
        html += '          </ul>';
        html += '        </div>';
      }
      html += '      </div>';
      html += '    </div>';
    }
    html += '  </div>';
    html += '</div>';

    // Section: Equipe, Parceiros e Materiais de Mobilização (Como Apoiar)
    html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">';
    html += '  <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-6 sm:p-8">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Governança, Mantenedoras e Mobilização</span>';
    html += '    <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53] mt-1">Articulação Institucional e Como Apoiar</h2>';
    html += '    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">';
    (EXTRAS.chamadaParceiros || []).forEach(function (p) {
      html += '<div class="p-4 rounded bg-[#f3ead8] border border-[#dccdb4]">';
      html += '  <div class="text-2xl">' + p.icone + '</div>';
      html += '  <h3 class="font-serif-museu font-bold text-base text-[#1d3b53] mt-2">' + esc(p.parceiro) + '</h3>';
      html += '  <p class="text-xs text-[#2b2620] mt-1.5 leading-relaxed">' + esc(p.papel) + '</p>';
      html += '</div>';
    });
    html += '    </div>';

    // Documentos e Panfletos
    html += '    <div class="mt-8 pt-6 border-t border-[#dccdb4] grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">';
    html += '      <div class="lg:col-span-1">';
    html += '        <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53]">Documentos Oficiais e Folheto Popular</h3>';
    html += '        <p class="text-xs text-[#2b2620] mt-2 leading-relaxed">Baixe o Projeto Conceitual revisado (56 páginas) e o caderno de Cartas Institucionais (18 páginas) para apresentação à Prefeitura, Santuário, universidades e órgãos de fomento.</p>';
    html += '        <div class="mt-4 flex flex-col gap-2">';
    html += '          <a href="Museu_do_Rio_Sao_Francisco_Projeto_Conceitual.pdf" target="_blank" class="px-4 py-2.5 rounded bg-[#1d3b53] text-white text-xs font-bold text-center hover:bg-[#a86f25] transition">📄 Baixar Projeto Conceitual Revisado (56 p. PDF)</a>';
    html += '          <a href="Cartas_Institucionais_Museu_Medio_Sao_Francisco.pdf" target="_blank" class="px-4 py-2.5 rounded bg-[#a86f25] text-white text-xs font-bold text-center hover:bg-[#835418] transition">✉️ Baixar Cartas Institucionais (18 p. PDF)</a>';
    html += '        </div>';
    html += '      </div>';
    html += '      <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">';
    html += '        <figure class="bg-white p-3 rounded border border-[#dccdb4]">';
    html += '          <img src="assets/divulgacao/panfleto-frente-xilogravura.png" alt="Frente do panfleto de mobilização do Museu do Médio São Francisco em estilo de xilogravura" class="w-full h-56 object-contain rounded" loading="lazy" />';
    html += '          <figcaption class="text-[11px] text-[#5a5248] mt-2"><strong>Material de divulgação (frente):</strong> Folheto popular em estilo xilogravura. <em>Aviso (Regra 3.4): Arte gráfica digital de divulgação; não é registro histórico original nem integra o acervo.</em></figcaption>';
    html += '        </figure>';
    html += '        <figure class="bg-white p-3 rounded border border-[#dccdb4]">';
    html += '          <img src="assets/divulgacao/panfleto-verso-xilogravura.png" alt="Verso do panfleto de mobilização apresentando os núcleos e benefícios do museu" class="w-full h-56 object-contain rounded" loading="lazy" />';
    html += '          <figcaption class="text-[11px] text-[#5a5248] mt-2"><strong>Material de divulgação (verso):</strong> Resumo das salas e chamada comunitária. <em>Aviso (Regra 3.4): Arte gráfica digital de divulgação; não é registro original.</em></figcaption>';
    html += '        </figure>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    el.innerHTML = html;
  }

  // ========================================================================
  // View 2: SALAS TEMÁTICAS (1 a 19) — Regra 5 e 7
  // ========================================================================
  function renderViewSalas() {
    var el = document.getElementById("view-salas");
    if (!el) return;

    var html = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">';
    html += '  <div class="border-b border-[#dccdb4] pb-5">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Exposição de Longa Duração · 6 Núcleos · 19 Salas</span>';
    html += '    <h1 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">Salas Temáticas do Museu (Salas 1 a 19)</h1>';
    html += '    <p class="text-sm text-[#5a5248] mt-2 max-w-3xl">Cada sala apresenta a síntese curatorial, os blocos de pesquisa histórica e científica, quadros documentais, itens do acervo em domínio público, projeção conceitual da instalação e <strong>perguntas para uso em sala de aula</strong>.</p>';

    // Filter by Nucleo
    html += '    <div class="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por núcleo">';
    var nucButtons = [{ id: "todos", label: "Todos os 6 Núcleos (19 Salas)" }];
    NUCLEOS.forEach(function (n) {
      nucButtons.push({ id: n.romano, label: "Núcleo " + n.romano + ": " + n.titulo });
    });
    nucButtons.forEach(function (b) {
      var active = (STATE.selectedNucleo === b.id && STATE.selectedSalaNum === 0) ? "bg-[#1d3b53] text-white" : "bg-[#faf6ee] text-[#2b2620] border border-[#dccdb4] hover:border-[#a86f25]";
      html += '<button type="button" onclick="filterSalasByNucleo(\'' + b.id + '\')" class="px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ' + active + '">' + esc(b.label) + '</button>';
    });
    html += '    </div>';

    // Quick numbered selector 1..19
    html += '    <div class="mt-3 flex flex-wrap items-center gap-1.5">';
    html += '      <span class="text-xs font-bold text-[#5a5248] mr-1">Ir direto à Sala:</span>';
    SALAS.forEach(function (s) {
      var active = STATE.selectedSalaNum === s.numero ? "bg-[#a86f25] text-white font-bold" : "bg-white text-[#1d3b53] border border-[#dccdb4] hover:border-[#a86f25]";
      html += '<button type="button" onclick="openSala(' + s.numero + ')" class="w-8 h-8 rounded text-xs transition cursor-pointer ' + active + '" title="Sala ' + s.numero + ': ' + esc(s.titulo) + '">' + s.numero + '</button>';
    });
    if (STATE.selectedSalaNum !== 0) {
      html += '<button type="button" onclick="filterSalasByNucleo(\'todos\')" class="ml-2 text-xs text-[#a86f25] underline font-semibold cursor-pointer">Mostrar todas as 19 salas</button>';
    }
    html += '    </div>';
    html += '  </div>';

    // Filtered rooms
    var salasToRender = SALAS.filter(function (s) {
      if (STATE.selectedSalaNum !== 0) return s.numero === STATE.selectedSalaNum;
      if (STATE.selectedNucleo !== "todos") return s.nucleoRomano === STATE.selectedNucleo;
      return true;
    });

    html += '  <div class="space-y-8 mt-8">';
    salasToRender.forEach(function (sala) {
      html += '<article id="sala-card-' + sala.numero + '" class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-6 sm:p-8 shadow-xs">';
      // Header
      html += '  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#dccdb4] pb-4">';
      html += '    <div class="flex flex-wrap items-center gap-2">';
      html += '      <span class="px-3 py-1 rounded bg-[#1d3b53] text-white font-serif-museu font-bold text-sm">Sala ' + sala.numero + '</span>';
      html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Núcleo ' + esc(sala.nucleoRomano) + ' · ' + esc(sala.nucleoTitulo) + '</span>';
      html += '    </div>';
      html += '    <div>' + renderVerificationBadge(sala.verificacao || "verificado") + '</div>';
      html += '  </div>';

      html += '  <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53] mt-4">' + esc(sala.titulo) + '</h2>';
      if (sala.capa && sala.capa.arquivo) {
        html += '  <figure class="mt-4 bg-white rounded-xl overflow-hidden border-2 border-[#c9a65b] shadow-sm">';
        html += '    <img src="' + esc(sala.capa.arquivo) + '" alt="' + esc(sala.capa.legenda || sala.titulo) + '" class="w-full max-h-[480px] object-cover" loading="lazy" />';
        html += '    <figcaption class="p-3.5 bg-[#faf6ee] border-t border-[#dccdb4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">';
        html += '      <span class="text-xs text-[#2b2620]"><strong>Capa da Sala ' + sala.numero + ':</strong> ' + esc(sala.capa.legenda) + '</span>';
        if (sala.capa.avisoIA) {
          html += '      <span class="px-2.5 py-1 rounded bg-[#fbe6e3] text-[#8c2619] border border-[#ebbab3] text-[11px] font-semibold shrink-0">⚠ ' + esc(sala.capa.avisoIA) + '</span>';
        }
        html += '    </figcaption>';
        html += '  </figure>';
      }
      html += '  <p class="font-serif-museu text-base sm:text-lg text-[#2b2620] mt-3 leading-relaxed bg-[#f3ead8] p-4 rounded-lg border-l-4 border-[#a86f25]">' + esc(sala.sintese) + '</p>';

      // Curatorial Blocks
      if (sala.blocos && sala.blocos.length > 0) {
        html += '  <div class="mt-6 space-y-4">';
        sala.blocos.forEach(function (b) {
          if (b.tipoCard === "guimaraes-rosa") {
            html += '    <div class="bg-white p-5 rounded-lg border border-[#dccdb4] flex flex-col md:flex-row gap-5 items-start">';
            html += '      <div class="w-full md:w-44 shrink-0 flex flex-col items-center">';
            if (b.retrato && b.retrato.exibir_imagem) {
              html += '        <img src="' + esc(b.retrato.arquivo) + '" alt="' + esc(b.retrato.alt || b.subtitulo) + '" class="w-full h-52 object-cover rounded-lg border border-[#c9a65b] shadow-xs" loading="lazy" />';
            } else {
              html += '        <div class="w-full h-52 bg-[#f8f5ee] border-2 border-dashed border-[#c9a65b] rounded-lg flex flex-col items-center justify-center p-3 text-center">';
              html += '          <span class="text-3xl mb-1.5 opacity-60">👤</span>';
              html += '          <span class="text-xs font-bold text-[#1d3b53]">' + esc((b.retrato && b.retrato.legenda) || "Retrato a confirmar") + '</span>';
              html += '          <span class="text-[10px] text-[#8c2619] font-medium mt-1">Direitos sob verificação<br/>(Regra 3.4 do AGENTS.md)</span>';
              html += '        </div>';
            }
            html += '        <span class="text-[11px] text-[#5a5248] text-center mt-1.5 font-medium">João Guimarães Rosa<br/><span class="text-[10px] text-[#a86f25]">(1908–1967)</span></span>';
            html += '      </div>';
            html += '      <div class="flex-1">';
            html += '        <div class="flex flex-wrap items-center gap-2">';
            html += '          <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Literatura e Travessia</span>';
            html += '          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f3ead8] text-[#1d3b53] border border-[#dccdb4]">' + esc(b.ano || "1956") + '</span>';
            html += '        </div>';
            html += '        <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-1">' + esc(b.subtitulo) + '</h3>';
            html += '        <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(b.texto) + '</p>';
            if (b.citacaoCurta) {
              html += '        <blockquote class="mt-3.5 p-3 rounded bg-[#f3ead8] border-l-4 border-[#a86f25] text-xs font-medium text-[#2b2620] italic">' + esc(b.citacaoCurta) + '</blockquote>';
            }
            html += '      </div>';
            html += '    </div>';
          } else if (b.tipoCard === "comparativo-neco" && b.comparativo) {
            var comp = b.comparativo;
            html += '    <div class="bg-white p-5 rounded-lg border border-[#dccdb4]">';
            html += '      <div class="flex flex-wrap items-center justify-between gap-2">';
            html += '        <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53]">' + esc(b.subtitulo) + '</h3>';
            html += '        <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fff3cd] text-[#856404] border border-[#ffeeba]">Passagens a confirmar</span>';
            html += '      </div>';
            html += '      <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(b.texto) + '</p>';
            html += '      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#dccdb4]">';
            if (comp.theodoro) {
              html += '        <div class="flex items-start gap-3 p-3 bg-[#f8f5ee] rounded-lg border border-[#dccdb4]">';
              if (comp.theodoro.imagem) {
                html += '          <img src="' + esc(comp.theodoro.imagem) + '" alt="' + esc(comp.theodoro.nome) + '" class="w-16 h-20 object-cover rounded border border-[#c9a65b] shrink-0" loading="lazy" />';
              }
              html += '          <div class="text-xs flex-1">';
              html += '            <strong class="text-[#1d3b53] block text-sm">' + esc(comp.theodoro.nome) + '</strong>';
              html += '            <span class="block text-[11px] text-[#a86f25] font-semibold mt-0.5">' + esc(comp.theodoro.papel) + '</span>';
              html += '            <p class="text-[11px] text-[#5a5248] mt-1.5 leading-snug">' + esc(comp.theodoro.citacao) + '</p>';
              html += '            <span class="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-[#fff3cd] text-[#856404] font-medium border border-[#ffeeba]">a-confirmar no original</span>';
              html += '          </div>';
              html += '        </div>';
            }
            if (comp.robaldo) {
              html += '        <div class="flex items-start gap-3 p-3 bg-[#f8f5ee] rounded-lg border border-[#dccdb4]">';
              html += '          <div class="w-16 h-20 bg-[#f3ead8] border-2 border-dashed border-[#c9a65b] rounded flex flex-col items-center justify-center p-1 text-center shrink-0">';
              html += '            <span class="text-lg opacity-60">👤</span>';
              html += '            <span class="text-[8px] font-bold text-[#1d3b53] leading-none mt-1">Retrato a confirmar</span>';
              html += '          </div>';
              html += '          <div class="text-xs flex-1">';
              html += '            <strong class="text-[#1d3b53] block text-sm">' + esc(comp.robaldo.nome) + '</strong>';
              html += '            <span class="block text-[11px] text-[#a86f25] font-semibold mt-0.5">' + esc(comp.robaldo.papel) + '</span>';
              html += '            <p class="text-[11px] text-[#5a5248] mt-1.5 leading-snug">' + esc(comp.robaldo.citacao) + '</p>';
              html += '            <span class="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-[#fff3cd] text-[#856404] font-medium border border-[#ffeeba]">a-confirmar no original</span>';
              html += '          </div>';
              html += '        </div>';
            }
            html += '      </div>';
            html += '    </div>';
          } else {
            html += '    <div class="bg-white p-5 rounded-lg border border-[#dccdb4]">';
            html += '      <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53]">' + esc(b.subtitulo) + '</h3>';
            html += '      <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(b.texto) + '</p>';
            html += '    </div>';
          }
        });
        html += '  </div>';
      }

      // Tables
      if (sala.tabelas && sala.tabelas.length > 0) {
        sala.tabelas.forEach(function (tb) {
          html += '  <div class="mt-6 overflow-x-auto">';
          html += '    <h3 class="font-serif-museu text-base font-bold text-[#1d3b53] mb-2">' + esc(tb.titulo) + '</h3>';
          html += '    <table class="w-full text-left border-collapse text-xs bg-white rounded-lg overflow-hidden border border-[#dccdb4]">';
          html += '      <thead><tr class="bg-[#1d3b53] text-white">';
          (tb.colunas || []).forEach(function (c) {
            html += '<th class="p-3 font-semibold">' + esc(c) + '</th>';
          });
          html += '      </tr></thead><tbody class="divide-y divide-[#dccdb4]">';
          (tb.linhas || []).forEach(function (row) {
            html += '<tr class="hover:bg-[#f3ead8]/50">';
            row.forEach(function (cell, ci) {
              html += '<td class="p-3 align-top ' + (ci === 0 ? "font-semibold text-[#1d3b53]" : "text-[#2b2620]") + '">' + esc(cell) + '</td>';
            });
            html += '</tr>';
          });
          html += '      </tbody></table>';
          html += '  </div>';
        });
      }

      // Key Proposals & Expography
      if (sala.propostasSala && sala.propostasSala.length > 0) {
        html += '  <div class="mt-6">';
        html += '    <h3 class="font-serif-museu text-base font-bold text-[#1d3b53]">O que haverá na sala (Expografia e Itens-Chave)</h3>';
        html += '    <ul class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#2b2620]">';
        sala.propostasSala.forEach(function (p) {
          html += '      <li class="p-3 rounded bg-white border border-[#dccdb4] flex items-start gap-2"><span class="text-[#a86f25] font-bold">▪</span><span>' + esc(p) + '</span></li>';
        });
        html += '    </ul>';
        html += '  </div>';
      }

      // Filmography & Video References in this Sala (e.g., Sala 9 Noel Nutels, Sala 10 Romaria, Sala 17 Serra do Ramalho / Sobradinho)
      if (sala.videos && sala.videos.length > 0) {
        html += renderVideoReferences(sala.videos, "🎬 Filmografia e Registros em Vídeo da Sala " + sala.numero);
      }

      // Historical Images from the Collection linked to this Sala
      var salaItems = (EXTRAS.acervo || []).filter(function (it) {
        return it.sala === sala.numero && it.exibir_imagem;
      });
      if (salaItems.length > 0) {
        html += '  <div class="mt-6 pt-5 border-t border-[#dccdb4]">';
        html += '    <h3 class="font-serif-museu text-base font-bold text-[#1d3b53]">Obras e Registros Históricos do Acervo nesta Sala</h3>';
        html += '    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">';
        salaItems.forEach(function (it) {
          html += '      <figure class="bg-white rounded-lg overflow-hidden border border-[#dccdb4] flex flex-col justify-between">';
          html += '        <button type="button" onclick="openLightboxById(\'' + it.id + '\')" class="block text-left group cursor-pointer">';
          html += '          <img src="' + esc(it.arquivo) + '" alt="' + esc(it.titulo) + '" class="w-full h-44 object-cover group-hover:opacity-90 transition" loading="lazy" />';
          html += '          <div class="p-3">';
          html += '            <div class="text-xs font-bold text-[#1d3b53] group-hover:text-[#a86f25]">' + esc(it.titulo) + ' (' + esc(it.ano) + ')</div>';
          html += '            <p class="text-[11px] text-[#5a5248] mt-1 line-clamp-2">' + esc(it.descricao) + '</p>';
          if (it.avisoIA) {
            html += '            <div class="mt-2 px-2 py-1 rounded bg-[#fbe6e3] text-[#8c2619] border border-[#ebbab3] text-[10px] font-semibold">⚠ ' + esc(it.avisoIA) + '</div>';
          }
          html += '          </div>';
          html += '        </button>';
          html += '        <figcaption class="px-3 pb-3 pt-2 border-t border-[#dccdb4] text-[10px] text-[#5a5248]"><strong>Crédito:</strong> ' + esc(it.credito) + '</figcaption>';
          html += '      </figure>';
        });
        html += '    </div>';
        html += '  </div>';
      }

      // Conceptual Installation Renderings (with mandatory Rule 3.4 AI disclaimer)
      if (sala.instalacoes && sala.instalacoes.length > 0) {
        html += '  <div class="mt-6 pt-5 border-t border-[#dccdb4]">';
        html += '    <h3 class="font-serif-museu text-base font-bold text-[#1d3b53]">Projeção Conceitual da Instalação Museográfica</h3>';
        html += '    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">';
        sala.instalacoes.forEach(function (inst) {
          html += '      <figure class="bg-white rounded-lg overflow-hidden border border-[#dccdb4] p-3">';
          html += '        <img src="' + esc(inst.arquivo) + '" alt="' + esc(inst.legenda) + '" class="w-full h-56 object-cover rounded" loading="lazy" />';
          html += '        <figcaption class="mt-2 text-xs text-[#2b2620]">' + esc(inst.legenda) + '</figcaption>';
          html += '        <div class="mt-2 px-2.5 py-1.5 rounded bg-[#fbe6e3] text-[#8c2619] border border-[#ebbab3] text-[11px] font-semibold">';
          html += '          ⚠ Aviso (Regra 3.4): ' + esc(inst.avisoIA) + ' (maquete conceitual de divulgação; não integra o acervo histórico).';
          html += '        </div>';
          html += '      </figure>';
        });
        html += '    </div>';
        html += '  </div>';
      }

      // Classroom Questions for Teachers & Students (Rule 1 & Rule 5)
      if (sala.perguntasEscola && sala.perguntasEscola.length > 0) {
        html += '  <div class="mt-6 p-5 rounded-lg bg-[#f3ead8] border border-[#c9a65b]">';
        html += '    <div class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Material Pedagógico · Professores e Estudantes (Regra 5)</div>';
        html += '    <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53] mt-0.5">Perguntas para trabalhar em sala de aula</h3>';
        html += '    <ol class="mt-2 space-y-1.5 list-decimal list-inside text-xs sm:text-sm text-[#2b2620]">';
        sala.perguntasEscola.forEach(function (q) {
          html += '      <li>' + esc(q) + '</li>';
        });
        html += '    </ol>';
        html += '  </div>';
      }

      html += '</article>';
    });
    html += '  </div>';
    html += '</div>';

    el.innerHTML = html;
  }

  // ========================================================================
  // Gallery Renderer (3 Modes: Lista | Cards | Blocos — Rule 5.3)
  // ========================================================================
  function renderItemsGallery(itemsList) {
    if (!itemsList || itemsList.length === 0) {
      return '<div class="p-8 text-center bg-white rounded-lg border border-[#dccdb4] text-sm text-[#5a5248]">Nenhum item encontrado para os filtros selecionados.</div>';
    }

    var mode = STATE.galleryViewMode || "cards";
    var html = '';

    if (mode === "lista") {
      html += '<div class="divide-y divide-[#dccdb4] bg-white rounded-lg border border-[#dccdb4] overflow-hidden">';
      itemsList.forEach(function (it) {
        html += '<div class="p-4 hover:bg-[#f3ead8]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">';
        html += '  <div class="flex items-start gap-3">';
        if (it.exibir_imagem && it.arquivo) {
          html += '    <img src="' + esc(it.arquivo) + '" alt="' + esc(it.titulo) + '" class="w-20 h-16 object-cover rounded shrink-0 border border-[#dccdb4]" loading="lazy" />';
        } else {
          html += '    <div class="w-20 h-16 rounded bg-[#f3ead8] border border-[#c9a65b] flex items-center justify-center text-[10px] font-bold text-[#1d3b53] text-center p-1 shrink-0">Acervo Externo</div>';
        }
        html += '    <div>';
        html += '      <div class="flex flex-wrap items-center gap-1.5">' + renderVerificationBadge(it.verificacao) + renderLicenseBadge(it.licenca, it.exibir_imagem) + '</div>';
        html += '      <h4 class="font-serif-museu font-bold text-base text-[#1d3b53] mt-1">' + esc(it.titulo) + '</h4>';
        html += '      <p class="text-xs text-[#a86f25] font-semibold">' + esc(it.titularNome) + ' · ' + esc(it.ano) + ' · Sala ' + it.sala + '</p>';
        html += '      <p class="text-xs text-[#2b2620] mt-1">' + esc(it.descricao) + '</p>';
        if (it.avisoIA) {
          html += '      <div class="mt-1.5 px-2.5 py-1 rounded bg-[#fbe6e3] text-[#8c2619] border border-[#ebbab3] text-[11px] font-semibold">⚠ ' + esc(it.avisoIA) + '</div>';
        }
        html += '      <p class="text-[11px] text-[#5a5248] mt-1"><strong>Crédito:</strong> ' + esc(it.credito) + '</p>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="shrink-0">';
        html += '    <button type="button" onclick="openLightboxById(\'' + it.id + '\')" class="px-3 py-1.5 rounded bg-[#1d3b53] text-white text-xs font-semibold hover:bg-[#a86f25] transition cursor-pointer">Ficha completa</button>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
      return html;
    }

    if (mode === "blocos") {
      html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
      itemsList.forEach(function (it) {
        html += '<article class="bg-white rounded-xl overflow-hidden border border-[#dccdb4] shadow-xs flex flex-col justify-between">';
        html += '  <div>';
        if (it.exibir_imagem && it.arquivo) {
          html += '    <button type="button" onclick="openLightboxById(\'' + it.id + '\')" class="block w-full text-left cursor-pointer group">';
          html += '      <img src="' + esc(it.arquivo) + '" alt="' + esc(it.titulo) + '" class="w-full h-72 object-cover group-hover:opacity-95 transition" loading="lazy" />';
          html += '    </button>';
        } else {
          html += '    <div class="p-6 bg-[#f3ead8] border-b border-[#dccdb4]">';
          html += '      <div class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Obra sob gestão de terceiros (Regra 3.4)</div>';
          html += '      <p class="text-xs text-[#2b2620] mt-1">Em respeito estrito aos direitos autorais, a imagem não é hospedada neste site. Consulte a ficha técnica e o link para o acervo original abaixo.</p>';
          html += '    </div>';
        }
        html += '    <div class="p-5">';
        html += '      <div class="flex flex-wrap items-center gap-1.5">' + renderVerificationBadge(it.verificacao) + renderLicenseBadge(it.licenca, it.exibir_imagem) + '</div>';
        html += '      <h4 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-2">' + esc(it.titulo) + '</h4>';
        html += '      <p class="text-xs font-bold text-[#a86f25] mt-0.5">' + esc(it.titularNome) + ' · ' + esc(it.ano) + ' · ' + esc(it.local) + '</p>';
        html += '      <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(it.descricao) + '</p>';
        if (it.avisoIA) {
          html += '      <div class="mt-2.5 px-3 py-1.5 rounded bg-[#fbe6e3] text-[#8c2619] border border-[#ebbab3] text-xs font-semibold">⚠ ' + esc(it.avisoIA) + '</div>';
        }
        if (it.citacaoOriginal) {
          html += '      <blockquote class="mt-3 p-3 rounded bg-[#f3ead8] border-l-4 border-[#a86f25] text-xs italic">' + esc(it.citacaoOriginal) + '</blockquote>';
        }
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="px-5 py-3 bg-[#faf6ee] border-t border-[#dccdb4] flex items-center justify-between gap-2">';
        html += '    <span class="text-[11px] text-[#5a5248] truncate"><strong>Crédito:</strong> ' + esc(it.credito) + '</span>';
        html += '    <button type="button" onclick="openLightboxById(\'' + it.id + '\')" class="px-3 py-1 rounded bg-[#1d3b53] text-white text-xs font-semibold shrink-0 hover:bg-[#a86f25] cursor-pointer">Ampliar / Citar</button>';
        html += '  </div>';
        html += '</article>';
      });
      html += '</div>';
      return html;
    }

    // Default: "cards"
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">';
    itemsList.forEach(function (it) {
      html += '<article class="bg-white rounded-lg overflow-hidden border border-[#dccdb4] shadow-2xs flex flex-col justify-between">';
      html += '  <div>';
      if (it.exibir_imagem && it.arquivo) {
        html += '    <button type="button" onclick="openLightboxById(\'' + it.id + '\')" class="block w-full text-left cursor-pointer group">';
        html += '      <img src="' + esc(it.arquivo) + '" alt="' + esc(it.titulo) + '" class="w-full h-48 object-cover group-hover:opacity-90 transition" loading="lazy" />';
        html += '    </button>';
      } else {
        html += '    <div class="h-48 p-4 bg-[#f3ead8] border-b border-[#dccdb4] flex flex-col justify-center">';
        html += '      <span class="text-[11px] font-bold uppercase tracking-wider text-[#a86f25]">Acervo de Terceiros (Regra 3.4)</span>';
        html += '      <div class="font-serif-museu font-bold text-sm text-[#1d3b53] mt-1">Imagem não hospedada sem licença escrita</div>';
        html += '      <p class="text-[11px] text-[#2b2620] mt-1">Original preservado em: ' + esc(it.original) + '</p>';
        html += '    </div>';
      }
      html += '    <div class="p-4">';
      html += '      <div class="flex flex-wrap items-center gap-1">' + renderVerificationBadge(it.verificacao) + renderLicenseBadge(it.licenca, it.exibir_imagem) + '</div>';
      html += '      <h4 class="font-serif-museu font-bold text-base text-[#1d3b53] mt-2">' + esc(it.titulo) + '</h4>';
      html += '      <p class="text-xs font-semibold text-[#a86f25] mt-0.5">' + esc(it.titularNome) + ' · ' + esc(it.ano) + '</p>';
      html += '      <p class="text-xs text-[#2b2620] mt-2 line-clamp-3">' + esc(it.descricao) + '</p>';
      if (it.avisoIA) {
        html += '      <div class="mt-2 px-2.5 py-1 rounded bg-[#fbe6e3] text-[#8c2619] border border-[#ebbab3] text-[10px] font-semibold">⚠ ' + esc(it.avisoIA) + '</div>';
      }
      html += '    </div>';
      html += '  </div>';
      html += '  <div class="p-3 bg-[#faf6ee] border-t border-[#dccdb4]">';
      html += '    <p class="text-[10px] text-[#5a5248] leading-snug"><strong>Crédito:</strong> ' + esc(it.credito) + '</p>';
      html += '    <div class="mt-2 flex items-center justify-between">';
      html += '      <button type="button" onclick="openSala(' + it.sala + ')" class="text-[11px] font-semibold text-[#1d3b53] underline cursor-pointer">Sala ' + it.sala + '</button>';
      html += '      <button type="button" onclick="openLightboxById(\'' + it.id + '\')" class="px-2.5 py-1 rounded bg-[#1d3b53] text-white text-[11px] font-semibold hover:bg-[#a86f25] cursor-pointer">Ver ficha e citação →</button>';
      html += '    </div>';
      html += '  </div>';
      html += '</article>';
    });
    html += '</div>';
    return html;
  }

  // ========================================================================
  // View 3: ACERVO & TITULARES (Modelo IMS — 6 blocos obrigatórios da Regra 5)
  // ========================================================================
  function renderViewAcervo() {
    var el = document.getElementById("view-acervo");
    if (!el) return;

    var titulares = EXTRAS.titulares || [];
    var acervo = EXTRAS.acervo || [];

    var html = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">';
    html += '  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#dccdb4] pb-5">';
    html += '    <div>';
    html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Acervo Digital e Coleções de Referência</span>';
    html += '      <h1 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">Titulares da Coleção &amp; Catálogo de Itens</h1>';
    html += '      <p class="text-sm text-[#5a5248] mt-1 max-w-3xl">Estrutura inspirada nas páginas de titular do Instituto Moreira Salles (IMS): biografia, cronologia, galeria com 3 modos de visualização (Lista, Cards, Blocos), localização dos originais e obras relacionadas.</p>';
    html += '    </div>';
    html += '    <div class="inline-flex rounded-lg border border-[#dccdb4] bg-[#faf6ee] p-1 shrink-0">';
    var tabTitClass = STATE.acervoSubTab === "titulares" ? "bg-[#1d3b53] text-white font-bold" : "text-[#2b2620] hover:bg-[#f3ead8]";
    var tabItClass = STATE.acervoSubTab === "itens" ? "bg-[#1d3b53] text-white font-bold" : "text-[#2b2620] hover:bg-[#f3ead8]";
    html += '      <button type="button" onclick="setAcervoSubTab(\'titulares\')" class="px-4 py-2 rounded-md text-xs transition cursor-pointer ' + tabTitClass + '">Páginas de Titular (' + titulares.length + ')</button>';
    html += '      <button type="button" onclick="setAcervoSubTab(\'itens\')" class="px-4 py-2 rounded-md text-xs transition cursor-pointer ' + tabItClass + '">Busca Geral de Itens (' + acervo.length + ')</button>';
    html += '    </div>';
    html += '  </div>';

    if (STATE.acervoSubTab === "titulares") {
      // Selector bar of all 10 Titulares
      html += '  <div class="mt-6">';
      html += '    <div class="text-xs font-bold uppercase tracking-wider text-[#5a5248] mb-2">Selecione um Titular da Coleção:</div>';
      html += '    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">';
      titulares.forEach(function (t) {
        var isSel = t.id === STATE.selectedTitularId;
        var cardCls = isSel ? "bg-[#1d3b53] text-white border-[#a86f25]" : "bg-[#faf6ee] text-[#2b2620] border-[#dccdb4] hover:border-[#a86f25]";
        html += '<button type="button" onclick="openTitular(\'' + t.id + '\')" class="p-3 rounded-lg border text-left transition cursor-pointer ' + cardCls + '">';
        html += '  <div class="font-serif-museu font-bold text-sm leading-snug">' + esc(t.nome) + '</div>';
        html += '  <div class="text-[11px] opacity-80 mt-0.5">' + esc(t.datas) + '</div>';
        html += '</button>';
      });
      html += '    </div>';
      html += '  </div>';

      // Render the 6 mandatory IMS blocks for the selected Titular (Rule 5)
      var titular = titulares.find(function (t) { return t.id === STATE.selectedTitularId; }) || titulares[0];
      if (titular) {
        var titularItems = acervo.filter(function (it) { return it.titularId === titular.id; });

        html += '  <div class="mt-8 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-6 sm:p-8 shadow-xs">';
        // BLOCO 1: Cabeçalho com nome, datas de vida e resumo de 2–3 linhas + “Leia mais”
        html += '    <div class="border-b border-[#dccdb4] pb-6">';
        html += '      <div class="flex flex-wrap items-center justify-between gap-2">';
        html += '        <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Bloco 1 · Titular da Coleção (Modelo IMS)</span>';
        html += '        <span class="text-xs text-[#5a5248] font-semibold">' + titularItems.length + ' item(ns) catalogado(s)</span>';
        html += '      </div>';
        html += '      <h2 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">' + esc(titular.nome) + '</h2>';
        html += '      <p class="text-sm font-bold text-[#a86f25] mt-1">' + esc(titular.datas) + ' · ' + esc(titular.papel) + '</p>';
        html += '      <p class="font-serif-museu text-base sm:text-lg text-[#2b2620] mt-3 leading-relaxed">' + esc(titular.resumoCurto) + '</p>';
        if (STATE.titularBioExpanded) {
          html += '      <div class="mt-3 p-4 rounded-lg bg-white border border-[#dccdb4] text-sm text-[#2b2620] leading-relaxed">' + esc(titular.biografiaCompleta) + '</div>';
          html += '      <button type="button" onclick="toggleTitularBio()" class="mt-2 text-xs font-bold text-[#a86f25] underline cursor-pointer">▲ Recolher biografia completa</button>';
        } else {
          html += '      <button type="button" onclick="toggleTitularBio()" class="mt-2 text-xs font-bold text-[#a86f25] underline cursor-pointer">▼ Leia mais (biografia completa)</button>';
        }
        html += '    </div>';

        // BLOCO 2: Cronologia curta (4–8 marcos)
        html += '    <div class="mt-6 border-b border-[#dccdb4] pb-6">';
        html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Bloco 2 · Cronologia do Titular</span>';
        html += '      <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-0.5">Marcos Cronológicos</h3>';
        html += '      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">';
        (titular.cronologia || []).forEach(function (c) {
          html += '        <div class="p-3.5 rounded-lg bg-white border border-[#dccdb4]">';
          html += '          <div class="text-xs font-bold text-[#a86f25]">' + esc(c.ano) + '</div>';
          html += '          <p class="text-xs text-[#2b2620] mt-1 leading-relaxed">' + esc(c.fato) + '</p>';
          html += '        </div>';
        });
        html += '      </div>';
        html += '    </div>';

        // BLOCO 3: Galeria do que o museu pode mostrar (Lista | Cards | Blocos)
        html += '    <div class="mt-6 border-b border-[#dccdb4] pb-6">';
        html += '      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">';
        html += '        <div>';
        html += '          <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Bloco 3 · Obras e Documentos do Titular</span>';
        html += '          <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53]">Galeria do que o Museu pode mostrar</h3>';
        html += '        </div>';
        html += renderViewModeSwitcher();
        html += '      </div>';
        html += renderItemsGallery(titularItems);
        html += '    </div>';

        // BLOCO 4: “Onde está o original”
        var orig = titular.ondeEstaOriginal || {};
        html += '    <div class="mt-6 border-b border-[#dccdb4] pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">';
        html += '      <div class="p-5 rounded-lg bg-[#f3ead8] border border-[#c9a65b]">';
        html += '        <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Bloco 4 · Localização Arquivística</span>';
        html += '        <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-0.5">Onde está o original</h3>';
        html += '        <dl class="mt-3 space-y-2 text-xs text-[#2b2620]">';
        html += '          <div><dt class="font-bold text-[#1d3b53]">Instituição detentora:</dt><dd>' + esc(orig.instituicao) + '</dd></div>';
        html += '          <div><dt class="font-bold text-[#1d3b53]">Fundo / Coleção:</dt><dd>' + esc(orig.colecao) + '</dd></div>';
        html += '          <div><dt class="font-bold text-[#1d3b53]">Como consultar ou pedir reprodução:</dt><dd>' + esc(orig.comoPedir) + '</dd></div>';
        if (orig.link) {
          html += '          <div class="pt-1"><a href="' + esc(orig.link) + '" target="_blank" rel="noopener" class="inline-block px-3 py-1.5 rounded bg-[#1d3b53] text-white font-semibold hover:bg-[#a86f25] transition">Acessar acervo externo ↗</a></div>';
        }
        html += '        </dl>';
        html += '      </div>';

        // BLOCO 5: Publicações e exposições relacionadas
        html += '      <div class="p-5 rounded-lg bg-white border border-[#dccdb4]">';
        html += '        <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Bloco 5 · Referências Bibliográficas</span>';
        html += '        <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-0.5">Publicações e Exposições Relacionadas</h3>';
        html += '        <ul class="mt-3 space-y-2 text-xs text-[#2b2620]">';
        (titular.publicacoesExposicoes || []).forEach(function (pub) {
          html += '          <li class="flex items-start gap-2"><span class="text-[#a86f25] font-bold">▪</span><span>' + esc(pub) + '</span></li>';
        });
        html += '        </ul>';
        html += '      </div>';
        html += '    </div>';

        if (titular.videos && titular.videos.length > 0) {
          html += renderVideoReferences(titular.videos, "🎬 Registros Cinematográficos e Documentários do Titular");
        }

        // BLOCO 6: Conteúdo relacionado (Salas e Cidades ligadas)
        html += '    <div class="mt-6">';
        html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Bloco 6 · Cruzamento Territorial e Museológico</span>';
        html += '      <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-0.5">Salas e Cidades do Rio Relacionadas</h3>';
        html += '      <div class="mt-3 flex flex-wrap gap-2">';
        (titular.salasRelacionadas || []).forEach(function (sNum) {
          var sObj = SALAS.find(function (x) { return x.numero === sNum; });
          html += '<button type="button" onclick="openSala(' + sNum + ')" class="px-3 py-1.5 rounded bg-[#1d3b53] text-white text-xs font-semibold hover:bg-[#a86f25] cursor-pointer">Sala ' + sNum + (sObj ? ": " + esc(sObj.titulo) : "") + '</button>';
        });
        (titular.cidadesRelacionadas || []).forEach(function (cId) {
          var cObj = (EXTRAS.cidades || []).find(function (x) { return x.id === cId; });
          if (cObj) {
            html += '<button type="button" onclick="openCidade(\'' + cObj.id + '\')" class="px-3 py-1.5 rounded bg-[#f3ead8] text-[#1d3b53] border border-[#c9a65b] text-xs font-semibold hover:bg-[#a86f25] hover:text-white cursor-pointer">📍 ' + esc(cObj.nome) + '</button>';
          }
        });
        html += '      </div>';
        html += '    </div>';

        html += '  </div>';
      }
    } else {
      // Sub-tab: Busca e Filtros de todos os Itens do Acervo
      var temas = [];
      acervo.forEach(function (it) {
        if (it.tema && temas.indexOf(it.tema) === -1) temas.push(it.tema);
      });

      html += '  <div class="mt-6 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-5">';
      html += '    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">';
      html += '      <div class="lg:col-span-2">';
      html += '        <label for="input-acervo-q" class="block text-xs font-bold text-[#1d3b53]">Buscar por título, autor, ano ou palavra-chave</label>';
      html += '        <input id="input-acervo-q" type="search" value="' + esc(STATE.acervoSearchQuery) + '" oninput="updateAcervoSearch(this.value)" placeholder="Ex.: 1912, Riedel, carranca, Lapa, Carinhanha..." class="mt-1 w-full px-3 py-2 rounded border border-[#dccdb4] bg-white text-sm" />';
      html += '      </div>';

      html += '      <div>';
      html += '        <label for="sel-acervo-titular" class="block text-xs font-bold text-[#1d3b53]">Titular</label>';
      html += '        <select id="sel-acervo-titular" onchange="setAcervoFilter(\'titular\', this.value)" class="mt-1 w-full px-2.5 py-2 rounded border border-[#dccdb4] bg-white text-xs">';
      html += '          <option value="todos">Todos os titulares</option>';
      titulares.forEach(function (t) {
        var sel = STATE.acervoFilterTitular === t.id ? "selected" : "";
        html += '          <option value="' + esc(t.id) + '" ' + sel + '>' + esc(t.nome) + '</option>';
      });
      html += '        </select>';
      html += '      </div>';

      html += '      <div>';
      html += '        <label for="sel-acervo-cidade" class="block text-xs font-bold text-[#1d3b53]">Cidade do Rio</label>';
      html += '        <select id="sel-acervo-cidade" onchange="setAcervoFilter(\'cidade\', this.value)" class="mt-1 w-full px-2.5 py-2 rounded border border-[#dccdb4] bg-white text-xs">';
      html += '          <option value="todas">Todas as cidades</option>';
      (EXTRAS.cidades || []).forEach(function (c) {
        var sel = STATE.acervoFilterCidade === c.id ? "selected" : "";
        html += '          <option value="' + esc(c.id) + '" ' + sel + '>' + esc(c.nome) + '</option>';
      });
      html += '        </select>';
      html += '      </div>';

      html += '      <div>';
      html += '        <label for="sel-acervo-tema" class="block text-xs font-bold text-[#1d3b53]">Tema</label>';
      html += '        <select id="sel-acervo-tema" onchange="setAcervoFilter(\'tema\', this.value)" class="mt-1 w-full px-2.5 py-2 rounded border border-[#dccdb4] bg-white text-xs">';
      html += '          <option value="todos">Todos os temas</option>';
      temas.forEach(function (tm) {
        var sel = STATE.acervoFilterTema === tm ? "selected" : "";
        html += '          <option value="' + esc(tm) + '" ' + sel + '>' + esc(tm) + '</option>';
      });
      html += '        </select>';
      html += '      </div>';
      html += '    </div>';

      var filtered = filterAcervoItems();
      html += '    <div class="mt-4 pt-4 border-t border-[#dccdb4] flex flex-wrap items-center justify-between gap-3">';
      html += '      <span class="text-xs font-semibold text-[#5a5248]">Exibindo <strong>' + filtered.length + '</strong> de ' + acervo.length + ' itens catalogados</span>';
      html += renderViewModeSwitcher();
      html += '    </div>';
      html += '  </div>';

      html += '  <div id="acervo-items-results" class="mt-6">' + renderItemsGallery(filtered) + '</div>';
    }

    html += '</div>';
    el.innerHTML = html;
  }

  function renderViewModeSwitcher() {
    var m = STATE.galleryViewMode || "cards";
    var btn = function (id, label) {
      var act = m === id ? "bg-[#1d3b53] text-white font-bold" : "bg-white text-[#2b2620] hover:bg-[#f3ead8]";
      return '<button type="button" onclick="setGalleryViewMode(\'' + id + '\')" class="px-3 py-1 text-xs transition cursor-pointer ' + act + '">' + label + '</button>';
    };
    return '<div class="inline-flex rounded border border-[#dccdb4] overflow-hidden" role="group" aria-label="Modo de visualização da galeria">' +
      btn("lista", "☰ Lista") +
      btn("cards", "⊞ Cards") +
      btn("blocos", "▣ Blocos") +
      '</div>';
  }

  function filterAcervoItems() {
    var q = (STATE.acervoSearchQuery || "").toLowerCase().trim();
    return (EXTRAS.acervo || []).filter(function (it) {
      if (STATE.acervoFilterTitular !== "todos" && it.titularId !== STATE.acervoFilterTitular) return false;
      if (STATE.acervoFilterCidade !== "todas" && it.cidadeId !== STATE.acervoFilterCidade) return false;
      if (STATE.acervoFilterTema !== "todos" && it.tema !== STATE.acervoFilterTema) return false;
      if (q) {
        var hay = [it.titulo, it.titularNome, it.ano, it.local, it.tema, it.descricao, it.credito].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  // ========================================================================
  // View 4: CIDADES DO RIO & CADERNO DO TRECHO (1852–1880)
  // ========================================================================
  function renderViewCidades() {
    var el = document.getElementById("view-cidades");
    if (!el) return;

    var cidades = EXTRAS.cidades || [];
    var cad = EXTRAS.cadernoDoTrecho || {};

    var html = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">';
    html += '  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#dccdb4] pb-5">';
    html += '    <div>';
    html += '      <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Geografia Histórica de Pirapora a Juazeiro</span>';
    html += '      <h1 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">Cidades do Rio &amp; Caderno do Trecho</h1>';
    html += '      <p class="text-sm text-[#5a5248] mt-1 max-w-3xl">Navegue pelas páginas de cada cidade do Médio São Francisco ou leia lado a lado o <strong>Caderno do Trecho: de Carinhanha a Paratinga pelos cinco viajantes (1852–1880)</strong>.</p>';
    html += '    </div>';
    html += '    <div class="inline-flex rounded-lg border border-[#dccdb4] bg-[#faf6ee] p-1 shrink-0">';
    var cCls = STATE.cidadesSubTab === "cidades" ? "bg-[#1d3b53] text-white font-bold" : "text-[#2b2620] hover:bg-[#f3ead8]";
    var cadCls = STATE.cidadesSubTab === "caderno" ? "bg-[#1d3b53] text-white font-bold" : "text-[#2b2620] hover:bg-[#f3ead8]";
    html += '      <button type="button" onclick="setCidadesSubTab(\'cidades\')" class="px-4 py-2 rounded-md text-xs transition cursor-pointer ' + cCls + '">Páginas por Cidade (' + cidades.length + ')</button>';
    html += '      <button type="button" onclick="setCidadesSubTab(\'caderno\')" class="px-4 py-2 rounded-md text-xs transition cursor-pointer ' + cadCls + '">Caderno do Trecho (1852–1880)</button>';
    html += '    </div>';
    html += '  </div>';

    if (STATE.cidadesSubTab === "cidades") {
      // City pills
      html += '  <div class="mt-6 flex flex-wrap gap-2">';
      cidades.forEach(function (c) {
        var act = c.id === STATE.selectedCidadeId ? "bg-[#1d3b53] text-white font-bold" : "bg-[#faf6ee] text-[#2b2620] border border-[#dccdb4] hover:border-[#a86f25]";
        html += '<button type="button" onclick="openCidade(\'' + c.id + '\')" class="px-3.5 py-2 rounded-md text-xs transition cursor-pointer ' + act + '">📍 ' + esc(c.nome) + '</button>';
      });
      html += '  </div>';

      var cid = cidades.find(function (c) { return c.id === STATE.selectedCidadeId; }) || cidades[0];
      if (cid) {
        var cidItems = (EXTRAS.acervo || []).filter(function (it) { return it.cidadeId === cid.id; });
        html += '  <article class="mt-6 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-6 sm:p-8">';
        html += '    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#dccdb4] pb-4">';
        html += '      <div>';
        html += '        <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">' + esc(cid.margem) + '</span>';
        html += '        <h2 class="font-serif-museu text-3xl font-bold text-[#1d3b53] mt-0.5">' + esc(cid.nome) + '</h2>';
        html += '      </div>';
        html += '      <button type="button" onclick="focusCityOnMap(\'' + cid.id + '\')" class="px-3 py-1.5 rounded bg-[#1d3b53] text-white text-xs font-semibold hover:bg-[#a86f25] cursor-pointer">Ver posição no Mapa (' + cid.lat.toFixed(2) + '°, ' + cid.lng.toFixed(2) + '°) →</button>';
        html += '    </div>';

        html += '    <p class="font-serif-museu text-base sm:text-lg text-[#2b2620] mt-4 leading-relaxed bg-[#f3ead8] p-4 rounded-lg border-l-4 border-[#a86f25]">' + esc(cid.resumo) + '</p>';

        // Quadro "Quem escreveu sobre a cidade" (Regra 5)
        html += '    <div class="mt-6">';
        html += '      <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53]">Quem escreveu sobre ' + esc(cid.nome) + '</h3>';
        html += '      <div class="mt-3 overflow-x-auto">';
        html += '        <table class="w-full text-left border-collapse text-xs bg-white rounded-lg overflow-hidden border border-[#dccdb4]">';
        html += '          <thead><tr class="bg-[#1d3b53] text-white"><th class="p-3">Autor / Viajante</th><th class="p-3">Ano</th><th class="p-3">O que registrou na fonte</th></tr></thead>';
        html += '          <tbody class="divide-y divide-[#dccdb4]">';
        (cid.quemEscreveu || []).forEach(function (q) {
          html += '            <tr>';
          html += '              <td class="p-3 font-bold text-[#1d3b53] align-top">' + esc(q.autor) + '</td>';
          html += '              <td class="p-3 font-semibold text-[#a86f25] align-top whitespace-nowrap">' + esc(q.ano) + '</td>';
          html += '              <td class="p-3 text-[#2b2620] align-top leading-relaxed">' + esc(q.trecho) + '</td>';
          html += '            </tr>';
        });
        html += '          </tbody></table>';
        html += '      </div>';
        html += '    </div>';

        // Filmografia e vídeos relacionados à cidade (Serra do Ramalho, Bom Jesus da Lapa, Sobradinho)
        if (cid.videos && cid.videos.length > 0) {
          html += renderVideoReferences(cid.videos, "🎬 Filmografia e Registros em Vídeo sobre " + cid.nome);
        }

        // Salas ligadas
        html += '    <div class="mt-6">';
        html += '      <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53]">Salas Temáticas Relacionadas</h3>';
        html += '      <div class="mt-2 flex flex-wrap gap-2">';
        (cid.salasRelacionadas || []).forEach(function (sNum) {
          var sObj = SALAS.find(function (x) { return x.numero === sNum; });
          html += '<button type="button" onclick="openSala(' + sNum + ')" class="px-3 py-1.5 rounded bg-white border border-[#dccdb4] hover:border-[#a86f25] text-xs font-semibold text-[#1d3b53] cursor-pointer">Sala ' + sNum + (sObj ? ": " + esc(sObj.titulo) : "") + '</button>';
        });
        html += '      </div>';
        html += '    </div>';

        // Itens do acervo ligados à cidade
        if (cidItems.length > 0) {
          html += '    <div class="mt-6 pt-6 border-t border-[#dccdb4]">';
          html += '      <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mb-3">Itens do Acervo ligados a ' + esc(cid.nome) + ' (' + cidItems.length + ')</h3>';
          html += renderItemsGallery(cidItems);
          html += '    </div>';
        }
        html += '  </article>';
      }
    } else {
      // Sub-tab: Caderno do Trecho (de Carinhanha a Paratinga pelos 5 viajantes)
      html += '  <div class="mt-6 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-6 sm:p-8">';
      html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Antologia Comparada · Páginas 48 a 52 do Projeto Conceitual</span>';
      html += '    <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53] mt-1">' + esc(cad.titulo) + '</h2>';
      html += '    <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(cad.introducao) + '</p>';

      html += '    <div class="space-y-8 mt-6">';
      (cad.trechos || []).forEach(function (tr) {
        html += '      <div class="bg-white rounded-lg border border-[#dccdb4] p-5">';
        html += '        <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53]">' + esc(tr.titulo) + '</h3>';
        html += '        <p class="text-xs text-[#5a5248] mt-1">' + esc(tr.resumo) + '</p>';
        html += '        <div class="mt-4 space-y-3">';
        (tr.relatos || []).forEach(function (rel) {
          html += '          <div class="p-4 rounded bg-[#faf6ee] border-l-4 border-[#a86f25]">';
          html += '            <div class="flex flex-wrap items-center justify-between gap-2">';
          html += '              <div class="text-xs font-bold text-[#1d3b53]">' + esc(rel.autor) + ' <span class="text-[#a86f25]">(' + esc(rel.data) + ')</span></div>';
          html += '              ' + renderVerificationBadge(rel.verificacao);
          html += '            </div>';
          html += '            <div class="text-[11px] text-[#5a5248] italic mt-0.5">Fonte: ' + esc(rel.obra) + '</div>';
          html += '            <p class="text-xs sm:text-sm text-[#2b2620] mt-2 leading-relaxed">' + esc(rel.citacao) + '</p>';
          html += '          </div>';
        });
        html += '        </div>';
        html += '      </div>';
      });
      html += '    </div>';

      // Tabela "As mesmas cidades em números"
      if (cad.tabelaCidadesNumeros) {
        var tb = cad.tabelaCidadesNumeros;
        html += '    <div class="mt-8 overflow-x-auto">';
        html += '      <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53] mb-3">' + esc(tb.titulo) + '</h3>';
        html += '      <table class="w-full text-left border-collapse text-xs bg-white rounded-lg overflow-hidden border border-[#dccdb4]">';
        html += '        <thead><tr class="bg-[#1d3b53] text-white">';
        tb.colunas.forEach(function (col) {
          html += '<th class="p-3 font-semibold">' + esc(col) + '</th>';
        });
        html += '        </tr></thead><tbody class="divide-y divide-[#dccdb4]">';
        tb.linhas.forEach(function (row) {
          html += '          <tr>';
          row.forEach(function (cell, idx) {
            html += '<td class="p-3 align-top ' + (idx === 0 ? "font-bold text-[#1d3b53]" : "text-[#2b2620]") + '">' + esc(cell) + '</td>';
          });
          html += '          </tr>';
        });
        html += '        </tbody></table>';
        html += '    </div>';
      }

      // ABC da Carreira Grande
      html += '    <div class="mt-8 pt-6 border-t border-[#dccdb4]">';
      html += '      <h3 class="font-serif-museu text-xl font-bold text-[#1d3b53]">O “ABC da Carreira Grande” (Toada dos Remeiros registrada por Wilson Lins, 1952)</h3>';
      html += '      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">';
      (EXTRAS.abcCarreiraGrande || []).forEach(function (p) {
        html += '        <div class="p-3 rounded bg-white border border-[#dccdb4]">';
        html += '          <div class="font-serif-museu font-bold text-sm text-[#a86f25]">“' + esc(p.verso) + '”</div>';
        html += '          <div class="text-xs font-bold text-[#1d3b53] mt-0.5">' + esc(p.porto) + '</div>';
        html += '          <p class="text-[11px] text-[#5a5248] mt-1">' + esc(p.nota) + '</p>';
        html += '        </div>';
      });
      html += '      </div>';
      html += '    </div>';

      html += '  </div>';
    }

    html += '</div>';
    el.innerHTML = html;
  }

  // ========================================================================
  // View 5: LINHA DO TEMPO (Eventos datados e filtráveis — Regra 4)
  // ========================================================================
  function renderViewLinhaDoTempo() {
    var el = document.getElementById("view-linha-do-tempo");
    if (!el) return;

    var eventos = EXTRAS.linhaDoTempo || [];
    var temas = [];
    eventos.forEach(function (ev) {
      if (ev.tema && temas.indexOf(ev.tema) === -1) temas.push(ev.tema);
    });

    var filtered = eventos.filter(function (ev) {
      if (STATE.timelineTema !== "todos" && ev.tema !== STATE.timelineTema) return false;
      if (STATE.timelineVerificacao !== "todos" && ev.verificacao !== STATE.timelineVerificacao) return false;
      return true;
    });

    var html = '<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">';
    html += '  <div class="border-b border-[#dccdb4] pb-5">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Cronologia Geral do Vale · 1,75 Bilhão de Anos a 2026</span>';
    html += '    <h1 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">Linha do Tempo do Médio São Francisco</h1>';
    html += '    <p class="text-sm text-[#5a5248] mt-1">Datas honestas (Regra 3.3), indicando intervalos e divergências entre fontes primárias, com selo visível de verificação.</p>';

    html += '    <div class="mt-4 flex flex-wrap gap-2 items-center">';
    html += '      <select onchange="setTimelineFilter(\'tema\', this.value)" aria-label="Filtrar linha do tempo por tema" class="px-3 py-1.5 rounded border border-[#dccdb4] bg-white text-xs font-semibold">';
    html += '        <option value="todos">Todos os temas (' + eventos.length + ' marcos)</option>';
    temas.forEach(function (tm) {
      var sel = STATE.timelineTema === tm ? "selected" : "";
      html += '        <option value="' + esc(tm) + '" ' + sel + '>' + esc(tm) + '</option>';
    });
    html += '      </select>';

    html += '      <select onchange="setTimelineFilter(\'verificacao\', this.value)" aria-label="Filtrar por status de verificação" class="px-3 py-1.5 rounded border border-[#dccdb4] bg-white text-xs font-semibold">';
    html += '        <option value="todos" ' + (STATE.timelineVerificacao === "todos" ? "selected" : "") + '>Todos os status de verificação</option>';
    html += '        <option value="verificado" ' + (STATE.timelineVerificacao === "verificado" ? "selected" : "") + '>✓ Verificado na fonte</option>';
    html += '        <option value="fonte-secundaria" ' + (STATE.timelineVerificacao === "fonte-secundaria" ? "selected" : "") + '>◐ Fonte secundária</option>';
    html += '        <option value="a-confirmar" ' + (STATE.timelineVerificacao === "a-confirmar" ? "selected" : "") + '>⚠ A confirmar (hipótese)</option>';
    html += '      </select>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="mt-8 relative border-l-2 border-[#a86f25] ml-3 pl-6 space-y-6">';
    filtered.forEach(function (ev) {
      html += '    <div class="relative surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-5 shadow-2xs">';
      html += '      <span class="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-[#a86f25] border-2 border-[#faf6ee]"></span>';
      html += '      <div class="flex flex-wrap items-center justify-between gap-2">';
      html += '        <span class="px-2.5 py-0.5 rounded bg-[#1d3b53] text-white font-bold text-xs">' + esc(ev.data) + '</span>';
      html += '        <div class="flex items-center gap-2">' + renderVerificationBadge(ev.verificacao) + '<span class="text-xs font-semibold text-[#a86f25]">' + esc(ev.tema) + '</span></div>';
      html += '      </div>';
      html += '      <h2 class="font-serif-museu text-xl font-bold text-[#1d3b53] mt-2">' + esc(ev.titulo) + '</h2>';
      html += '      <p class="text-sm text-[#2b2620] mt-1.5 leading-relaxed">' + esc(ev.texto) + '</p>';
      html += '      <div class="mt-3 pt-2 border-t border-[#dccdb4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5a5248]">';
      html += '        <span><strong>Fonte:</strong> ' + esc(ev.fonte) + '</span>';
      html += '        <button type="button" onclick="openSala(' + ev.eixo + ')" class="font-bold text-[#1d3b53] hover:text-[#a86f25] underline cursor-pointer">Ver Sala ' + ev.eixo + ' →</button>';
      html += '      </div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    el.innerHTML = html;
  }

  // ========================================================================
  // View 6: MAPA INTERATIVO (Leaflet + OpenStreetMap + GeoJSON — Regra 8)
  // ========================================================================
  function renderViewMapa() {
    var el = document.getElementById("view-mapa");
    if (!el) return;

    var pontos = EXTRAS.pontosMapa || [];

    var html = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">';
    html += '  <div class="border-b border-[#dccdb4] pb-5">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Cartografia Interativa · Leaflet + OpenStreetMap + GeoJSON</span>';
    html += '    <h1 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">Mapa do Médio São Francisco: Cidades, Grutas, Quilombos e Rotas</h1>';
    html += '    <p class="text-sm text-[#5a5248] mt-1">Clique nos marcadores para abrir as cidades, cavernas paleontológicas da Serra do Ramalho e Carinhanha, quilombos certificados e rotas históricas dos viajantes.</p>';

    html += '    <div class="mt-4 flex flex-wrap gap-2">';
    var tipos = [
      { id: "todos", label: "Todos os pontos (" + pontos.length + ")" },
      { id: "cidade", label: "📍 Cidades e Portos Históricos" },
      { id: "caverna", label: "🦇 Grutas e Sítios Paleontológicos" },
      { id: "quilombo", label: "✊🏿 Comunidades Quilombolas" },
      { id: "indigena", label: "🏹 Territórios Indígenas" }
    ];
    tipos.forEach(function (t) {
      var act = STATE.mapaFiltroTipo === t.id ? "bg-[#1d3b53] text-white font-bold" : "bg-[#faf6ee] text-[#2b2620] border border-[#dccdb4]";
      html += '<button type="button" onclick="setMapaFiltro(\'' + t.id + '\')" class="px-3 py-1.5 rounded text-xs transition cursor-pointer ' + act + '">' + esc(t.label) + '</button>';
    });
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">';
    html += '    <div class="lg:col-span-2">';
    html += '      <div id="leaflet-map-container" aria-label="Mapa interativo do Médio São Francisco"></div>';
    html += '      <p class="text-[11px] text-[#5a5248] mt-2">Dados exportados em <code>content/mapa.geojson</code> · Base cartográfica © OpenStreetMap contributors.</p>';
    html += '    </div>';

    // Accessible list of points alongside the map
    var filteredPts = pontos.filter(function (p) {
      return STATE.mapaFiltroTipo === "todos" || p.tipo === STATE.mapaFiltroTipo;
    });
    html += '    <div class="lg:col-span-1 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-4 max-h-[540px] overflow-y-auto">';
    html += '      <h2 class="font-serif-museu text-lg font-bold text-[#1d3b53] mb-3">Pontos Georreferenciados (' + filteredPts.length + ')</h2>';
    html += '      <div class="space-y-2.5">';
    filteredPts.forEach(function (pt) {
      html += '        <div class="p-3 rounded bg-white border border-[#dccdb4]">';
      html += '          <div class="text-xs font-bold text-[#1d3b53]">' + esc(pt.nome) + '</div>';
      html += '          <p class="text-[11px] text-[#2b2620] mt-1">' + esc(pt.resumo) + '</p>';
      html += '          <div class="mt-2 flex items-center justify-between text-[11px]">';
      html += '            <button type="button" onclick="panMapTo(' + pt.lat + ', ' + pt.lng + ')" class="text-[#a86f25] font-bold underline cursor-pointer">Centralizar no mapa</button>';
      html += '            <button type="button" onclick="openSala(' + pt.sala + ')" class="text-[#1d3b53] underline cursor-pointer">Sala ' + pt.sala + '</button>';
      html += '          </div>';
      html += '        </div>';
    });
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    el.innerHTML = html;
    setTimeout(initLeafletMap, 60);
  }

  function initLeafletMap() {
    var container = document.getElementById("leaflet-map-container");
    if (!container || typeof window.L === "undefined") return;

    if (STATE.leafletMap) {
      STATE.leafletMap.remove();
      STATE.leafletMap = null;
    }

    var map = window.L.map(container).setView([-13.2536, -43.4181], 7);
    STATE.leafletMap = map;

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Historical river axis polyline (Pirapora -> Januária -> Carinhanha -> Lapa -> Paratinga -> Ibotirama -> Barra -> Sobradinho -> Juazeiro)
    var riverCoords = [
      [-17.3450, -44.9419],
      [-15.4881, -44.3619],
      [-14.3047, -43.7656],
      [-13.5622, -43.5967],
      [-13.2536, -43.4181],
      [-13.0908, -43.4658],
      [-12.6906, -43.1842],
      [-12.1853, -43.2206],
      [-11.0894, -43.1417],
      [-9.6500, -41.3000],
      [-9.4117, -40.5028]
    ];
    window.L.polyline(riverCoords, {
      color: "#1d3b53",
      weight: 4,
      opacity: 0.75
    }).addTo(map).bindPopup("<strong>Caminho Fluvial do Médio São Francisco</strong><br>Eixo navegável de Pirapora a Juazeiro (~1.370 km) percorrido por Halfeld (1852), Burton (1867), Comissão Hidráulica (1879) e Lutz & Machado (1912).");

    var pontos = (EXTRAS.pontosMapa || []).filter(function (p) {
      return STATE.mapaFiltroTipo === "todos" || p.tipo === STATE.mapaFiltroTipo;
    });

    pontos.forEach(function (pt) {
      var color = "#1d3b53";
      if (pt.tipo === "caverna") color = "#a86f25";
      if (pt.tipo === "quilombo") color = "#17593b";
      if (pt.tipo === "indigena") color = "#8c2619";

      var marker = window.L.circleMarker([pt.lat, pt.lng], {
        radius: pt.id === "pt-lapa" ? 10 : 7,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      marker.bindPopup(
        '<div style="font-family: sans-serif; max-width: 240px;">' +
        '<strong style="color:#1d3b53; font-size:13px;">' + esc(pt.nome) + '</strong>' +
        '<p style="font-size:11px; margin:4px 0;">' + esc(pt.resumo) + '</p>' +
        '<button onclick="openCidade(\'' + pt.cidadeId + '\')" style="background:#1d3b53;color:#fff;border:0;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;margin-right:4px;">Página da Cidade</button>' +
        '<button onclick="openSala(' + pt.sala + ')" style="background:#a86f25;color:#fff;border:0;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;">Sala ' + pt.sala + '</button>' +
        '</div>'
      );
    });
  }

  // ========================================================================
  // View 7: PESQUISA (Bibliografia, Fontes Primárias, Pontos a Verificar, Citação)
  // ========================================================================
  function renderViewPesquisa() {
    var el = document.getElementById("view-pesquisa");
    if (!el) return;

    var fontes = DADOS.fontes || [];
    var verif = DADOS.verificacaoEPassos || {};
    var schemaReport = validateCollectionsSchema();

    var q = (STATE.pesquisaBusca || "").toLowerCase().trim();
    var filteredFontes = fontes.filter(function (f) {
      if (!q) return true;
      return (f.categoria + " " + f.referencia + " " + f.nota).toLowerCase().indexOf(q) !== -1;
    });

    var html = '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">';
    html += '  <div class="border-b border-[#dccdb4] pb-5">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Rigor Documental · Regra 3 e Regra 6</span>';
    html += '    <h1 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">Pesquisa, Fontes Primárias e Onde Estão os Originais</h1>';
    html += '    <p class="text-sm text-[#5a5248] mt-1 max-w-3xl">Nenhum fato sem fonte: consulte todas as referências bibliográficas e arquivísticas do projeto, a lista transparente de hipóteses pendentes de verificação em fonte primária e o validador de schema do acervo.</p>';
    html += '  </div>';

    // Estante Editorial do Museu
    html += '  <div class="mt-8">';
    html += '    <h2 class="font-serif-museu text-2xl font-bold text-[#1d3b53]">Edições Anotadas e Transcrições Preparadas pelo Museu</h2>';
    html += '    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">';
    (EXTRAS.estanteEditorial || []).forEach(function (ed) {
      html += '      <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-5">';
      html += '        <span class="inline-block px-2 py-0.5 rounded bg-[#e6f2ec] text-[#17593b] text-[11px] font-bold">' + esc(ed.status) + '</span>';
      html += '        <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53] mt-2">' + esc(ed.titulo) + '</h3>';
      html += '        <div class="text-xs font-semibold text-[#a86f25] mt-0.5">' + esc(ed.autor) + '</div>';
      html += '        <p class="text-xs text-[#2b2620] mt-2 leading-relaxed">' + esc(ed.descricao) + '</p>';
      html += '      </div>';
    });
    html += '    </div>';
    html += '  </div>';

    // Pontos a Verificar antes de ir para as paredes (Regra 3.2)
    html += '  <div class="mt-10 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-6">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#8c2619]">Transparência Historiográfica (Regra 3.2)</span>';
    html += '    <h2 class="font-serif-museu text-2xl font-bold text-[#1d3b53] mt-1">Pontos a verificar na fonte primária antes de irem para os painéis</h2>';
    html += '    <p class="text-xs text-[#5a5248] mt-1">Hipóteses, tradições orais e citações indiretas aparecem sempre com o selo “A confirmar” e nunca como fato consumado.</p>';
    html += '    <div class="mt-4 overflow-x-auto">';
    html += '      <table class="w-full text-left border-collapse text-xs bg-white rounded-lg overflow-hidden border border-[#dccdb4]">';
    html += '        <thead><tr class="bg-[#1d3b53] text-white"><th class="p-3">Item / Hipótese sob verificação</th><th class="p-3">Sala / Eixo</th><th class="p-3">Providência de pesquisa</th></tr></thead>';
    html += '        <tbody class="divide-y divide-[#dccdb4]">';
    (verif.pontosAVerificar || []).forEach(function (pt) {
      html += '          <tr>';
      html += '            <td class="p-3 text-[#2b2620] font-medium">' + esc(pt.item) + '</td>';
      html += '            <td class="p-3 text-[#1d3b53] font-semibold whitespace-nowrap">' + esc(pt.eixo) + '</td>';
      html += '            <td class="p-3">' + renderVerificationBadge("a-confirmar") + ' <span class="ml-1 text-[#5a5248]">' + esc(pt.status) + '</span></td>';
      html += '          </tr>';
    });
    html += '        </tbody></table>';
    html += '    </div>';
    html += '  </div>';

    // Bibliografia Geral Filtrável
    html += '  <div class="mt-10 surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-6">';
    html += '    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">';
    html += '      <div>';
    html += '        <h2 class="font-serif-museu text-2xl font-bold text-[#1d3b53]">Bibliografia e Fontes Documentais (' + filteredFontes.length + ')</h2>';
    html += '        <p class="text-xs text-[#5a5248]">Relatórios imperiais, livros do século XVIII, artigos de paleontologia e espeleologia, teses e filmografia.</p>';
    html += '      </div>';
    html += '      <input type="search" value="' + esc(STATE.pesquisaBusca) + '" oninput="updatePesquisaSearch(this.value)" placeholder="Filtrar bibliografia..." class="px-3 py-2 rounded border border-[#dccdb4] bg-white text-xs w-full sm:w-64" />';
    html += '    </div>';
    html += '    <div class="mt-4 divide-y divide-[#dccdb4] bg-white rounded-lg border border-[#dccdb4]">';
    filteredFontes.forEach(function (f) {
      html += '      <div class="p-4">';
      html += '        <span class="text-[11px] font-bold uppercase tracking-wider text-[#a86f25]">' + esc(f.categoria) + '</span>';
      html += '        <div class="text-xs sm:text-sm font-semibold text-[#1d3b53] mt-0.5">' + esc(f.referencia) + '</div>';
      html += '        <p class="text-xs text-[#5a5248] mt-1">' + esc(f.nota) + '</p>';
      html += '      </div>';
    });
    html += '    </div>';
    html += '  </div>';

    // Schema Validator & Como Citar
    html += '  <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">';
    html += '    <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-5">';
    html += '      <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53]">Como citar este projeto e o acervo</h3>';
    html += '      <p class="text-xs text-[#2b2620] mt-2 font-mono bg-white p-3 rounded border border-[#dccdb4]">CARNEIRO, Gabriel Neves. <em>Museu do Médio São Francisco: Projeto Conceitual, Levantamento Histórico-Científico e Acervo Digital</em>. Bom Jesus da Lapa (BA), 2026.</p>';
    html += '    </div>';
    html += '    <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-lg p-5">';
    html += '      <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53]">Status do Validador de Schema (Regra 6)</h3>';
    html += '      <p class="text-xs text-[#2b2620] mt-2">Coleções validadas em tempo de execução e exportadas em <code>content/*.json</code>: <strong>' + schemaReport.totalItems + ' itens</strong>, <strong>' + schemaReport.totalTitulares + ' titulares</strong>, <strong>' + schemaReport.totalCidades + ' cidades</strong> e <strong>' + schemaReport.totalSalas + ' salas</strong>. Erros de schema: <strong>' + schemaReport.errors.length + '</strong>.</p>';
    html += '    </div>';
    html += '  </div>';

    html += '</div>';
    el.innerHTML = html;
  }

  // ========================================================================
  // View 8: PARTICIPE — “CONTE SUA HISTÓRIA” (Memória Oral com LGPD — Regras 3.6, 4 e 8)
  // ========================================================================
  function renderViewParticipe() {
    var el = document.getElementById("view-participe");
    if (!el) return;

    var html = '<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">';
    html += '  <div class="surface-card bg-[#faf6ee] border border-[#dccdb4] rounded-xl p-6 sm:p-8">';
    html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">Memória Oral e Curadoria Compartilhada · Regra 3.6 e Regra 8</span>';
    html += '    <h1 class="font-serif-museu text-3xl sm:text-4xl font-bold text-[#1d3b53] mt-1">Participe: “Conte sua história”</h1>';
    html += '    <p class="text-sm text-[#2b2620] mt-2 leading-relaxed">O Museu do Médio São Francisco está gravando e reunindo memórias de <strong>remeiros e barqueiros</strong>, <strong>romeiros do Bom Jesus</strong>, <strong>famílias que chegaram às 23 agrovilas da Serra do Ramalho em 1975–1976</strong>, <strong>moradores de Rio das Rãs, Tomé Nunes e demais comunidades quilombolas</strong>, <strong>povos indígenas (Pankaru, Tuxá, Xakriabá, Truká)</strong>, <strong>filhos de tropeiros</strong> e <strong>ex-guardas da SUCAM</strong>.</p>';

    html += '    <form id="form-conte-historia" onsubmit="handleStorySubmit(event)" class="mt-6 space-y-4">';
    html += '      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
    html += '        <div>';
    html += '          <label for="st-nome" class="block text-xs font-bold text-[#1d3b53]">Seu nome (ou como deseja ser identificado) *</label>';
    html += '          <input id="st-nome" name="nome" type="text" required class="mt-1 w-full px-3 py-2 rounded border border-[#dccdb4] bg-white text-sm" />';
    html += '        </div>';
    html += '        <div>';
    html += '          <label for="st-comunidade" class="block text-xs font-bold text-[#1d3b53]">Cidade, Agrovila, Quilombo ou Comunidade *</label>';
    html += '          <input id="st-comunidade" name="comunidade" type="text" required placeholder="Ex.: Agrovila 06 (Serra do Ramalho), Rio das Rãs, Lapa..." class="mt-1 w-full px-3 py-2 rounded border border-[#dccdb4] bg-white text-sm" />';
    html += '        </div>';
    html += '      </div>';

    html += '      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
    html += '        <div>';
    html += '          <label for="st-tema" class="block text-xs font-bold text-[#1d3b53]">Tema principal da memória *</label>';
    html += '          <select id="st-tema" name="tema" required class="mt-1 w-full px-3 py-2 rounded border border-[#dccdb4] bg-white text-sm">';
    html += '            <option value="Romaria do Bom Jesus da Lapa">Romaria do Bom Jesus da Lapa (Sala 10)</option>';
    html += '            <option value="Sobradinho e chegada às Agrovilas da Serra do Ramalho">Sobradinho e chegada às Agrovilas da Serra do Ramalho (Sala 17)</option>';
    html += '            <option value="Quilombos (Rio das Rãs, Tomé Nunes e comunidades)">Quilombos do São Francisco (Sala 11)</option>';
    html += '            <option value="Povos Indígenas do São Francisco">Povos Indígenas do São Francisco (Sala 4)</option>';
    html += '            <option value="Vapores, Barcas, Carrancas e Remeiros">Vapores, Barcas, Carrancas e Remeiros (Sala 7)</option>';
    html += '            <option value="Tropeiros, Fazendas e Feiras">Tropeiros, Fazendas e Feiras (Sala 6)</option>';
    html += '            <option value="Guardas da SUCAM, SUSA e Saúde">Guardas da SUCAM, SUSA e Saúde (Sala 9)</option>';
    html += '            <option value="Doação ou empréstimo de fotografia/objeto antigo">Tenho fotografia, ex-voto ou objeto antigo para mostrar</option>';
    html += '          </select>';
    html += '        </div>';
    html += '        <div>';
    html += '          <label for="st-contato" class="block text-xs font-bold text-[#1d3b53]">Contato (WhatsApp ou e-mail — nunca será publicado) *</label>';
    html += '          <input id="st-contato" name="contato" type="text" required placeholder="Usado apenas pela equipe do museu" class="mt-1 w-full px-3 py-2 rounded border border-[#dccdb4] bg-white text-sm" />';
    html += '        </div>';
    html += '      </div>';

    html += '      <div>';
    html += '        <label for="st-relato" class="block text-xs font-bold text-[#1d3b53]">Seu relato ou descrição do documento/fotografia *</label>';
    html += '        <textarea id="st-relato" name="relato" rows="5" required placeholder="Conte a história com datas aproximadas, nomes das pessoas lembradas e o lugar onde aconteceu..." class="mt-1 w-full px-3 py-2 rounded border border-[#dccdb4] bg-white text-sm"></textarea>';
    html += '      </div>';

    // Aviso de Privacidade LGPD e Consentimento Explícito (Regra 3.6 e Regra 8)
    html += '      <div class="p-4 rounded-lg bg-[#f3ead8] border border-[#c9a65b] text-xs text-[#2b2620] space-y-2">';
    html += '        <div class="font-bold text-[#1d3b53]">Aviso de Privacidade (LGPD — Lei n.º 13.709/2018) e Consentimento Explícito (Regra 3.6)</div>';
    html += '        <p>1. Nenhum depoimento entra no acervo público sem revisão da curadoria e assinatura de Termo de Consentimento Livre e Esclarecido.<br>2. O site nunca publica telefone, endereço ou dados pessoais além do nome e da comunidade que a própria pessoa autorizar.<br>3. Comunidades quilombolas, indígenas e atingidos por barragens são sempre identificados pelo nome que usam para si.</p>';
    html += '        <label class="flex items-start gap-2 pt-1 font-semibold text-[#1d3b53] cursor-pointer">';
    html += '          <input id="st-consent" type="checkbox" required class="mt-0.5" />';
    html += '          <span>Li o aviso de privacidade (LGPD) e autorizo o contato da equipe do Museu do Médio São Francisco para verificação e formalização do termo de consentimento.</span>';
    html += '        </label>';
    html += '      </div>';

    html += '      <div class="flex flex-wrap items-center justify-between gap-3 pt-2">';
    html += '        <button type="submit" class="px-6 py-2.5 rounded-md bg-[#1d3b53] hover:bg-[#a86f25] text-white font-bold text-sm transition cursor-pointer">Enviar relato para a curadoria →</button>';
    html += '        <span class="text-xs text-[#5a5248]">Instagram oficial: <strong>@museudomediosaofrancisco</strong></span>';
    html += '      </div>';
    html += '    </form>';

    html += '    <div id="story-submit-feedback" class="hidden mt-5 p-4 rounded-lg bg-[#e6f2ec] border border-[#17593b] text-xs text-[#17593b] font-semibold"></div>';
    html += '  </div>';
    html += '</div>';

    el.innerHTML = html;
  }

  // ========================================================================
  // Lightbox Controller (Setas ← →, Fechar Esc, Legenda Completa — Regra 5.3)
  // ========================================================================
  function openLightboxById(itemId) {
    var list = EXTRAS.acervo || [];
    var idx = list.findIndex(function (x) { return x.id === itemId; });
    if (idx === -1) return;
    STATE.lightboxList = list;
    STATE.lightboxIndex = idx;
    updateLightboxDOM();
    var modal = document.getElementById("lightbox-modal");
    if (modal) modal.classList.remove("hidden");
  }

  function updateLightboxDOM() {
    var it = STATE.lightboxList[STATE.lightboxIndex];
    if (!it) return;

    var imgEl = document.getElementById("lightbox-img");
    var noImgEl = document.getElementById("lightbox-no-image");
    if (it.exibir_imagem && it.arquivo) {
      imgEl.src = it.arquivo;
      imgEl.alt = it.titulo + " — " + it.credito;
      imgEl.classList.remove("hidden");
      noImgEl.classList.add("hidden");
    } else {
      imgEl.src = "";
      imgEl.classList.add("hidden");
      noImgEl.classList.remove("hidden");
      noImgEl.innerHTML =
        '<div class="text-xs font-bold uppercase tracking-wider text-[#c9a65b]">Respeito aos Direitos Autorais (Regra 3.4)</div>' +
        '<div class="font-serif-museu text-lg font-bold text-white mt-2">' + esc(it.titulo) + '</div>' +
        '<p class="text-xs text-[#f3ead8]/90 mt-2">Esta obra encontra-se sob gestão de direitos de terceiros (' + esc(it.original) + '). O Museu do Médio São Francisco exibe apenas a ficha catalográfica verificada e o link externo para consulta na instituição detentora.</p>';
    }

    document.getElementById("lightbox-badges").innerHTML =
      renderVerificationBadge(it.verificacao) + " " + renderLicenseBadge(it.licenca, it.exibir_imagem);
    document.getElementById("lightbox-title").textContent = it.titulo;
    document.getElementById("lightbox-author-date").textContent =
      it.titularNome + " · " + it.ano + " · " + it.local + " (Sala " + it.sala + ")";
    document.getElementById("lightbox-desc").textContent = it.descricao;

    var qEl = document.getElementById("lightbox-quote");
    var quotesArr = [];
    if (it.citacaoOriginal) quotesArr.push(it.citacaoOriginal);
    if (it.avisoIA) quotesArr.push("⚠ Aviso de transparência (Regra 3.4): " + it.avisoIA);
    if (quotesArr.length > 0) {
      qEl.textContent = quotesArr.join(" — ");
      qEl.classList.remove("hidden");
    } else {
      qEl.classList.add("hidden");
    }

    document.getElementById("lightbox-credit").textContent = it.credito;
    document.getElementById("lightbox-original").textContent = it.original;
    document.getElementById("lightbox-sources").textContent = (it.fontes || []).join(" | ");
    document.getElementById("lightbox-citation").textContent =
      it.titularNome.toUpperCase() + ". " + it.titulo + " (" + it.ano + "). In: Museu do Médio São Francisco — Acervo Digital (Sala " + it.sala + "). Original: " + it.original + ".";
    document.getElementById("lightbox-counter").textContent =
      "Item " + (STATE.lightboxIndex + 1) + " de " + STATE.lightboxList.length;
  }

  function stepLightbox(delta) {
    if (!STATE.lightboxList || STATE.lightboxList.length === 0) return;
    STATE.lightboxIndex = (STATE.lightboxIndex + delta + STATE.lightboxList.length) % STATE.lightboxList.length;
    updateLightboxDOM();
  }

  function closeLightbox() {
    var modal = document.getElementById("lightbox-modal");
    if (modal) modal.classList.add("hidden");
  }

  // ========================================================================
  // Navigation & Global Actions
  // ========================================================================
  function navigateTo(viewName) {
    STATE.currentView = viewName;
    var views = ["museu", "salas", "acervo", "cidades", "linha-do-tempo", "mapa", "pesquisa", "participe"];
    views.forEach(function (v) {
      var sec = document.getElementById("view-" + v);
      if (sec) {
        if (v === viewName) sec.classList.remove("hidden");
        else sec.classList.add("hidden");
      }
    });

    // Update active state on nav buttons
    var navBtns = document.querySelectorAll("[data-nav]");
    for (var i = 0; i < navBtns.length; i++) {
      var btn = navBtns[i];
      if (btn.getAttribute("data-nav") === viewName) {
        btn.classList.add("nav-btn-active");
      } else {
        btn.classList.remove("nav-btn-active");
      }
    }

    if (viewName === "museu") renderViewMuseu();
    if (viewName === "salas") renderViewSalas();
    if (viewName === "acervo") renderViewAcervo();
    if (viewName === "cidades") renderViewCidades();
    if (viewName === "linha-do-tempo") renderViewLinhaDoTempo();
    if (viewName === "mapa") renderViewMapa();
    if (viewName === "pesquisa") renderViewPesquisa();
    if (viewName === "participe") renderViewParticipe();

    if (typeof window.scrollTo === "function") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Expose interactive handlers globally
  window.navigateTo = navigateTo;

  window.openSala = function (num) {
    STATE.selectedSalaNum = Number(num) || 0;
    STATE.selectedNucleo = "todos";
    navigateTo("salas");
  };

  window.filterSalasByNucleo = function (nucleoRomano) {
    STATE.selectedNucleo = nucleoRomano;
    STATE.selectedSalaNum = 0;
    renderViewSalas();
  };

  window.setAcervoSubTab = function (tab) {
    STATE.acervoSubTab = tab;
    renderViewAcervo();
  };

  window.openTitular = function (titularId) {
    STATE.selectedTitularId = titularId;
    STATE.titularBioExpanded = false;
    STATE.acervoSubTab = "titulares";
    navigateTo("acervo");
  };

  window.toggleTitularBio = function () {
    STATE.titularBioExpanded = !STATE.titularBioExpanded;
    renderViewAcervo();
  };

  window.setGalleryViewMode = function (mode) {
    STATE.galleryViewMode = mode;
    renderViewAcervo();
  };

  window.updateAcervoSearch = function (val) {
    STATE.acervoSearchQuery = val;
    var res = document.getElementById("acervo-items-results");
    if (res) res.innerHTML = renderItemsGallery(filterAcervoItems());
  };

  window.setAcervoFilter = function (field, val) {
    if (field === "titular") STATE.acervoFilterTitular = val;
    if (field === "cidade") STATE.acervoFilterCidade = val;
    if (field === "tema") STATE.acervoFilterTema = val;
    renderViewAcervo();
  };

  window.openQuickSearch = function () {
    STATE.acervoSubTab = "itens";
    navigateTo("acervo");
    setTimeout(function () {
      var inp = document.getElementById("input-acervo-q");
      if (inp) inp.focus();
    }, 80);
  };

  window.setCidadesSubTab = function (tab) {
    STATE.cidadesSubTab = tab;
    renderViewCidades();
  };

  window.openCidade = function (cidadeId) {
    STATE.selectedCidadeId = cidadeId;
    STATE.cidadesSubTab = "cidades";
    navigateTo("cidades");
  };

  window.openCadernoDoTrecho = function () {
    STATE.cidadesSubTab = "caderno";
    navigateTo("cidades");
  };

  window.focusCityOnMap = function (cidadeId) {
    var cid = (EXTRAS.cidades || []).find(function (c) { return c.id === cidadeId; });
    navigateTo("mapa");
    if (cid) {
      setTimeout(function () {
        if (STATE.leafletMap) STATE.leafletMap.setView([cid.lat, cid.lng], 10);
      }, 150);
    }
  };

  window.setTimelineFilter = function (field, val) {
    if (field === "tema") STATE.timelineTema = val;
    if (field === "verificacao") STATE.timelineVerificacao = val;
    renderViewLinhaDoTempo();
  };

  window.setMapaFiltro = function (tipo) {
    STATE.mapaFiltroTipo = tipo;
    renderViewMapa();
  };

  window.panMapTo = function (lat, lng) {
    if (STATE.leafletMap) {
      STATE.leafletMap.setView([lat, lng], 11);
    }
  };

  window.updatePesquisaSearch = function (val) {
    STATE.pesquisaBusca = val;
    renderViewPesquisa();
  };

  window.handleStorySubmit = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    var nome = (document.getElementById("st-nome") || {}).value || "";
    var com = (document.getElementById("st-comunidade") || {}).value || "";
    var tema = (document.getElementById("st-tema") || {}).value || "";
    var relato = (document.getElementById("st-relato") || {}).value || "";
    var fb = document.getElementById("story-submit-feedback");
    if (fb) {
      fb.classList.remove("hidden");
      fb.innerHTML =
        "✓ Relato registrado para moderação curatorial! Obrigado, <strong>" + esc(nome) + "</strong> (" + esc(com) + " · " + esc(tema) + "). " +
        "Você também pode encaminhar diretamente por e-mail ou pelo Instagram @museudomediosaofrancisco.";
    }
    return false;
  };

  window.openLightboxById = openLightboxById;
  window.stepLightbox = stepLightbox;
  window.closeLightbox = closeLightbox;

  window.toggleHighContrast = function () {
    if (!document.body) return;
    document.body.classList.toggle("high-contrast");
    var isHC = document.body.classList.contains("high-contrast");
    var btn = document.getElementById("btn-high-contrast");
    if (btn) btn.setAttribute("aria-pressed", isHC ? "true" : "false");
  };

  // Keyboard navigation for Lightbox (ArrowLeft, ArrowRight, Escape)
  if (typeof document.addEventListener === "function") {
    document.addEventListener("keydown", function (e) {
      var modal = document.getElementById("lightbox-modal");
      if (!modal || modal.classList.contains("hidden")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
  }

  // Initialize on load
  function initApp() {
    var check = validateCollectionsSchema();
    var badge = document.getElementById("footer-schema-badge");
    if (badge) {
      if (check.valid) {
        badge.textContent = "✓ Validador de Schema: " + check.totalItems + " itens e " + check.totalTitulares + " titulares verificados";
      } else {
        badge.textContent = "⚠ Erro de Schema: " + check.errors.join("; ");
      }
    }
    navigateTo("museu");
  }

  window.MUSEU_VALIDATE_SCHEMA = validateCollectionsSchema;
  window.MUSEU_INIT = initApp;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
