# Desafio Conty – PIX Batch Payments

> **Submissão:** `submissions/luizcastro/`

## Como rodar

### Requisitos
- [Bun](https://bun.sh) >= 1.0 **ou** Docker

### Sem Docker
```bash
cd submissions/luizcastro
bun install
bun run start        # porta 8080
bun run dev          # modo watch
```

### Com Docker
```bash
cd submissions/luizcastro
docker compose up --build
```

## Endpoints

### `POST /payouts/batch`

Processa um lote de pagamentos PIX de forma idempotente.

**Request:**
```bash
curl -X POST http://localhost:8080/payouts/batch \
  -H "content-type: application/json" \
  --data @seed_examples/payouts_batch_example.json
```

**Body:**
```json
{
  "batch_id": "2025-10-05-A",
  "items": [
    { "external_id": "u1-001", "user_id": "u1", "amount_cents": 35000, "pix_key": "u1@email.com" },
    { "external_id": "u2-002", "user_id": "u2", "amount_cents": 120000, "pix_key": "+55 11 91234-5678" }
  ]
}
```

**Response:**
```json
{
  "batch_id": "2025-10-05-A",
  "processed": 2,
  "successful": 2,
  "failed": 0,
  "duplicates": 0,
  "details": [
    { "external_id": "u1-001", "status": "paid", "amount_cents": 35000 },
    { "external_id": "u2-002", "status": "paid", "amount_cents": 120000 }
  ]
}
```

Repetir a mesma chamada retorna `"duplicates": 2` e `"successful": 0` — garantia de idempotência.

## Arquitetura

```
src/
├── index.ts              # Entrypoint — servidor Elysia na porta 8080
├── routes/payouts.ts     # Rota POST /payouts/batch com validação de schema
├── services/payout.service.ts  # Lógica de processamento do lote
├── store/payment.store.ts      # Store em memória (Map) para idempotência
├── types/payout.types.ts       # Tipos TypeScript
└── utils/pix-simulator.ts      # Simulação de liquidação PIX
```

### Decisões

- **Elysia.js**: Framework leve e tipado, perfeito para Bun. Validação de schema integrada via TypeBox.
- **Persistência em memória (Map)**: Suficiente para o escopo do desafio. Em produção, usaria PostgreSQL com unique constraint no `external_id`.
- **Idempotência via `external_id`**: Cada pagamento processado é armazenado no Map. Chamadas repetidas retornam `duplicate` sem reprocessar.
- **Simulação PIX**: Delay aleatório (50-200ms) com ~90% de sucesso para simular um cenário realista.

### Trade-offs e melhorias com mais tempo

- **Persistência**: Migraria para PostgreSQL com unique constraint + transaction isolation.
- **Concorrência**: Adicionaria mutex por `external_id` para evitar race conditions em requests simultâneos.
- **Retry**: Implementaria retry automático para pagamentos falhos com backoff exponencial.
- **Observabilidade**: Structured logging, métricas (Prometheus) e tracing.
- **Webhook**: Notificação assíncrona do status do batch via callback URL.

## Testes

```bash
bun test
```

Cobertura:
- Processamento de batch (contagens corretas)
- Idempotência (duplicatas não reprocessam)
- Mix de itens novos e duplicados
- Batch vazio
- Preservação de valores
- Validação de schema na rota (422 para body inválido)
- Idempotência via rota HTTP

## IA/Libraries

- **Elysia.js**: Framework HTTP
- **Bun**: Runtime e test runner
- **Claude Code**: Utilizado para auxiliar na implementação
