#!/usr/bin/env python3
# Varredura de conflitos e informações sem fonte (5 nov. 2026).
# Rode DEPOIS dos scripts aplicar_pertencimento, aplicar_socioambiental e aplicar_quilombos_gerais.
# Uso: python3 aplicar_varredura.py <pasta do site>
import glob, os, sys
P = sys.argv[1]
R = [
 # nome do museu
 ("Museu do Rio São Francisco — Projeto Conceitual", "Museu do Médio São Francisco — Projeto Conceitual"),
 # filme de Nutels: harmoniza com a correção anterior
 ("O mais antigo material em imagem em movimento encontrado sobre Bom Jesus da Lapa", "Um dos mais antigos registros em filme conhecidos sobre Bom Jesus da Lapa"),
 ("o mais antigo material em movimento encontrado sobre a Lapa", "um dos mais antigos registros em filme conhecidos sobre a Lapa"),
 # Lutz não fez levantamento parasitológico da Lapa (diário: "a patologia do lugar não oferecia interesse especial")
 ("e o primeiro levantamento parasitológico de Bom Jesus da Lapa", "e anotações sobre as doenças e os barbeiros de Bom Jesus da Lapa"),
 # Sobradinho: obras desde 1972, mas o lago só começou a encher em dezembro de 1976
 ("cobertas pelas águas da barragem de Sobradinho entre 1972 e 1978?", "cobertas pelas águas da barragem de Sobradinho, cujo lago começou a encher em dezembro de 1976?"),
 ("cobertos entre 1972 e 1978 pelo reservatório", "cobertos a partir de dezembro de 1976 pelo reservatório"),
 ("cobertas pelo lago de Sobradinho em 1977–1978", "cobertas pelo lago de Sobradinho, que encheu entre dezembro de 1976 e 1978"),
 # Itaparica (Luiz Gonzaga): obras iniciadas em 1979
 ("cujas obras começaram em 1977", "cujas obras começaram em 1979"),
 # distância Lapa–Pirapora: duas cifras diferentes no site
 ("A 620 km de Pirapora;", "A cerca de 630 km de Pirapora pelo rio (634 km no diário de Lutz, 1912);"),
 # altura do morro: estimativa de Lutz x medição de Halfeld
 ("estimaram-lhe entre 100 e 150 metros", "estimaram-lhe entre 100 e 150 metros (Halfeld medira de 70 a 88 m)"),
 # incêndio de 1903: sem fonte localizada
 ("nove anos após o incêndio de 1903.", "nove anos após o incêndio de 1903 (data a confirmar)."),
 ("anteriores ao incêndio de 1903", "anteriores ao incêndio de 1903 (data a confirmar)"),
]
files = glob.glob(os.path.join(P, "*.js")) + glob.glob(os.path.join(P, "*.html")) + glob.glob(os.path.join(P, "content", "**", "*.json"), recursive=True)
tot = {o: 0 for o, _ in R}
for f in files:
    s = open(f, encoding="utf-8").read(); t = s
    for o, n in R:
        c = t.count(o)
        if c: tot[o] += c; t = t.replace(o, n)
    if t != s: open(f, "w", encoding="utf-8").write(t)
falt = [o for o, c in tot.items() if c == 0]
assert not falt, "não encontrado: " + " | ".join(falt)
print("OK")
