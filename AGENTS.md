# Museu do Médio São Francisco — site institucional e acervo digital

Regras permanentes deste projeto. Leia este arquivo inteiro antes de qualquer tarefa e siga-o em todas as respostas, planos e códigos.

## 1. O que estamos construindo

O site do **Museu do Médio São Francisco** (projeto conceitual, Bom Jesus da Lapa, Bahia; Instagram `@museudomediosaofrancisco`). É um museu que ainda não tem prédio: o site é a primeira sala aberta ao público. Ele deve:

- apresentar o projeto do museu e suas salas temáticas;
- reunir, com fonte e crédito, o material histórico do Médio São Francisco (viajantes, fotógrafos, mapas, documentos, literatura, memória oral);
- servir a três públicos: o morador e o romeiro (linguagem simples), o professor e o estudante (material de aula) e o pesquisador (fonte, data, localização do original).

Modelo de referência: a página de coleção do Instituto Moreira Salles (`ims.com.br/titular-colecao/marcel-gautherot/`). Inspire-se na **estrutura**, nunca copie marca, textos, imagens ou layout literal do IMS.

## 2. Idioma e tom

- Interface e textos em português do Brasil. Prever versão em inglês depois (estrutura i18n pronta, conteúdo só em pt-BR na v1).
- Frases curtas, voz ativa, sem jargão. Termo técnico só com explicação na primeira ocorrência.
- Citações de documentos antigos mantêm a grafia original entre aspas (“commissão”, “Joazeiro”). Trechos traduzidos levam a marca *(tradução livre)*.

## 3. Regras de conteúdo (as mais importantes)

1. **Nenhum fato sem fonte.** Todo item do acervo e todo texto histórico tem pelo menos uma fonte com autor, título, ano e, quando existir, link ou local do original.
2. **Status de verificação visível.** Cada item tem um campo `verificacao`: `verificado` (conferido no original), `fonte-secundaria` (citado por terceiros) ou `a-confirmar` (hipótese). Hipóteses aparecem com selo “a confirmar” e nunca como fato.
3. **Datas honestas.** Use “circa 1946” quando a data for aproximada, intervalos (“1879–1880”) quando houver, e diga quando as fontes divergem (ex.: criação da Serra do Ramalho em 1975 ou 1976).
4. **Direitos de imagem são regra de publicação, não detalhe.**
   - Só exibir no site imagens em **domínio público** ou com **licença aberta** (CC0, CC BY, CC BY-SA) ou com **licença escrita** do detentor.
   - Obras sob gestão de terceiros sem licença (ex.: fotografias de Marcel Gautherot, Acervo IMS; de Pierre Verger, Fundação Pierre Verger) **não são hospedadas**: o site mostra texto, ficha e link para o acervo do detentor.
   - Imagens recriadas ou alteradas com IA nunca entram no acervo. Se usadas em material de divulgação, levam o aviso “imagem recriada digitalmente, não é registro original”.
5. **Crédito em toda imagem**, no formato: `Autor, título, ano. Instituição/acervo. Licença.` Ex.: “Augusto Riedel, Bom Jesus da Lapa, 1868. Biblioteca Nacional / Library of Congress. Domínio público.”
6. **Pessoas e comunidades.** Comunidades quilombolas, indígenas e atingidos por barragens são citados pelo nome que usam para si. Depoimentos de memória oral só com termo de consentimento assinado; o site não publica dados pessoais além do que a pessoa autorizou.

## 4. Arquitetura da informação

Menu principal (v1):

- **O Museu**: apresentação, missão, as salas, equipe e apoiadores, como apoiar.
- **Salas**: uma página por sala temática (ver lista na seção 7).
- **Acervo**: busca e navegação por itens; páginas por **titular** (pessoa ou instituição autora de um conjunto: Burton, Halfeld, Theodoro Sampaio, Riedel, Wells, Spix e Martius, Gautherot, Mestre Guarany…).
- **Cidades do rio**: uma página por cidade, de Pirapora a Juazeiro/Petrolina, com o que cada autor escreveu sobre ela.
- **Linha do tempo**: eventos datados, filtráveis por tema.
- **Mapa**: cidades, itens e rotas de viajantes sobre o rio.
- **Pesquisa**: bibliografia, fontes primárias, onde estão os originais, como citar.
- **Participe**: “Conte sua história” (formulário de memória oral, moderado).

Acessibilidade e serviço em todas as páginas: link “Pular para o conteúdo”, alternância de alto contraste, seletor de idioma (desativado até haver tradução), rodapé com contato, atendimento ao pesquisador, política de privacidade e termos de uso.

## 5. Modelos de página

**Página de titular** (inspirada no IMS):
1. Cabeçalho com nome, datas de vida e resumo de 2–3 linhas + “Leia mais”.
2. Cronologia curta (4–8 marcos).
3. Galeria do que o museu pode mostrar, com três modos de visualização (lista, cards, blocos) e visualizador ampliado com setas, fechar e legenda completa (título, autor, descrição, local, data, crédito).
4. “Onde está o original”: instituição, link do acervo externo, como pedir reprodução.
5. Publicações e exposições relacionadas.
6. Conteúdo relacionado: salas, cidades e itens ligados.

**Página de item do acervo**: imagem (se permitida) ou ficha sem imagem; ficha técnica; texto curto; citação do original quando houver; fontes; selo de verificação; “como citar este item”.

**Página de cidade**: resumo, quadro “quem escreveu sobre a cidade” (autor, ano, trecho), itens do acervo ligados, posição no mapa.

**Página de sala**: tema, texto curatorial, itens-chave, perguntas para escolas.

## 6. Modelo de dados (fonte única de verdade)

Conteúdo em arquivos versionados no repositório (Markdown com frontmatter ou JSON). Nada de conteúdo preso em banco de dados na v1.

Coleções: `titulares`, `acervo`, `cidades`, `salas`, `linha-do-tempo`, `fontes`. Validar com schema e **falhar o build** se faltar `credito`, `licenca`, `verificacao` ou `fontes`, ou se `exibir_imagem: true` com `licenca: sem-licenca`.

## 7. Salas da v1

1. Geologia: um rio feito de um mar e de um deserto · 2. Fauna e flora · 3. Pré-história e arte rupestre · 4. Povos indígenas · 5. Conquista: Casa da Torre e Casa da Ponte · 6. Rio dos Currais e tropeiros · 7. Embarcações, carrancas, vapores e remeiros · 8. Viajantes, cientistas e fotografia · 9. Saúde e endemias · 10. A romaria do Bom Jesus da Lapa · 11. Quilombos · 12. Economia · 13. Poder e política · 14. Literatura, música e imagens · 15. Folclore · 16. Ferrovias e integração · 17. O rio que subiu: Sobradinho e a Serra do Ramalho · 18. Crise hídrica · 19. O futuro.

## 8. Pilha técnica

- **Astro** (site estático), TypeScript, Content Collections com schema; CSS próprio com variáveis (sem framework pesado).
- Busca no cliente sobre título, titular, cidade, tema e ano.
- Mapa com Leaflet + OpenStreetMap; dados em GeoJSON gerado das coleções.
- Imagens otimizadas, sempre com `alt` descritivo.
- Hospedagem estática (GitHub Pages, Netlify ou Cloudflare Pages). Sem rastreadores na v1.
- Formulário “Conte sua história”: serviço externo simples ou envio por e-mail, com aviso de privacidade (LGPD) e consentimento explícito.

## 9. Identidade visual

- Cores: azul-rio `#1d3b53`, ocre `#a86f25`, ouro claro `#c9a65b`, areia `#f3ead8`, texto `#2b2620`. Manter contraste AA.
- Tipografia: Source Serif 4 (títulos e textos) e Source Sans 3 (interface, legendas, rótulos).
- Muito espaço em branco, imagem em destaque, navegação discreta, como em acervos de fotografia. Nada de animações gratuitas.
- Assinatura em todas as páginas: “Museu do Médio São Francisco · Bom Jesus da Lapa, Bahia”.

## 10. Qualidade e acessibilidade

- WCAG 2.1 AA: navegação por teclado, foco visível, contraste, textos alternativos, títulos hierárquicos, `lang="pt-BR"`.
- Responsivo do celular (prioridade: o público acessa pelo telefone) ao desktop.
- Lighthouse ≥ 90 em desempenho, acessibilidade e boas práticas.
- Cada página tem metadados para compartilhamento (Open Graph) com crédito da imagem.

## 11. Como trabalhar neste repositório

- Antes de codar, apresente um plano curto e espere aprovação para mudanças grandes.
- Nunca invente conteúdo histórico, datas, nomes, citações ou links. Se faltar dado, crie o campo vazio e marque `verificacao: a-confirmar`.
- Nunca baixe nem hospede imagem sem verificar a licença; registre a licença no item.
- Commits pequenos, mensagens em português, uma mudança por commit.
- Ao terminar uma tarefa, liste o que foi feito, o que ficou pendente e como testar.
