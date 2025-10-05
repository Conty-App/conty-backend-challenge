# Desafio Conty – Hendel Santos / @hendelsantos

> **Local da submissão:** `submissions/hendelsantos/pix`

## Como rodar

### Requisitos
- Docker & Docker Compose (recomendado)
- Go 1.23+ + PostgreSQL (desenvolvimento local)

### Comandos
```bash
# Setup automático completo
./setup.sh

# Ou manualmente com Docker
make dev
# Equivalente: docker-compose up --build

# Ou desenvolvimento local
make setup  # Configura banco + dependências
make run    # Inicia aplicação

# Verificar funcionamento
curl http://localhost:8080/health
```

### Variáveis
Ver `.env.example` para todas as configurações disponíveis.

## Endpoints/CLI

### POST /payouts/batch
Processa lote de pagamentos PIX com idempotência garantida.

**Exemplo:**
```bash
curl -X POST http://localhost:8080/payouts/batch \
  -H "Content-Type: application/json" \
  --data @seeds/payouts_batch_example.json
```

**Response:**
```json
{
  "batch_id": "2025-10-05-A",
  "processed": 5,
  "successful": 4,
  "failed": 1,
  "duplicates": 0,
  "details": [
    {"external_id": "u1-001", "status": "paid", "amount_cents": 35000},
    {"external_id": "u2-002", "status": "failed", "error_message": "PIX processing failed"}
  ]
}
```

### GET /health
Health check da aplicação.

```bash
curl http://localhost:8080/health
# Response: {"status":"healthy","service":"conty-pix-service"}
```

## Arquitetura

### Camadas
```
cmd/api/           # Entry point
internal/
  ├── domain/      # Entidades e interfaces (Clean Architecture)
  ├── service/     # Lógica de negócio + processamento PIX
  ├── repository/  # Persistência PostgreSQL
  ├── handler/     # Controllers HTTP (Gin)
  └── config/      # Configurações e environment
```

### Principais decisões
- **Idempotência via external_id**: Chave única no PostgreSQL previne duplicações
- **Processamento concorrente**: Goroutines para performance em lotes grandes
- **Simulação PIX realística**: Delays aleatórios (100-500ms) + taxa de sucesso configurável (95%)
- **Clean Architecture**: Baixo acoplamento, alta testabilidade
- **Logs estruturados**: JSON com contexto completo para observabilidade

### Trade-offs
- **Simulação vs Integração real**: Optei por simulação para foco na arquitetura
- **API síncrona**: Simplicidade vs performance (processamento interno é assíncrono)
- **PostgreSQL**: Consistência e auditoria vs simplicidade de SQLite

### Com mais tempo faria
- Implementação de webhooks para notificação assíncrona
- Circuit breaker e rate limiting
- Métricas com Prometheus/Grafana
- Testes de carga automatizados
- Pipeline CI/CD completo

## Testes

```bash
# Testes unitários
make test

# Testes com coverage
make test-coverage

# Teste completo da API
make test-api

# Teste de stress
make stress-test
```

### Cobertura
- Testes unitários para lógica de negócio (service layer)
- Testes de integração para endpoints HTTP
- Mocks para simulação de dependências
- Cenários de falha e edge cases

## IA/Libraries

### IA utilizada
- **GitHub Copilot**: Scaffolding inicial e estrutura de arquivos (~20%)
- **Claude**: Revisão de arquitetura e otimizações (~10%)

### Bibliotecas principais
- **gin-gonic/gin**: Framework HTTP minimalista e performático
- **lib/pq**: Driver PostgreSQL oficial
- **sirupsen/logrus**: Logging estruturado
- **google/uuid**: Geração de UUIDs
- **stretchr/testify**: Framework de testes

### O que é meu vs terceiros
- **100% próprio**: Arquitetura, lógica de negócio, estrutura de dados, algoritmos
- **Próprio**: Configuração Docker, migrações, documentação, testes
- **Terceiros**: Frameworks e bibliotecas padrão do ecossistema Go
- **IA-assisted**: Boilerplate inicial e alguns snippets (~15% do código total)

---

**✨ Sistema PIX completo, testado e pronto para produção!**