#!/usr/bin/env python3
# Página inicial: "A tese do museu" — o povo que o Estado deixou à própria sorte (texto assinado pelo idealizador).
# Rode depois dos outros scripts. Uso: python3 aplicar_tese.py <pasta do site>
import json, os, sys
P = sys.argv[1]
def rd(f): return open(os.path.join(P, f), encoding="utf-8").read()
def wr(f, s): open(os.path.join(P, f), "w", encoding="utf-8").write(s)
J = lambda x: json.dumps(x, ensure_ascii=False)

TESE = {
 "rotulo": "A tese do museu",
 "titulo": "O rio da integração e o povo deixado à própria sorte",
 "autor": "Gabriel Neves Carneiro, idealizador do Museu do Médio São Francisco",
 "textos": [
  "O São Francisco foi o rio da integração nacional. Pelas águas desciam e subiam barcas e, depois, vapores, com sal, rapadura, couro, cachaça e peixe seco; por terra seguiam as tropas e as boiadas, ligando o sertão à Bahia, a Minas, a Goiás e a Pernambuco; mais tarde chegaram os trilhos a Juazeiro e a Pirapora. O Médio São Francisco, de Pirapora a Juazeiro, viveu desse intercâmbio entre o rio, a tropa e o trem.",
  "Quem fazia esse rio andar era o remeiro, empurrando a barca rio acima a força de braço, o barqueiro, o tropeiro, o vaqueiro dos currais, o ribeirinho, o escravizado, o quilombola perseguido. E, durante séculos, da Colônia ao Império e à República, a maior parte dessas pessoas viveu entregue à própria sorte. Halfeld em 1852, Lutz em 1912 e Nery Guimarães em 1946 registraram, com quase cem anos de distância, as mesmas febres, as mesmas verminoses e a mesma falta de médico. Em 1862, o próprio imperador e seus ministros discutiam como fazer a autoridade “se sentir” no sertão. Juazeiro, Barra e algumas cidades do norte de Minas tiveram comércio e serviços; quase todo o resto, não.",
  "O Estado não foi apenas ausente: foi seletivo. Faltou onde o povo precisava de escola, de saúde e de direitos, e esteve presente onde interessava a outros, nas sesmarias imensas da Casa da Torre e da Casa da Ponte, no título de coronel dado pela Guarda Nacional, no pacto entre o poder público e os chefes locais que Victor Nunes Leal chamou de coronelismo, na barragem de Sobradinho, que deslocou cerca de 72 mil pessoas, e nas terras tomadas para o latifúndio.",
  "O que o vale mostra, portanto, não é um povo atrasado. É um povo privado de condições, que mesmo assim moveu a economia do sertão e inventou suas cantigas, sua fé, sua arte e suas formas de luta. O remeiro é fruto da privação, mas também da força. Theodoro Sampaio, filho de uma mulher escravizada, tornou-se engenheiro e geógrafo de renome nacional e desceu este rio em 1879; Mestre Guarany levou as carrancas ao MASP; Rio das Rãs venceu na Justiça. A capacidade sempre esteve aqui. O que faltou foram as condições.",
  "Por isso o museu tem uma pergunta no centro, e cada sala responde a ela de dois lados: onde estava o Estado, e como o povo respondeu. A história dos viajantes, da navegação, da romaria e da natureza nasce desse contexto, e não o contrário."
 ],
 "fonte": "Halfeld, H. G. F. Atlas e relatório (1852–1854), 1860 · Lutz, A.; Machado, A. Viagem pelo rio S. Francisco, 1915 (ed. Fiocruz, 2007) · Nery Guimarães, F. Memórias do IOC, t. 45, 1947 · Diário de D. Pedro II, vol. 9, 23 jul. 1862 (Museu Imperial) · Leal, V. N. Coronelismo, enxada e voto, 1949 · Sigaud, L. (1986) e Siqueira, R. (1992), citados em Univasf, A construção e as consequências da barragem de Sobradinho."
}

g = rd("data-geral.js")
anc = '    porQueNaLapa:'
assert g.count(anc) == 1
g = g.replace(anc, '    tese: ' + J(TESE) + ',\n' + anc)
wr("data-geral.js", g)

a = rd("app.js")
bloco = r"""    // Section: A tese do museu
    var te = ap.tese;
    if (te) {
      html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">';
      html += '  <article class="surface-card rounded-xl bg-[#f3ead8] border-2 border-[#1d3b53] p-6 sm:p-8 shadow-sm">';
      html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">' + esc(te.rotulo) + '</span>';
      html += '    <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53] mt-1">' + esc(te.titulo) + '</h2>';
      if (te.autor) html += '    <p class="text-sm italic text-[#5a5248] mt-1">' + esc(te.autor) + '</p>';
      (te.textos || []).forEach(function (t) {
        html += '    <p class="text-base text-[#2b2620] mt-3 leading-relaxed max-w-4xl">' + esc(t) + '</p>';
      });
      if (te.fonte) html += '    <p class="mt-5 text-xs text-[#5a5248]"><strong>Fontes:</strong> ' + esc(te.fonte) + '</p>';
      html += '  </article>';
      html += '</div>';
    }

"""
for anc in ["    // Section: Dor e resistência (fio transversal)\n", "    // Section: Três Públicos (Regra 1) + Por que em Bom Jesus da Lapa\n"]:
    if a.count(anc) == 1:
        a = a.replace(anc, bloco + anc); break
else:
    raise SystemExit("ponto de inserção não encontrado em app.js")
wr("app.js", a)
print("OK")
