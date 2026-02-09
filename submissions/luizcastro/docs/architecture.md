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
│  batch_id: string, items: { external_id, user_id,                │
│  amount_cents, pix_key }[]                                       │
│                                                  ❌ 422 invalid   │
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
│    │  ➜ "duplicate"      │     │  ➜ entra na FILA (r: 0) │       │
│    │    vai pro resultado│     │                          │      │
│    └─────────────────────┘     └──────────┬───────────────┘      │
└───────────────────────────────────────────┼──────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  Retry Queue (while loop)                                        │
│                                                                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                     │
│  │item1   │ │item2   │ │item3   │ │item2   │  ◄── retry          │
│  │r: 0    │ │r: 0    │ │r: 0    │ │r: 1    │                     │
│  └───┬────┘ └────────┘ └────────┘ └────────┘                     │
│      │ shift()                                                   │
│      ▼                                                           │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  PIX Simulator                                       │        │
│  │  Promise.race(simulação, timeout 5s)                 │        │
│  │  delay: 50-200ms  |  ~70% sucesso                    │        │
│  └──────┬──────────────────┬──────────────────┬─────────┘        │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│  ┌─────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │  ✅ Sucesso  │  │ ⚠️ Falha      │  │ ⚠️ Falha      │         │
│  │             │  │ retries < 3    │  │ retries = 3    │         │
│  │ salva "paid"│  │                │  │                │         │
│  │ no Map      │  │ push() no fim  │  │ no Map         │         │
│  │             │  │ da fila ↻      │  │                │         │
│  └─────────────┘  └────────────────┘  └────────────────┘         │
│                                                                  │
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
│      { "external_id": "u1-001", "status": "paid",    retries: 0 }│
│      { "external_id": "u2-002", "status": "paid",    retries: 2 }│
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


## Retry Queue — Exemplo

  Fila inicial:  [item1(r:0)] [item2(r:0)] [item3(r:0)]

  ① item1 → PIX → ✅ sucesso → "paid" (retries: 0)
     Fila:  [item2(r:0)] [item3(r:0)]

  ② item2 → PIX → ❌ falha → volta pro fim (r:1)
     Fila:  [item3(r:0)] [item2(r:1)]

  ③ item3 → PIX → ✅ sucesso → "paid" (retries: 0)
     Fila:  [item2(r:1)]

  ④ item2 → PIX → ❌ falha → volta pro fim (r:2)
     Fila:  [item2(r:2)]

  ⑤ item2 → PIX → ✅ sucesso → "paid" (retries: 2)
     Fila:  [] ← vazia, fim!


## Stack

  Bun 1.3 · Elysia.js · TypeScript · In-Memory Map · Retry Queue (max 3) · Timeout 5s
