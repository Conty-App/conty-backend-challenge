# PIX Batch Payments — Arquitetura

## Fluxo Principal

```
┌──────────────────────────────────────────────────────────────────┐
│  Client                                                          │
│  POST /payouts/batch  { batch_id, items[] }                      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Elysia Route                                                    │
│  Validação de schema via TypeBox                                 │
│  batch_id: string, items: { external_id, user_id,               │
│  amount_cents, pix_key }[]                                       │
│                                                  ❌ 422 invalid  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ ✅ válido
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Payout Service — Separação                                      │
│                                                                  │
│  Para cada item, consulta o Map por external_id:                 │
│                                                                  │
│    ┌─────────────────────┐     ┌──────────────────────────┐      │
│    │ Já existe no Map?   │     │ Não existe no Map?       │      │
│    │                     │     │                          │      │
│    │  ➜ "duplicate"      │     │  ➜ entra na FILA (r: 0) │      │
│    │    vai pro resultado│     │                          │      │
│    └─────────────────────┘     └──────────┬───────────────┘      │
└───────────────────────────────────────────┼──────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  Retry Queue (while loop por rodadas)                            │
│                                                                  │
│  Rodada N: pega todos os itens da fila                           │
│                                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐                               │
│  │item1   │ │item2   │ │item3   │                                │
│  │r: 0    │ │r: 0    │ │r: 0    │                                │
│  └────────┘ └────────┘ └────────┘                                │
│       │          │          │                                    │
│       ▼          ▼          ▼        processados em PARALELO     │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  Promise.allSettled([ processItem, processItem, ...])│        │
│  │                                                      │        │
│  │  Cada processItem chama o PIX Simulator:             │        │
│  │  Promise.race(simulação, timeout 5s)                 │        │
│  │  delay: 50-200ms  |  ~70% sucesso                   │        │
│  └──────┬──────────────────┬──────────────────┬─────────┘        │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│  ┌─────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │  ✅ Sucesso  │  │ ⚠️ Falha       │  │ ❌ Falha       │        │
│  │             │  │ retries < 3    │  │ retries = 3    │        │
│  │ salva "paid"│  │                │  │                │        │
│  │ no Map      │  │ vai pro        │  │ salva "failed" │        │
│  │             │  │ retryQueue ↻   │  │ no Map         │        │
│  └─────────────┘  └────────────────┘  └────────────────┘        │
│                                                                  │
│  queue = retryQueue → próxima rodada (só com falhos)             │
│  Repete até a fila esvaziar                                      │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Relatório Final (ordem original dos items)                      │
│                                                                  │
│  {                                                               │
│    "batch_id": "2025-10-05-A",                                   │
│    "processed": 3,                                               │
│    "successful": 2,                                              │
│    "failed": 0,                                                  │
│    "duplicates": 1,                                              │
│    "details": [                                                  │
│      { "external_id": "u1-001", "status": "paid",    retries: 0}│
│      { "external_id": "u2-002", "status": "paid",    retries: 2}│
│      { "external_id": "u3-003", "status": "duplicate",retries: 0}│
│    ]                                                             │
│  }                                                               │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Client recebe JSON response                                     │
└──────────────────────────────────────────────────────────────────┘


## Idempotência

┌─────────────────────────────────────────────┐
│           Payment Store (Map)               │
│                                             │
│  external_id  │  status  │  amount_cents    │
│ ──────────────┼──────────┼────────────────  │
│  "u1-001"     │  paid    │  35000           │
│  "u2-002"     │  paid    │  120000          │
│  "u3-003"     │  failed  │  8000            │
│                                             │
│  1ª chamada → processa e salva              │
│  2ª chamada → encontra no Map → "duplicate" │
│               NÃO reprocessa                │
└─────────────────────────────────────────────┘


## Retry Queue — Exemplo (processamento paralelo por rodada)

  Rodada 1:  [item1(r:0), item2(r:0), item3(r:0)]  → Promise.allSettled
             item1 ✅ "paid"  |  item2 ❌ falha  |  item3 ✅ "paid"

  Rodada 2:  [item2(r:1)]  → Promise.allSettled
             item2 ❌ falha

  Rodada 3:  [item2(r:2)]  → Promise.allSettled
             item2 ❌ falha

  Rodada 4:  [item2(r:3)]  → Promise.allSettled
             item2 ❌ falha → retries = 3, marca como "failed"

  Fila vazia → fim


## Stack

  Bun 1.3 · Elysia.js · TypeScript · In-Memory Map · Promise.allSettled · Retry Queue (max 3) · Timeout 5s
