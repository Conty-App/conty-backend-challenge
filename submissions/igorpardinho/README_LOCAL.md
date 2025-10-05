# Desafio Conty – Igor Pardinho / @igorpardinho

> **Local da submissão:** `submissions/igorpardinho/pix`

## Como rodar

- **Requisitos:** Docker e Docker Compose, Node.js >= 20
- **Variáveis de ambiente:** veja `.env.example`
- **Comandos:**

  ```bash
  # sobe containers, cria DB e roda migrations automaticamente
  docker compose up -d

  # rodar migrations manualmente (opcional)
  docker compose exec pix_service npx knex migrate:latest

  # rodar testes unitários
  docker compose exec pix_service npx vitest run
  ```

## Endpoints/CLI

- POST /payouts/batch

## Recebe JSON no formato

```json
{
  "batch_id": "2025-10-05-A",
  "items": [
    { "external_id": "u1-001", "user_id": "u1", "amount_cents": 35000, "pix_key": "u1@email.com" },
    { "external_id": "u2-002", "user_id": "u2", "amount_cents": 120000, "pix_key": "+55 11 91234-5678" }
  ]
}
```

## Resposta

```json

{
  "batch_id": "2025-10-05-A",
  "processed": 2,
  "successful": 2,
  "failed": 0,
  "duplicates": 0,
  "details": [
    {"external_id": "u1-001", "status": "paid", "amount_cents": 35000},
    {"external_id": "u2-002", "status": "paid", "amount_cents": 120000}
  ]
}
```

````md
- Idempotência: repetir o mesmo external_id não cria pagamento duplicado, apenas marca como duplicate.

Exemplo cURL:
curl -X POST http://localhost:8080/payouts/batch \
  -H "content-type: application/json" \
  --data @seeds/payouts_batch_example.json


# Arquitetura

### Camadas
 - services/payoutService.ts: lógica de liquidação de batch com idempotência

 - database/connection.ts: configuração do Knex/PostgreSQL
 
 - schemas/payoutSchemas.ts: tipos TypeScript(com zod) para entradas e saídas

 - routes/payout.ts: endpoint da aplicação

 ### Decisões e trade-offs

  - Usei PostgreSQL real para simular idempotência e persistência

  - Simulação de falha com 5% de chance para demonstrar failed

 - .onConflict("external_id") garante que pagamentos repetidos não são duplicados

 - Tempo de execução baixo, sem filas, porque era um desafio rápido

 - Usei node com fastify, em comparação com o go posso ter perdido desempenho(usei um queryBuilder ao inves de orm para tentar compensar).

### O que faria diferente com mais tempo

 - Implementaria filas (RabbitMQ/Kafka) para batch grande
 - Implementaria observabilidade (openthelemetry) para ter uma visão geral das rotas, não só essa como futuras
 - Validaria melhor os dados de pix_key (CPF, email, celular)

## IA/Libraries
- usei IA principalmente para tirar duvidas de sintaxe e do SQL CASE, usei para ajudar a gerar o readme e ajudar a gerar os testes.
- de lib usei o zod para validação de input, knex como querybuilder,vite pra testes, fastify como framework.

## Testes
- Vitest

- Comandos: npx vitest run ou dentro do container

- Cobertura:

- Processamento de batch (paid e failed)

- Idempotência (duplicate)

- Contagem de pagos/falhos/duplicados

- Testes unitários estão em tests/payoutService.spec.ts e tests/payoutRoute.spec.ts
