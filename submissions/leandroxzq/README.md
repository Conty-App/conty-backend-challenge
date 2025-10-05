# Desafio Conty – Leandro Ivanildo da Silva / @leandroxzq

> **Local da submissão:** `submissions/leandroxzq/pix`

## Como rodar

## Pré-requisitos

- Docker
- Node.js

## Como Executar

```bash
docker-compose up --build

npx prisma migrate deploy

npm run dev
```

## Endpoints/CLI

- GET /payouts/all

- POST /payouts/batch

Request:

```json
{
  "batch_id": "2025-10-05-A",
  "items": [
    {
      "external_id": "u1-001",
      "user_id": "u1",
      "amount_cents": 35000,
      "pix_key": "u1@email.com"
    },
    {
      "external_id": "u2-002",
      "user_id": "u2",
      "amount_cents": 120000,
      "pix_key": "+55 11 91234-5678"
    }
  ]
}
```

Response:

```json
{
  "batch_id": "2025-10-05-A",
  "processed": 2,
  "successful": 0,
  "failed": 0,
  "duplicates": 2,
  "details": [
    {
      "external_id": "u1-001",
      "status": "duplicate",
      "amount_cents": 35000
    },
    {
      "external_id": "u2-002",
      "status": "duplicate",
      "amount_cents": 120000
    }
  ]
}
```

## Arquitetura

```text
submissions/
└── leandroxzq/
    └── pix/
        ├── node_modules/
        ├── prisma/
        │   ├── migrations/
        │   └── schema.prisma
        ├── src/
        │   ├── controllers/
        │   │   └── payoutController.ts
        │   ├── database/
        │   │   └── connection.ts
        │   ├── routes/
        │   │   └── payoutRoutes.ts
        │   ├── service/
        │   │   └── payoutService.ts
        │   ├── util/
        │   ├── payments/
        │   └── server.ts
        ├── test/
        ├── .env
        ├── docker-compose.yml
        ├── package-lock.json
        ├── package.json
        ├── README.md
        ├── tsconfig.json
        ├── vitest.config.ts
        └── .gitignore
```

## Principais Decisões

- Uso do Prisma ORM para gestão do banco de dados

- Estrutura modular para facilitar manutenção

- Validação de dados na camada de entrada

- Tratamento de duplicatas baseado em external_id

## Melhorias Futuras

- Implementação de mock para testes

- Melhor tratamento de erros

- Documentação mais detalhada da API

## Testes

```bash
npm run test
```

### Detecção de duplicados

- Ele insere um item no batch.

- Tenta inserir o mesmo item novamente.

- Verifica se duplicates aumentou e se o status do item é "duplicate".

- Retorno da função

- Confirma que details retorna o status correto do item duplicado.

- Confirma que external_id no detalhe corresponde ao item enviado.

## Bibliotecas usadas

- Prisma
- Express
- Dotenv
- Vitest

## Uso de IA

- Utilizei ChatGPT para ajudar a estruturar e escrever testes.
- Também auxiliou na documentação e explicação de algumas partes do Prisma.
- Auxiliou na lógica de simulação de pagamentos
