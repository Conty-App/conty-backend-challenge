# Desafio Conty – Ana Beatriz Santucci Carmoni / @ABeatrizSC

> **Local da submissão:** `submissions/abeatrizsc/reco`

## Estrutura do projeto
### Arquitetura
![fluxograma da arquitetura](./docs/images/conty_backend_challenge_structure.png)

### Principais decisões e trade‑offs
1. **Arquitetura de 3 camadas**: Estruturar a aplicação em camadas (`controller`, `service`, `repository`) mantém uma melhor organização e facilita manutenções posteriores no código. Apesar do leve aumento na estrutura de pastas por conta da arquitetura, sua clareza e simplicidade compensam;  

2. **Fastify**: O desafio tem como critério desempenho e simplicidade, supridos facilmente através do Fastify. Ele é conhecido por ser um dos frameworks com melhor performance do ecossistema Node.js (significativamente maior que o Express), além de possuir validação integrada, suporte nativo ao TypeScript e integração direta ao Swagger;

3. **Swagger**: Foi utilizado o Swagger para geração automática da documentação da API, permitindo maior organização, visualização e padronização dos endpoints registrados;

4. **Prisma ORM**: Para facilitar a interação com o banco de dados, aumentando consequentemente a produtividade;

5. **Vitest**: Levando em conta mais uma vez desempenho e simplicidade, o framework Vitest garante maior rapidez nos testes. 

### O que faria diferente com mais tempo
1. **SQL mais performático para busca inicial**: Tentaria otimizar a consulta SQL responsável pela busca inicial de criadores, garantindo uma recuperação mais eficiente de dados para cálculo do Score. No momento, apenas é checado se o budget da campanha é maior que o preço mínimo exigido por um criador;

2. **Testes de integração e End-to-End (E2E)**: Implementaria testes para validar todo o fluxo da aplicação e suas integrações;

3. **Implementação de penalidades e diversidades**: Atualmente, o projeto aplica a penalidade de -0.20 pontos no score de um criador se o valor do seu `reliability_score` for menor que 0.75, e o campo `diversity` é ignorado. Com mais tempo, desenvolveria uma lógica mais completa para aplicação de penalidades e utilizaria o campo `diversity` para também refletir nas recomendações;

4. **Melhoria na estrutura do campo `audience_location`**: Como os dados são fictícios, ao possuir audiência na localização da campanha, o cálculo de representatividade por país é feito de forma simplificada:
```js
(1 / creator.audience_location.length) * 100
```
Para maior precisão, adotaria uma estrutura mais realista, incluindo a porcentagem de audiência por país:
```json
"audience_location": [
  { "country": "BR", "percentage": 0.65 },
  { "country": "PT", "percentage": 0.35 }
]
```

5. **Implementação de logs e observabilidade**: Adicionaria logs estruturados (por exemplo, com pino ou winston) para melhor rastreabilidade e monitoramento da aplicação;

6. **Atribuição dinâmica de pesos**: Atualmente, os pesos são fixos. Com mais tempo, permitiria definir dinamicamente os pesos de cada fator (tags, orçamento, audiência etc.) conforme os parâmetros da requisição;

7. **Validações de constantes**: Implementaria validações para os valores de `TAGS`, `BRANDS`, `COUNTRIES`, `GOALS` para garantir que são valores aceitos. Também criaria endpoints para adicionar novos valores.

8. **Scoring**: Implementaria a lógica de `scoring_version`, que no momento se encontra estático.

9. **Past Deals e Campaign**: Não foram utilizados dados diretamente das entidades por conta de ter sido gerado dados fictícios, porém com mais tempo utilizaria para validações e para também refletir no histórico de desempenho dos criadores.

10. **Outras melhorias de performance**: Pensando no ambiente real de produção, pesquisaria e aplicaria algoritmos mais eficientes para cálculo e ranqueamento, além de implementar um sistema de cache para armazenar resultados de recomendações ou consultas de criadores mais acessados, reduzindo chamadas ao banco e melhorando o tempo de resposta.

### Pesos e normalizações
#### Scoring
- A aplicação de pesos ao Scoring foi dado da seguinte forma:

```js
const weights = {
  tags: 0.30,
  audience_overlap: 0.30,
  performance: 0.25,
  budget_fit: 0.15
};
```

#### Performance
- Para normalização e peso no cálculo de Performance:
```js
  const maxViews = Math.max(...creators.map(c => c.avg_views));
  const maxCtr = Math.max(...creators.map(c => c.ctr));
  const maxCvr = Math.max(...creators.map(c => c.cvr));

  const viewsScore = avgViews / maxViews;
  const ctrScore = ctr / maxCtr;
  const cvrScore = cvr / maxCvr;

  const performance = (viewsScore * 0.4) + (ctrScore * 0.3) + (cvrScore * 0.3);
```

#### Audience
- Para cálculo de Audience Fit, tanto `countryFit` (1 se o criador tem público no páis exigido, senão 0) e `ageFit` (sobreposição entre as faixas etárias do público do creator e da campaign), têm peso igual (0.5).

```js
  const hasCampaignCountry = creator.audience_location.includes(campaign.country);

  const countryFit = hasCampaignCountry ? 1 : 0;
  const countryFitPercentage = hasCampaignCountry ? (1 / creator.audience_location.length) * 100 : 0;

  const [campaignMinAge, campaignMaxAge] = campaign.age_range;
  const [creatorMinAge, creatorMaxAge] = creator.audience_age;

  const minAgeOverlap = Math.max(creatorMinAge, campaignMinAge);
  const maxAgeOverlap = Math.min(creatorMaxAge, campaignMaxAge);
  const ageOverlap =  maxAgeOverlap - minAgeOverlap;

  const ageFit = ageOverlap > 0 ? ageOverlap / (campaignMaxAge - campaignMinAge) : 0;

  const audienceOverlap = countryFit * 0.5 + ageFit * 0.5; 
```

## Tecnologias utilizadas
- **TypeScript**: Superset do JavaScript que adiciona tipagem estática, aumentando a robustez e previsibilidade do código.

- **Node.js**: Ambiente de execução JavaScript no lado do servidor, utilizado como base para toda a aplicação.

- **Fastify**: Framework web rápido e eficiente para criação de APIs com Node.js.

- **Prisma**: ORM moderno para Node.js que facilita a modelagem, migração e acesso ao banco de dados.

- **Zod**: Biblioteca de validação e tipagem de dados, garantindo segurança e consistência nas entradas da API.

- **Swagger (Fastify Swagger & Swagger UI)**: Ferramenta para documentação automática e interativa da API.

- **Dotenv**: Gerencia variáveis de ambiente de forma segura através de um arquivo .env.

- **Vitest**: Framework de testes rápido e simples, compatível com o ecossistema TypeScript.

- **PostgreSQL**: Banco de dados relacional robusto, de código aberto, utilizado para armazenar e gerenciar dados de forma estruturada e eficiente.

- **Docker**: Plataforma de containers que permite empacotar, distribuir e executar aplicativos de forma isolada e consistente em diferentes ambientes.

## Como rodar
### Requisitos
- Docker
- Git

### Variáveis de ambiente
- Crie um .env na raiz do projeto, contendo as seguintes variáveis:
 ```env
PORT=3333
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=conty_challenge_db
DATABASE_URL=postgresql://postgres:postgres@postgres-node-db:5432/conty_challenge_db?schema=public
 ```

### Comandos
- OBS: Comandos válidos para **esta pasta**: `submissions/abeatrizsc/reco`

 ```bash
docker-compose up --build
 ```

## Endpoints
- Para a documentação completa dos endpoints, acesse através do Swagger em `localhost:${PORT}/api/v1/docs`.

### Recommendation
#### **POST** `/api/v1/recommendations`
- Dada uma campanha (briefing, orçamento, requisitos) e uma base de criadores (tags, estatísticas, histórico), retorne uma classificação adequada dos criadores com justificativas legíveis.

#### Request Body
- `RecommendationRequestDto`:

```json
{
  "campaign": {
    "goal": "installs",
    "tags_required": ["fintech", "investimentos"],
    "audience_target": { "country": "BR", "age_range": [20,34] },
    "budget_cents": 5000000,
    "deadline": "2025-10-30"
  },
  "top_k": 20,
  "diversity": true
}
```

#### Success Response Body
- `200` : `RecommendationResponseDto`:

```json
{
  "recommendations": [
    {
      "creator_id": "5307...",
      "score": 0.75,
      "fit_breakdown": {
        "tags": 1,
        "audience_overlap": 0.39,
        "performance": 0.75,
        "budget_fit": 1
      },
      "why": "Fala sobre fintech, investimentos; Alta confiabilidade (0.94% de entregas pontuais)"
    },
    {
      "creator_id": "7015...",
      "score": 0.73,
      "fit_breakdown": {
        "tags": 1,
        "audience_overlap": 0.89,
        "performance": 0.85,
        "budget_fit": 1
      },
      "why": "Fala sobre fintech, investimentos; 50% audiência BR 23–34"
    },
    //...
  ]
}
```
---

## Testes
### Como rodar 
```bash
npm run test
```
![Print da execução dos testes](./docs/images/npm_run_test_screenshot.jpg)

### Coverage
- Ao rodar o comando abaixo, gera-se um relatório que mostra a cobertura dos testes

```bash
npx vitest run --coverage
```

Exemplo de saída (Obtido através da própria aplicação):

File                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------------|---------|----------|---------|---------|-------------------
 src/lib                       |     100 |      100 |     100 |     100 | 
  prisma.ts                    |     100 |      100 |     100 |     100 | 
 src/repositories              |      40 |      100 |       0 |      40 | 
  creator.repository.ts        |      40 |      100 |       0 |      40 | 5-10
 src/services                  |   98.38 |      100 |   85.71 |   98.38 |                   
  creator.service.ts           |   66.66 |      100 |       0 |   66.66 | 6-7
  recommendation.service.ts    |     100 |      100 |     100 |     100 | 

## IA/Libraries
Durante o desenvolvimento deste projeto, utilizei IA (ChatGPT) como ferramenta de **apoio** para:

- Obter sugestões de estrutura de código e boas práticas com Node.js e Fastify;

- Gerar o `seed.ts` para criação de exemplos de dados fictícios com o Fakerjs, populando de forma eficiente o banco;

- Auxiliar na formatação da validação de esquemas Zod, criação de eficientes fórmulas matemáticas através do código e auxílio na geração de pequenas descrições às tecnologias utilizadas e testes.