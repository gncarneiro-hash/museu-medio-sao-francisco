#!/usr/bin/env python3
# Página inicial: nova seção "Nossa missão: significado e pertencimento" (o DNA do museu).
# Correção: o Museu da Natureza fica em Coronel José Dias (PI), não em São Raimundo Nonato.
# Uso: python3 aplicar_pertencimento.py <pasta do site>
import json, os, sys
P = sys.argv[1]
def rd(f): return open(os.path.join(P, f), encoding="utf-8").read()
def wr(f, s): open(os.path.join(P, f), "w", encoding="utf-8").write(s)
def once(s, old, new, label):
    n = s.count(old); assert n == 1, f"{label}: {n}"
    return s.replace(old, new)

pert = {
  "rotulo": "Nossa missão",
  "titulo": "Significado e pertencimento: o DNA do museu",
  "textos": [
    "A identidade de Bom Jesus da Lapa e do Médio São Francisco é peculiar: nasce do rio, da cultura barranqueira e da romaria. O Museu do Médio São Francisco existe para devolver essa identidade a quem a vive. Sua assinatura é o pertencimento: quem entra deve se reconhecer no que vê.",
    "Georges Henri Rivière, criador do conceito de ecomuseu, o definia como um espelho onde a população se olha para se reconhecer. Um museu que só explica não pertence a ninguém; um museu em que o visitante encontra a si mesmo, a avó, a canoa do pai ou a cantiga que ouvia passa a ser dele."
  ],
  "principios": [
    {"titulo": "Pertencimento plural", "texto": "O barranqueiro, o romeiro, o quilombola, o Tuxá, o reassentado da Serra do Ramalho e o geraizeiro pertencem ao lugar de jeitos diferentes. Nenhum é o “lapense típico”; todos aparecem."},
    {"titulo": "Quem mora e quem chega", "texto": "A maioria dos romeiros não é da Lapa, mas sente a Lapa como sua. O museu acolhe os dois pertencimentos: o de quem vive no barranco e o de quem atravessa o sertão para chegar à gruta."},
    {"titulo": "Sinais concretos", "texto": "Objetos do cotidiano, rostos e nomes reais, a fala da região e as histórias de famílias, em vez de painéis genéricos."},
    {"titulo": "Um museu que recebe", "texto": "Como na Sala dos Milagres da gruta, onde cada pessoa deixa a sua história, o visitante poderá contribuir com uma foto, um objeto ou um depoimento. O museu cresce com a comunidade, em vez de falar sobre ela."}
  ],
  "fonte": "Rivière, G. H. La muséologie selon Georges Henri Rivière. Paris: Dunod, 1989 (definição evolutiva de ecomuseu, 1980) · Gonçalves, J. R. S. Ressonância, materialidade e subjetividade: as culturas como patrimônios. Horizontes Antropológicos, n. 23, 2005."
}

g = rd("data-geral.js")
anc = '    porQueNaLapa:'
g = once(g, anc, '    pertencimento: ' + json.dumps(pert, ensure_ascii=False) + ',\n' + anc, "data-geral")
g = once(g, "o Museu da Natureza, em São Raimundo Nonato (PI)", "o Museu da Natureza, em Coronel José Dias (PI), na Serra da Capivara, perto de São Raimundo Nonato", "museu da natureza")
g = once(g, "Como ele, o Museu do Rio São Francisco será", "Como ele, o Museu do Médio São Francisco será", "nome")
wr("data-geral.js", g)

a = rd("app.js")
bloco = r'''    // Section: Nossa missão — significado e pertencimento (DNA do museu)
    var pe = ap.pertencimento;
    if (pe) {
      html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">';
      html += '  <section class="surface-card rounded-xl bg-[#1d3b53] text-[#f3ead8] border-2 border-[#c9a65b] p-6 sm:p-8 shadow-sm">';
      html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#c9a65b]">' + esc(pe.rotulo) + '</span>';
      html += '    <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-white mt-1">' + esc(pe.titulo) + '</h2>';
      (pe.textos || []).forEach(function (t) {
        html += '    <p class="text-base text-[#f3ead8] mt-3 leading-relaxed max-w-4xl">' + esc(t) + '</p>';
      });
      html += '    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">';
      (pe.principios || []).forEach(function (p, i) {
        html += '      <div class="p-4 rounded-lg bg-white/10 border border-[#c9a65b]/50">';
        html += '        <h3 class="font-serif-museu font-bold text-lg text-white">' + (i + 1) + '. ' + esc(p.titulo) + '</h3>';
        html += '        <p class="text-sm text-[#f3ead8] mt-2 leading-relaxed">' + esc(p.texto) + '</p>';
        html += '      </div>';
      });
      html += '    </div>';
      if (pe.fonte) html += '    <p class="mt-5 text-xs text-[#f3ead8]/80"><strong>Referências:</strong> ' + esc(pe.fonte) + '</p>';
      html += '  </section>';
      html += '</div>';
    }

'''
a = once(a, "    // Section: Três Públicos (Regra 1) + Por que em Bom Jesus da Lapa\n", bloco + "    // Section: Três Públicos (Regra 1) + Por que em Bom Jesus da Lapa\n", "app.js")
wr("app.js", a)
print("OK")
