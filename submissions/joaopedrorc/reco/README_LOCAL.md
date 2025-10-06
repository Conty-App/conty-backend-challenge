# Desafio Conty – João Pedro Cordeiro / @joaopedrorc

> **Local da submissão:** `submissions/joaopedrorc/reco`

## Como rodar
- **Requisitos:** Docker (Recomendado) ou Node.js v22+ e pnpm.

### Rodando com Docker (Método Recomendado)
Este método garante um ambiente consistente e isolado, sem a necessidade de instalar Node.js ou `pnpm` localmente.

1.  **Iniciar o container:**
    Este comando irá construir a imagem na primeira vez e iniciar o servidor em modo de desenvolvimento com hot-reload.
    ```bash
    docker compose up --build
    ```
    O servidor estará rodando em `http://localhost:8080`.

2.  **Configurar o Banco de Dados (em outro terminal):**
    Com o container rodando, abra um segundo terminal e execute os seguintes comandos para criar e popular o banco de dados *dentro* do container.
    ```bash
    # Aplica o schema para criar as tabelas
    docker compose exec app pnpm db:push

    # Popula o banco com dados fictícios
    docker compose exec app pnpm db:seed
    ```

### Rodando Localmente
- **Requisitos:** Node.js v22+, pnpm.
- **Comandos:**
    1.  **Instalar dependências:**
        ```bash
        pnpm install
        ```
    2.  **Configurar o Banco de Dados:** O projeto usa SQLite. Este comando irá criar o banco e aplicar o schema.
        ```bash
        pnpm db:push
        ```
    3.  **Popular o Banco com Dados Fictícios:** Este comando executa o script de seeding.
        ```bash
        pnpm db:seed
        ```
    4.  **Iniciar o Servidor de Desenvolvimento:**
        ```bash
        pnpm dev
        ```
        O servidor estará rodando em `http://localhost:8080`.

- **Variáveis de Ambiente:** O projeto usa um arquivo `.env` para a porta do servidor e o caminho do arquivo de DB. Um `.env.example` está incluído como referência.
    ```env
    # Porta do servidor
    PORT=8080

    Caminho do arquivo do banco de dados SQLite utilizado pela aplicação. Exemplo:
    DATABASE_URL="file:./src/db/sqlite.db"
    ```

---
## Endpoints

### Recomendação de Criadores
Retorna um ranking de criadores com base nos critérios de uma campanha.

- **Endpoint:** `POST /recommendations`
- **Exemplo de Request (cURL):**
    ```bash
    curl -X POST http://localhost:8080/recommendations \
    -H "Content-Type: application/json" \
    -d '{
      "campaign": {
        "goal": "installs",
        "tags_required": ["fintech", "investimentos"],
        "audience_target": { "country": "BR", "age_range": [20,34] },
        "budget_cents": 5000000,
        "deadline": "2025-10-30"
      },
      "top_k": 5
    }'
    ```
- **Exemplo de Response:**
    ```json
    {
      "recommendations": [
        {
          "creator_id": "c789",
          "score": 0.82,
          "fit_breakdown": {
            "tags": 0.35,
            "audience_overlap": 0.25,
            "performance": 0.15,
            "budget_fit": 0.07
          },
          "why": "Matches tags like 'fintech'. Reliability: 90%. Audience in BR."
        }
      ],
      "metadata": {
        "total_creators": 51,
        "scoring_version": "1.0"
      }
    }
    ```

---
## Arquitetura

### Desenho das Camadas
O projeto segue uma arquitetura de camadas clássica para APIs, separando as responsabilidades para manter o código organizado e testável.

`Requisição HTTP` → `API (Routes)` → `Controller` → `Service (Lógica de Negócio)` → `ORM (Drizzle)` → `Banco de Dados (SQLite)`

1.  **API (Routes):** Define os endpoints (`/recommendations`) e direciona as requisições para o Controller apropriado.
2.  **Controller:** Atua como um intermediário. Extrai os dados da requisição (body, params) e chama os Serviços. É responsável por formatar e enviar a resposta HTTP.
3.  **Service:** Contém a lógica de negócio principal. Orquestra o processo de scoring, busca dados no banco e não tem conhecimento sobre HTTP.
4.  **ORM/DB:** A camada de acesso a dados, gerenciada pelo Drizzle ORM, que mapeia o schema TypeScript para tabelas SQL.

### Principais Decisões e Trade-offs
- **Stack Tecnológica:** Optei por uma stack moderna com TypeScript, Drizzle ORM, Vite e Vitest.
    - **Vantagem:** Performance superior em desenvolvimento (Vite), segurança de tipos (TypeScript) e um ORM moderno e performático (Drizzle).
    - **Trade-off:** Ferramentas mais recentes podem ter uma curva de aprendizado um pouco maior em comparação com stacks mais tradicionais como `ts-node` + `TypeORM`.
- **Banco de Dados:** Usei SQLite com o driver `@libsql/client` para simplificar a configuração local, eliminando a necessidade de um servidor de banco de dados externo.
    - **Vantagem:** Configuração zero, portabilidade e rapidez para desenvolvimento.
    - **Trade-off:** SQLite pode não ser ideal para cenários de alta concorrência em produção, onde um banco como PostgreSQL seria mais robusto.
- **Mapeamento de `snake_case`:** Decidi manter o `camelCase` internamente no código TypeScript e usar `snake_case` apenas no payload da API, criando uma função de mapeamento no Controller. Isso mantém o código interno consistente com as convenções do JavaScript.

### Modelo de Scoring: Pesos e Normalizações
O score final é uma média ponderada de cinco sub-scores, cada um normalizado para uma escala de 0 a 1.

**Fórmula:** `Score Final = (Score_Tags * 0.35) + (Score_Audiência * 0.25) + ...`

- **Tags (Peso: 0.35):**
    - **Regra:** Mede a relevância do conteúdo.
    - **Normalização:** Utiliza o **Índice de Jaccard**, que calcula a interseção sobre a união dos sets de tags da campanha e do criador. O resultado já é naturalmente um valor entre 0 e 1.

- **Aderência de Audiência (Peso: 0.25):**
    - **Regra:** Garante que a audiência do criador corresponde ao público-alvo.
    - **Normalização:** O país é um filtro (score 0 se não corresponder). A idade é normalizada dividindo o tamanho do intervalo de idade sobreposto pelo tamanho do intervalo de idade alvo da campanha.

- **Performance Histórica (Peso: 0.15):**
    - **Regra:** Recompensa criadores com bom desempenho histórico.
    - **Normalização:** Utiliza a técnica **Min-Max Scaling** sobre as métricas `avg_views` e `CTR`. Cada métrica é normalizada para uma escala de 0 a 1 com base nos valores mínimos e máximos de todos os criadores. O score final é a média simples desses valores normalizados.

- **Fit de Budget (Peso: 0.15):**
    - **Regra:** Verifica se o criador é financeiramente viável.
    - **Normalização:** Modelo binário simples. Retorna `1` se o preço mínimo do criador for menor ou igual ao orçamento da campanha, e `0` caso contrário.

- **Confiabilidade (Peso: 0.10):**
    - **Regra:** Mede o profissionalismo e a pontualidade.
    - **Normalização:** A pontuação é a porcentagem de `past_deals` entregues no prazo (`delivered_on_time`). Para criadores sem histórico, um valor padrão neutro de `0.75` é atribuído.

### O que faria diferente com mais tempo
- **Testes de Integração:** Adicionaria testes de integração que rodam contra um banco de dados de teste real para validar o fluxo completo da API.
- **Validação de Payload:** Implementaria uma biblioteca de validação robusta como Zod para validar o corpo das requisições na camada de Controller.
- **Modelo de Scoring Avançado:** Refinaria o scoring de "Fit de Budget" para usar uma escala contínua (criadores mais baratos recebem scores maiores) e implementaria as "Penalidades por Conflito".

---
## Testes
- **Como rodar:**
    ```bash
    pnpm test
    ```
---
## IA/Libraries
- **Onde usou IA:** Usei o Gemini e o Copilot como assistentes de desenvolvimento e autocomplete. Utilizados para refinar o modelo de scoring, sugerindo pesos mais adequados e métodos de comparação de dados validados estatisticamente. Otimização da geração de dados fictícios e na melhoria dos testes unitários.
- **O que é seu vs. de terceiros**: Fui responsável pela arquitetura e pelas decisões técnicas fundamentais do projeto. Defini a stack tecnológica, optando por Node.js com TypeScript pela sua robustez e ecossistema, Express.js pela flexibilidade na criação da API, e Drizzle ORM com SQLite para uma camada de dados moderna e de fácil configuração local.

    - Estruturei a aplicação seguindo o princípio da Separação de Responsabilidades (Separation of Concerns), dividindo o código em camadas distintas (API/Routes, Controllers, Services e Utils). Fui responsável por modelar o schema do banco de dados, desenhar a estrutura dos endpoints da API e implementar a lógica de negócio central.

    - De terceiros, utilizei as seguintes bibliotecas e frameworks de desenvolvimento que serviram como base para a construção da solução:

            Aplicação: Node.js, Express.js, TypeScript.

            Banco de Dados: Drizzle ORM, @libsql/client (para SQLite).

            Ambiente de Desenvolvimento e Build: Vite, vite-node, tsx.

            Testes: Vitest.

            Qualidade e Formatação de Código: ESLint, Prettier.

            Utilitários: pnpm (gerenciador de pacotes), dotenv, cors, @faker-js/faker.
