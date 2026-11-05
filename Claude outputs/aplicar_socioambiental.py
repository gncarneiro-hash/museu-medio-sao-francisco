#!/usr/bin/env python3
# Programa socioambiental: aquário do rio, alevinos em parceria com a Codevasf, governança do viveiro,
# parceiros (Codevasf, FIOL/Infra S.A., colônias de pescadores, CBHSF) e cuidados de independência.
# Uso: python3 aplicar_socioambiental.py <pasta do site>
import json, os, re, sys
P = sys.argv[1]
def rd(f): return open(os.path.join(P, f), encoding="utf-8").read()
def wr(f, s): open(os.path.join(P, f), "w", encoding="utf-8").write(s)
def once(s, old, new, label):
    n = s.count(old); assert n == 1, f"{label}: {n}"
    return s.replace(old, new)
J = lambda x: json.dumps(x, ensure_ascii=False)

frentes = [
 ["Aquário do rio", "Tanques com espécies nativas do São Francisco (curimatã-pacu, piau, pacamã e matrinchã; dourado e surubim só numa fase posterior, porque exigem tanques grandes). Começa pequeno, com biólogo responsável, energia de reserva e autorização do órgão ambiental (INEMA): um aquário aberto à visitação tende a ser enquadrado como zoológico pela Resolução CONAMA 489/2018.", "Escolas, moradores e visitantes"],
 ["Alevinos e peixamento", "Em parceria com o Centro Integrado de Recursos Pesqueiros e Aquicultura da Codevasf em Xique-Xique, que já faz peixamentos na Lapa (60 mil alevinos de curimatã e pacamã na Barrinha, em janeiro de 2022), em vez de uma estação própria. O museu leva escolas e pescadores às solturas e mostra também o debate científico: um estudo da UFSCar (2009) encontrou menor diversidade genética em curimatãs criados em cativeiro e apontou a falta de medição da eficácia dos peixamentos.", "Pescadores e comunidades ribeirinhas"],
 ["Viveiro de mudas", "Produção e doação de mudas nativas da Caatinga, do Cerrado e da mata ciliar, com registro no RENASEM quando exigido. Parceria com viveiro ligado ao idealizador do museu (Flor da Serra) só com aprovação do conselho, contrato público, doação ou preço de custo e sem exclusividade.", "Produtores rurais, escolas, prefeituras e comunidades"],
 ["Matas ciliares", "Mutirões de recomposição das margens e das lagoas marginais, nas faixas de preservação permanente do Código Florestal (Lei 12.651/2012), com acompanhamento técnico das áreas plantadas.", "Proprietários ribeirinhos e voluntários"],
 ["Educação ambiental", "Aulas no auditório, visitas ao aquário, ao viveiro e às solturas de alevinos, e a campanha 'Eu viro carranca' nas escolas.", "Estudantes da rede pública e visitantes"]
]
parceiros = [
 ["Codevasf", "Alevinos, peixamentos e apoio técnico, pelo centro de Xique-Xique."],
 ["Ferrovia de Integração Oeste-Leste (FIOL) / Infra S.A.", "A ferrovia cruza o São Francisco entre Serra do Ramalho e Bom Jesus da Lapa por uma ponte de cerca de 2,9 km, e suas obras afetaram comunidades quilombolas (acordo judicial de abril de 2026). Caminhos legítimos de coparticipação: guarda e exposição do material arqueológico resgatado nas obras, se o museu tiver reserva técnica aceita pelo IPHAN; programas de educação patrimonial e socioambientais ligados ao licenciamento; patrocínio por edital ou pela Lei Rouanet. Por ser empresa pública federal, todo apoio depende de instrumento formal e público."],
 ["Colônias de pescadores e Igreja", "As colônias da Lapa, de Sítio do Mato e da Serra do Ramalho e a Igreja já participam dos peixamentos na festa de Bom Jesus dos Navegantes."],
 ["Comitê da Bacia (CBHSF)", "Campanha 'Eu viro carranca pra defender o Velho Chico'."]
]
cuidados = [
 "Patrocínio não compra a narrativa: a sala sobre Rio das Rãs continua contando a ferrovia, o conflito e o acordo como as fontes registram, e isso fica escrito em todo termo de parceria.",
 "Contrapartidas ligadas ao licenciamento de obras devem beneficiar quem foi afetado: pescadores, quilombolas e ribeirinhos.",
 "Contratos com empresas ligadas a membros do conselho ou ao idealizador são aprovados pelo conselho, publicados e sem exclusividade."
]

g = rd("data-geral.js")
i = g.index("  programaSocioambiental: {")
a0 = g.index("    frentes: [", i)
a1 = g.index("    ],\n", a0) + len("    ],\n")
novo = "    frentes: " + J(frentes) + ",\n    parceiros: " + J(parceiros) + ",\n    cuidados: " + J(cuidados) + ",\n"
g = g[:a0] + novo + g[a1:]
wr("data-geral.js", g)

a = rd("app.js")
anc = "    html += '    </div>';\n    if (soc.clubeEspeleologia) {"
bloco = r'''    html += '    </div>';
    if (soc.parceiros && soc.parceiros.length) {
      html += '    <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53] mt-5">Parceiros e coparticipação</h3>';
      html += '    <div class="mt-2 space-y-2.5">';
      soc.parceiros.forEach(function (p) {
        html += '      <div class="p-3 rounded bg-white border border-[#dccdb4] text-xs"><strong class="text-[#1d3b53]">' + esc(p[0]) + ':</strong> ' + esc(p[1]) + '</div>';
      });
      html += '    </div>';
    }
    if (soc.cuidados && soc.cuidados.length) {
      html += '    <h3 class="font-serif-museu text-lg font-bold text-[#1d3b53] mt-5">Independência e transparência</h3>';
      html += '    <ul class="mt-2 list-disc pl-5 space-y-1 text-xs text-[#2b2620]">';
      soc.cuidados.forEach(function (c) { html += '<li>' + esc(c) + '</li>'; });
      html += '    </ul>';
    }
    if (soc.clubeEspeleologia) {'''
a = once(a, anc, bloco, "app.js")
wr("app.js", a)

# o critério de terreno citava a "estação de alevinos" própria
g = rd("data-geral.js")
g = once(g, "o viveiro de mudas, a estação de alevinos, a praça coberta", "o viveiro de mudas, o aquário, a praça coberta", "terreno")
wr("data-geral.js", g)
print("OK")
