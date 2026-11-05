#!/usr/bin/env python3
# Sala 9: Wells, 1875 — "um círculo de mosquitos eternos" que faltou ao Inferno de Dante.
# Uso: python3 aplicar_wells_dante.py <pasta do site>
import json, os, sys
P = sys.argv[1]
f = os.path.join(P, "data-nucleos-4-6.js")
s = open(f, encoding="utf-8").read()
b = {"subtitulo": "Um círculo que faltou ao Inferno de Dante: os mosquitos de Wells (1875)",
 "texto": "Em janeiro de 1875, no meio da grande cheia, o engenheiro inglês James W. Wells deixou Bom Jesus da Lapa descendo o rio numa balsa de canoas. O barômetro anunciou temporal, e o piloto abrigou a embarcação numa enseada, na boca de um riacho, poucas milhas abaixo. Veio a tempestade e, com ela, nuvens de mosquitos que o vento espantava e que voltavam em seguida; o mosquiteiro, escreveu, parecia mais uma armadilha para prendê-los do que para afastá-los. Só de madrugada puderam seguir viagem, rumo a Sítio do Mato. Wells não sabia, mas aquele mosquito era o transmissor das “carneiradas”, as febres que Halfeld já registrara no trecho.",
 "citacaoCurta": "“É pena que Dante não tenha conhecido o São Francisco na estação das chuvas: um círculo de mosquitos eternos teria sido muito mais torturante do que os seus fornos e outras agradáveis invenções para ‘esquentar as coisas’ para a pobre humanidade.” — James W. Wells, 1886, vol. II, p. 42 (tradução livre)",
 "fonte": "Wells, J. W. Exploring and travelling three thousand miles through Brazil, vol. II. Londres: Sampson Low, 1886, p. 41–43 (“A ‘dirty’ night”).",
 "link": "https://archive.org/details/exploringtravel02well",
 "verificacao": "verificado"}
anc = '{"subtitulo": "A guerra ao mosquito'
assert s.count(anc) == 1, "bloco da SUCAM não encontrado na Sala 9"
s = s.replace(anc, json.dumps(b, ensure_ascii=False) + ',\n          ' + anc)
open(f, "w", encoding="utf-8").write(s)
print("OK")
