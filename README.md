# Museu do Médio São Francisco

Site institucional e acervo digital do **Museu do Médio São Francisco** (Bom Jesus da Lapa, Bahia).

> O site é a primeira sala aberta ao público do museu, reunindo acervo histórico, salas temáticas, cidades ribeirinhas, linha do tempo interativa e cartografia do Rio São Francisco.

## 🏛️ Estrutura do Projeto

- `index.html`: Interface principal da aplicação.
- `styles.css`: Folha de estilos e identidade visual.
- `app.js`: Lógica de interface, filtros, busca e renderização dos módulos.
- `data-*.js`: Bases de dados de núcleos expositivos, acervo e itens complementares.
- `content/`: Arquivos estruturados em JSON e GeoJSON (cidades, linha do tempo, acervo, mapa, titulares).
- `assets/`: Imagens, iconografia e materiais visuais.
- `AGENTS.md`: Diretrizes curatoriais, de conteúdo, direitos de imagem e normas do projeto.

## 🚀 Como Executar

Por ser uma aplicação web estática, basta abrir o arquivo `index.html` em qualquer navegador web ou servi-lo localmente:

```bash
# Usando Python 3
python3 -m http.server 8000
```

Acesse em `http://localhost:8000`.
