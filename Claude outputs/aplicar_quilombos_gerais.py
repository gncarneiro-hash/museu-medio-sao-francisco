#!/usr/bin/env python3
# 1) Sala 11: quilombos certificados nos municípios à beira do rio, de Pirapora a Juazeiro (Fundação Palmares, 14 abr. 2025).
# 2) Sala 12: fundo e fecho de pasto nos Gerais e o avanço do agronegócio (Correntina, 2017).
# 3) Página inicial: "Dor e resistência", fio que atravessa as salas.
# 4) Correção: contagem das fotografias de 1912 (7 da Lapa + 1 trecho não identificado).
# Uso: python3 aplicar_quilombos_gerais.py <pasta do site>
import json, os, sys
P = sys.argv[1]
def rd(f): return open(os.path.join(P, f), encoding="utf-8").read()
def wr(f, s): open(os.path.join(P, f), "w", encoding="utf-8").write(s)
def once(s, old, new, label):
    n = s.count(old); assert n == 1, f"{label}: {n}"
    return s.replace(old, new)
J = lambda x: json.dumps(x, ensure_ascii=False)

TAB = {"titulo": "Comunidades quilombolas certificadas nos municípios à beira do São Francisco, de Pirapora a Juazeiro (Fundação Palmares, posição de 14 abr. 2025)", "colunas": ["Município", "Nº", "Comunidades certificadas", "O que se sabe"], "linhas": [["São Francisco (MG)", "7", "Buriti do Meio; Bom Jardim da Prata; Benedito Costa; Caraíbas II; Mestre Minervino/Angical; Florentino José dos Santos; Pena Branca", ""], ["Pedras de Maria da Cruz (MG)", "6", "Palmeirinha; Caraíbas e Ilha da Capivara; Riacho do Buriti; Jacarezinho; Rodeador; Morro do Chapéu e Riacho do Buriti", ""], ["Januária (MG)", "58", "Retiro dos Bois; Quebra Guiada; Alegre, Alegre II e Barreiro do Alegre; Balaieiro; Barreiro e Morro Vermelho; Buritizinho, Lambedouro e Onça (nome completo a conferir); Cabano, Pitombeiras e Vila Aparecida; Gameleira; Grotinha; Pasta Cavalo e Estância Nazaré; Picos; Pé da Serra; Riachinho; Riacho da Cruz, Água Viva e Caluzeiros; Varzea da Cruz; Croatá; Sangradouro Grande; Tatu; Ilha; Jatobá Novo; Macaúbas Capim Pubo; Riacho Novo (povoados Vila Padre Hebert e Lagoinha); Sítio Novo; Umburana; Casa Armada - Limeira; Lapão; Pau d'Óleo; Bom Jantar; Brejo do Amparo; Moradeiras; Nova Odessa; Tabúa; Levinópolis; Velho Chico; Bom Jardim; Campos; Fabião I e Vila Sebastião Lima; Fazenda Sítio; Retiro; Barra de Pindaibal; Barra do Tejuco; Barreirinho; Cochos/Sumidouro; Formosa; Lapa II do Tejuco; Marreca e Tanque; Novo Espaço; Ovo d'Ema; Quilombo; Sambaíba, Curral de Pedras e Mamede; Tejuco; Barreiro do Tejuco; Boa Vista do Tejuco; Fazenda Larga e Sussuarana; Passagem do Jatobá; Pedras de Sambaíba; Rua de Baixo; Tocantins", "Município com o maior número de comunidades certificadas do trecho."], ["Itacarambi (MG)", "1", "Cabaceiras", ""], ["Matias Cardoso (MG)", "2", "Lapinha; Praia", "Lapinha fica às margens do rio e se reconhece como vazanteira: reúne Vargem da Manga, Lapinha, Saco (Santa Efigênia) e Ilha da Ressaca, com cerca de 160 famílias. RTID publicado em 2015; decreto estadual de 2018 declarou a Fazenda Casa Grande de interesse para a titulação; há conflito com o IEF e o Parque Estadual Lagoa do Cajueiro."], ["Manga (MG)", "10", "Bebedouro; Brejo de São Caetano; Espinho; Ilha da Ingazeira; Justa I; Justa II; Malhadinha; Pedra Preta; Puris/Calindó; Vila Primavera", ""], ["Jaíba (MG)", "1", "Santa Luzia", ""], ["Carinhanha (BA)", "2", "Barra do Parateca; Estreito", ""], ["Malhada (BA)", "2", "Parateca e Pau d'Arco; Tomé Nunes", "Parateca e Pau d’Arco: 423 famílias e território de 41.780 ha reconhecido por portaria do Incra em dezembro de 2007, com cerca de 7.801 ha já titulados. Tomé Nunes foi avistada por Theodoro Sampaio em 1879."], ["Serra do Ramalho (BA)", "3", "Barreiro Grande; Água Fria; Pambú e Araçá", ""], ["Bom Jesus da Lapa (BA)", "10", "Araçá, Cariaca, Coxo, Retiro, Patos e Pedra; Juá e Bandeira; Lagoa do Peixe; Nova Batalhinha (também Malhada); Rio das Rãs (também Malhada e Riacho de Santana); Lagoa das Piranhas; Barrinha; Bebedouro; Fortaleza; Peroba", "Rio das Rãs: ver a cronologia acima. Rio das Rãs, Araçá-Volta, Bebedouro, Lagoa do Peixe e Nova Batalhinha estão no acordo judicial de abril de 2026 ligado à ferrovia FIOL."], ["Sítio do Mato (BA)", "1", "Barro Vermelho e Mangal", ""], ["Paratinga (BA)", "3", "Barro; Lagoa do Jacaré; Tomba", ""], ["Ibotirama (BA)", "1", "Saco Grande de Tixinha", ""], ["Muquém do São Francisco (BA)", "5", "Jatobá (também Brejolândia e Sítio do Mato); Boa Vista do Pixaim; Fazenda Grande; Pedrinhas; Brejo Seco", ""], ["Barra (BA)", "5", "Torrinha; Pedra Negra da Extrema; Curralinho; Igarité; Juá", ""], ["Xique-Xique (BA)", "2", "Vicentes; Ilha de Champrona", "Vicentes vive da pesca artesanal e da roça; em 2012 o MPF processou o Incra pela demora no relatório de identificação do território."], ["Itaguaçu da Bahia (BA)", "3", "Alegre e Barreiros; Alto Bebedouro; Cajueiro", ""], ["Remanso (BA)", "1", "Vila Nossa Senhora Aparecida", ""], ["Casa Nova (BA)", "1", "Lagoinha", ""], ["Juazeiro (BA)", "3", "Alagadiço; Barrinha da Conceição; Rodeadouro", ""], ["Pirapora, Buritizeiro, Ibiaí, Ponto Chique e São Romão (MG); Morpará, Pilão Arcado, Sento Sé e Sobradinho (BA)", "0", "Nenhuma comunidade certificada na planilha", ""]]}

QBLOCO = {"subtitulo": "Os quilombos da beira do rio, de Pirapora a Juazeiro",
 "texto": "Rio das Rãs e Tomé Nunes não estão sozinhos. Segundo a planilha da Fundação Cultural Palmares (posição de 14 de abril de 2025), há 127 comunidades quilombolas certificadas nos municípios que margeiam o São Francisco entre Pirapora e Juazeiro: 85 em Minas Gerais e 42 na Bahia. Nem todas ficam na beira do rio: a lista reúne as comunidades certificadas em cada município ribeirinho, e muitas estão no interior do município. Entre as que vivem do rio estão as vazanteiras, que plantam nas vazantes quando as águas baixam e pescam nas lagoas marginais, como Lapinha, em Matias Cardoso. A certificação é só o primeiro passo: na mesma planilha, só 9 das 127 têm alguma etapa do processo de titulação do Incra registrada, e apenas uma (Parateca e Pau d’Arco) aparece com titulação parcial.",
 "fonte": "Fundação Cultural Palmares, Comunidades certificadas (certidões expedidas), posição de 14 abr. 2025 · CPT-MG / ABA, Nota de apoio ao Quilombo Lapinha, 6 out. 2023 · CUT, Comunidade quilombola na BA é reconhecida pelo Incra, 20 dez. 2007 · Jornal Grande Bahia, MPF aciona Incra por comunidade quilombola em Xique-Xique, 30 nov. 2012.",
 "link": "https://www.gov.br/palmares/pt-br/acesso-a-informacao/dados-abertos",
 "verificacao": "verificado"}

GERAIS = {"subtitulo": "Os Gerais: fundo e fecho de pasto e o avanço do agronegócio",
 "texto": "Nos Gerais do oeste baiano, na outra margem dos grandes afluentes, vivem as comunidades de fundo e fecho de pasto. São famílias, muitas descendentes de indígenas e quilombolas, que há gerações usam terras em comum para criar animais soltos, colher frutos e remédios do Cerrado e da Caatinga e plantar roças; estima-se que sejam cerca de 1.500 na Bahia. Desde os anos 1970, com programas como o Prodecer e, depois, o MATOPIBA (2015), a fronteira da soja, do milho e do algodão avançou sobre essas terras soltas. O agronegócio trouxe produção e empregos, mas também grilagem com títulos falsos, a chamada “grilagem verde” (terras das comunidades registradas como reserva legal de fazendas) e poços de alta vazão no aquífero Urucuia. Em Correntina, na bacia do rio Corrente, que deságua no São Francisco logo abaixo da Lapa, a tensão explodiu em 2 de novembro de 2017: moradores destruíram equipamentos de irrigação de fazendas do grupo Igarashi, autorizadas pelo INEMA a captar 182.203 m³ de água por dia do rio Arrojado. Nove dias depois, cerca de 12 mil pessoas marcharam pela cidade em defesa das águas, segundo a Comissão Pastoral da Terra. O governo classificou os atos de 2 de novembro como criminosos, e a empresa afirma usar menos da metade do que foi autorizado. Na lei, as comunidades ganharam uma batalha: em 6 de setembro de 2023, o STF derrubou o prazo final que a Lei estadual 12.910/2013 impunha ao seu reconhecimento (ADI 5783).",
 "citacaoCurta": "“Um nome novo para uma forma de viver antiga.” — morador de comunidade de fundo e fecho de pasto, sobre a expressão, à Repórter Brasil (2018)",
 "fonte": "AATR, STF derruba marco temporal para comunidades de fundo e fecho de pasto na Bahia, set. 2023 (ADI 5783) · Mapa de Conflitos Fiocruz/ENSP, Comunidades tradicionais de Correntina lutam por direito à água · Repórter Brasil, Fundo e fecho de pasto da Bahia, 3 jul. 2018 · Lei estadual da Bahia 12.910, de 11 out. 2013.",
 "link": "https://mapadeconflitos.ensp.fiocruz.br/conflito/ba-comunidades-tradicionais-de-correntina-lutam-por-direito-a-agua-e-sobrevivencia/",
 "verificacao": "fonte-secundaria"}

DOR = {"rotulo": "Um fio que atravessa as salas",
 "titulo": "Dor e resistência no Velho Chico",
 "textos": [
  "A história do vale é de muito sofrimento: a conquista e o massacre dos povos indígenas, a escravidão, o remeiro empurrando a barca a força de braço, a seca, a malária, a doença de Chagas, o bócio, a violência dos coronéis, as famílias tiradas da terra por Sobradinho, a luta dos quilombos e das comunidades dos Gerais, os guardas da SUCAM adoecidos e, agora, o rio que seca.",
  "Mas o sofrimento quase nunca aparece sozinho. A romaria nasce dele: Francisco da Soledade acolheu na gruta enfermos, pobres e escravizados, e há mais de três séculos o sertão caminha até a Lapa para pedir e agradecer. As cantigas dos remeiros eram feitas para aguentar o trabalho, a Sala dos Milagres guarda dores atravessadas e os quilombos resistiram até ter a terra reconhecida.",
  "Por isso o museu não esconde a dor, para não trair a história, nem mostra só a dor, para não tirar do sertanejo a dignidade de quem resistiu. Em cada sala, conta a ferida e a resposta, e deixa falar quem viveu."
 ]}

s = rd("data-nucleos-4-6.js")
i = s.index('        titulo: "Quilombos do São Francisco",')
k = s.index('              ["2026", "Acordo judicial com MPF', i)
k2 = s.index('            ]\n          }\n        ],', k) + len('            ]\n          }')
s = s[:k2] + ',\n          ' + J(TAB) + s[k2:]
anc = '\n          }\n        ],\n        propostasSala: [\n          "Mapa das comunidades quilombolas certificadas no Médio São Francisco'
s = once(s, anc, '\n          },\n          ' + J(QBLOCO) + '\n        ],\n        propostasSala: [\n          "Mapa das comunidades quilombolas certificadas no Médio São Francisco', "bloco quilombos")
i = s.index('        titulo: "Economia: do curral à irrigação",')
k = s.index('        ],\n        propostasSala: [', i)
pre = s[:k].rstrip('\n').rstrip(',')
s = pre + ',\n          ' + J(GERAIS) + '\n' + s[k:]
s = once(s, "o museu reúne oito delas, de maio de 1912", "o museu reúne sete delas da Lapa, de maio de 1912, e uma de um trecho do rio não identificado", "fotos texto")
s = once(s, "As 8 fotografias de Bom Jesus da Lapa de maio de 1912", "As 7 fotografias de Bom Jesus da Lapa de maio de 1912", "fotos proposta")
s = once(s, "p. 5–50; 5 fotografias na Casa de Oswaldo Cruz / Fiocruz", "p. 5–50; 7 fotografias da Lapa na Casa de Oswaldo Cruz / Fiocruz", "fotos tabela")
wr("data-nucleos-4-6.js", s)

g = rd("data-geral.js")
g = once(g, '    porQueNaLapa:', '    doresResistencia: ' + J(DOR) + ',\n    porQueNaLapa:', "data-geral")
wr("data-geral.js", g)

a = rd("app.js")
bloco = r"""    // Section: Dor e resistência (fio transversal)
    var dr = ap.doresResistencia;
    if (dr) {
      html += '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">';
      html += '  <section class="surface-card rounded-xl bg-[#faf6ee] border-2 border-[#a86f25] p-6 sm:p-8 shadow-sm">';
      html += '    <span class="text-xs font-bold uppercase tracking-wider text-[#a86f25]">' + esc(dr.rotulo) + '</span>';
      html += '    <h2 class="font-serif-museu text-2xl sm:text-3xl font-bold text-[#1d3b53] mt-1">' + esc(dr.titulo) + '</h2>';
      (dr.textos || []).forEach(function (t) {
        html += '    <p class="text-base text-[#2b2620] mt-3 leading-relaxed max-w-4xl">' + esc(t) + '</p>';
      });
      html += '  </section>';
      html += '</div>';
    }

"""
a = once(a, "    // Section: Três Públicos (Regra 1) + Por que em Bom Jesus da Lapa\n", bloco + "    // Section: Três Públicos (Regra 1) + Por que em Bom Jesus da Lapa\n", "app.js")
wr("app.js", a)
print("OK")
