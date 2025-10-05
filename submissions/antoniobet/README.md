Desafio Conty – Antonio Leandro / @antoniobet

Local da submissão: submissions/antoniobet/recommendations

Como rodar
Requisitos
Node.js 18+
npm ou yarn
Docker (opcional)
Comandos

Opção 1: Direto com Node.js

# Instalar dependências
npm install

# Configurar banco de dados e popular com dados de exemplo
npx prisma migrate deploy
npm run seed

# Iniciar aplicação em modo desenvolvimento
npm run start:dev

# Ou em modo produção
npm run build
npm run start:prod


Opção 2: Com Docker

# Subir aplicação + banco
docker compose up

# Ou com Makefile
make dev


A aplicação estará disponível em http://localhost:3000

Variáveis

Ver .env.example para configurações. Por padrão usa SQLite local (prisma/dev.db).

DATABASE_URL="file:./dev.db"
PORT=3000
LOG_LEVEL=log

Endpoints/CLI
POST /recommendations

Retorna ranking de criadores mais adequados para uma campanha.

Exemplo de requisição:

curl -X POST http://localhost:3000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "campaign": {
      "brand": "FinBank",
      "goal": "installs",
      "tags_required": ["fintech", "investimentos"],
      "audience_target": {
        "country": "BR",
        "age_range": [20, 34]
      },
      "budget_cents": 5000000,
      "deadline": "2025-11-15"
    },
    "top_k": 10
  }'


Resposta (200 OK):

{
  "recommendations": [
    {
      "creator_id": "clxxx123",
      "score": 0.8245,
      "fit_breakdown": {
        "tags": 0.8571,
        "audience": 0.9500,
        "performance": 0.7234,
        "budget": 1.0000,
        "reliability": 0.8500,
        "penalty": 0.0000
      },
      "why": "Fala de fintech, investimentos, tech; audiência BR 20–34; 145k views médias; CTR 3.2%, CVR 1.8%; confiabilidade 8.5/10; entregas no prazo 87%"
    }
  ],
  "metadata": {
    "total_creators": 120,
    "scoring_version": "2.0"
  }
}


Parâmetros:

campaign.brand (opcional): Nome da marca para detectar conflitos com concorrentes
campaign.goal: Objetivo da campanha (installs, engagement, sales, etc.)
campaign.tags_required: Tags obrigatórias do nicho
campaign.audience_target.country: País alvo (BR, US, MX, AR, PT)
campaign.audience_target.age_range: Faixa etária [min, max]
campaign.budget_cents: Orçamento em centavos
campaign.deadline: Data limite (ISO 8601)
top_k (opcional): Número de resultados (padrão: 10, máx: 50)
Arquitetura
Estrutura de camadas
src/
├── recommendations/
│   ├── dto/                          # Data Transfer Objects (validação)
│   │   └── create-recommendation.dto.ts
│   ├── scoring/                      # Motor de scoring
│   │   ├── normalization.util.ts     # Funções de normalização
│   │   ├── scoring.service.ts        # Lógica principal de pontuação
│   │   └── scoring.service.spec.ts   # Testes unitários
│   ├── utils/                        # Utilitários
│   │   └── json-fields.util.ts       # Parse de campos JSON
│   ├── recommendations.controller.ts # Endpoint HTTP
│   ├── recommendations.service.ts    # Orquestração e formatação
│   └── recommendations.module.ts     # Módulo NestJS
├── app.module.ts                     # Módulo raiz
└── main.ts                           # Entry point

Principais decisões
1. NestJS + TypeScript
Por quê: Estrutura modular, injeção de dependências nativa, validação automática com class-validator
Trade-off: Overhead maior que Express puro, mas ganho em manutenibilidade e testabilidade
2. SQLite com Prisma ORM
Por quê: Setup zero (sem Docker/Postgres obrigatório), migrations automáticas, type-safety
Trade-off: Menos performático que Postgres em produção, mas ideal para desenvolvimento/demo
3. Modelo de Scoring v2.0

Pesos distribuídos em 6 dimensões:

Dimensão	Peso	Descrição
Tags	30%	Similaridade Jaccard entre tags da campanha e do creator
Audiência	20%	Match de país (50%) + overlap de faixa etária (50%)
Performance	18%	Média normalizada de views, CTR e CVR
Budget	10%	Fit do orçamento com faixa de preço do creator
Confiabilidade	12%	60% histórico de entregas no prazo + 40% score base
Penalidades	-10%	Concorrentes recentes (90 dias) + saturação de nicho

Fórmulas principais:

Jaccard (tags): intersecção / união dos conjuntos de tags
Age overlap: max(0, min(maxA, maxB) - max(minA, minB)) / (maxA - minA)
Min-Max normalization: (valor - min) / (max - min) para views/CTR/CVR
Penalidade concorrente: 0.15 * num_deals_recentes (máx 0.5)
Penalidade saturação: 2 * (saturação - 0.1) se >10% creators têm mesmas tags
4. Idempotência e Confiabilidade
PastDeals: Histórico real de entregas no prazo sobrescreve reliabilityScore base
Detecção de conflitos: Compara campaign.brand com brands de deals recentes (90 dias)
Saturação de nicho: Penaliza creators em nichos super-populares (>10% da base)
Logs estruturados: Logger nativo do NestJS em todos os pontos críticos
O que faria diferente com mais tempo
Cache de resultados: Redis para cachear rankings de campanhas similares
Diversidade no ranking: Algoritmo MMR (Maximal Marginal Relevance) para evitar creators muito parecidos no top-10
Pesos dinâmicos: Ajustar pesos por campaign.goal (ex: performance pesa mais em "sales")
Testes E2E completos: Validar fluxo HTTP + DB com dados reais de múltiplos cenários
Observabilidade avançada: Winston/Pino para logs + Prometheus para métricas
Postgres em produção: Migrar de SQLite para melhor performance e concorrência
Testes
Como rodar
# Testes unitários (Jest)
npm run test

# Testes com coverage
npm run test:cov

# Testes E2E
npm run test:e2e

# Lint
npm run lint

Cobertura

✅ Testes unitários (scoring.service.spec.ts):

Cálculo de scores com múltiplos creators
Normalização de métricas (views, CTR, CVR)
Jaccard similarity e age overlap
Penalidades por concorrentes e saturação

✅ Testes E2E (recommendations.e2e-spec.ts):

POST /recommendations com payload válido
Validação de estrutura de resposta
Metadata (total_creators, scoring_version)

✅ Validação de DTOs:

class-validator garante tipos e ranges (ex: top_k entre 1-50)

Resultado esperado:

Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total

Logs

A aplicação usa o logger nativo do NestJS com saída estruturada.

Exemplos de logs:

// Request recebido
{
  "level": "log",
  "timestamp": "2025-10-05T14:32:10.123Z",
  "context": "RecommendationsController",
  "message": "Received POST /recommendations"
}

// Processamento
{
  "level": "log",
  "context": "RecommendationsService",
  "message": "Processing recommendation request",
  "goal": "installs",
  "tags": ["fintech", "investimentos"],
  "country": "BR",
  "budget_cents": 5000000,
  "top_k": 10
}

// Penalidades aplicadas
{
  "level": "warn",
  "context": "ScoringService",
  "message": "Penalties applied",
  "creators_with_penalties": 12,
  "total_creators": 120
}

// Resultado
{
  "level": "log",
  "context": "RecommendationsService",
  "message": "Recommendations generated successfully",
  "returned": 10,
  "top_score": "0.8245",
  "bottom_score": "0.6123"
}


Níveis de log:

LOG: Operações normais (requests, resultados)
WARN: Penalidades aplicadas, poucos resultados
ERROR: Falhas de validação, erros de DB

Configuração: Ajuste em main.ts ou via variável LOG_LEVEL no .env

IA/Libraries
Onde usei IA
Implementação das fórmulas de scoring (Jaccard, age overlap, normalizações)
Lógica de penalidades (concorrentes + saturação)
Testes unitários e E2E (refinamento)
Este README (estrutura e exemplos)


O que é meu vs. de terceiros

(escrito por mim):

Decisões de arquitetura (camadas, separação de responsabilidades)
Ajustes finos nos pesos do scoring
Lógica de negócio específica (ex: penalidade de 0.15 por deal concorrente)
Debugging e ajustes após testes manuais
Validações e edge cases (ex: creators sem histórico)
Configuração de Docker
Sistema de logging estruturado
Estrutura dos testes (describe/it blocks)


IA-assisted:

Boilerplate NestJS (decorators, injeção de dependências)
Implementação das fórmulas matemáticas
Criação do Sistema de scoring
Refino dos testes
lógica de penalidades
Configuração do Makefile

Criação do Readme

Bibliotecas de terceiros:

NestJS (@nestjs/common, @nestjs/platform-express): Framework
Prisma (@prisma/client): ORM + migrations
class-validator + class-transformer: Validação de DTOs
Jest: Testes unitários e E2E
TypeScript: Type safety