## Projeto: Pix Batch API 

Resumo
- Serviço simples que processa batches de pagamentos PIX (simulados). Os pagamentos são armazenados em um banco Postgres via Prisma.

Principais bibliotecas
- express: servidor HTTP e roteamento.
- prisma / @prisma/client: ORM gerado a partir do schema Prisma. Usado para acessar o Postgres.
- dotenv: carregar variáveis de ambiente (DATABASE_URL) — já presente no repositório.
- uuid: geração de ids (instalada, pode ser usada internamente se necessário).
- ts-node-dev, typescript: desenvolvimento local com reload (dev).

Como rodar (resumido)
- Recomendo usar Docker Compose: `docker compose up --build -d`.
- Aplicar migrations: `npx prisma migrate deploy --schema=./prisma/schema.prisma` (ou `npm run docker:migrate` se preferir via script npm).

Rotas
- POST /payouts/batch
	- Recebe um objeto do tipo PayoutBatch:
		- batch_id: string
		- items: array de objetos { external_id, user_id, amount_cents, pix_key }
	- Processa cada item: verifica duplicado por `external_id`; simula pagamento (90% success); cria registro em `payment` com status `paid`/`failed`/`duplicate`.
	- Retorna um `BatchReport` com contadores e detalhes por item.

- GET /payouts
	- Retorna todos os pagamentos ordenados por `created_at` (desc) com total.

- GET /payouts/batch
	- (implementado, porém o controller lê params — a rota usa `getPayoutById` sem `:external_id` na rota; revisar se precisar consultar por id via rota `/payouts/:external_id`)

Observação sobre rotas
- O arquivo `src/routes/payouts.ts` registra:
	- `router.post('/batch', processBatch);`
	- `router.get('/batch', getPayoutById);`  <-- provavelmente deveria ser `router.get('/batch/:external_id', getPayoutById)` ou `router.get('/:external_id', getPayoutById)` dependendo do comportamento esperado.

Estrutura do código (principais arquivos)
- `src/index.ts`
	- Inicializa o Express, ativa JSON middleware e registra o roteador `/payouts`.

- `src/routes/payouts.ts`
	- Define as rotas relacionadas a payouts e mapeia para o controller.

- `src/controllers/payoutsController.ts`
	- Contém handlers HTTP: `processBatch`, `getAllPayouts`, `getPayoutById`.
	- `processBatch` chama o service `handleBatch` e devolve o relatório.

- `src/services/payoutsService.ts`
	- Lógica de negócio: `handleBatch` itera os items do batch, usa `prisma.payment` para checar duplicidade e inserir registros.
	- Usa `simulatePixPayment` para simular o processamento PIX (retorna booleano com 90% de sucesso).

- `src/models/db.ts`
	- Exporta `prisma` (PrismaClient) para ser usado por outras camadas.

- `src/models/paymentStore.ts`
	- Funções que expõem consultas de leitura: `getAllPayments` e `getPaymentById` — usam `prisma.payment.findMany` / `findUnique`.

- `src/utils/simulatePix.ts`
	- Simula chamada à adquirente PIX com latência aleatória e probabilidade de sucesso (ex.: 90%).

- `src/types/payout.d.ts`
	- Tipos TypeScript: `PayoutItem`, `PayoutBatch`, `PayoutResult`, `BatchReport`.

Observações importantes (coisas para revisar)
- Erro inicial comum: "@prisma/client did not initialize yet" — certifique-se de rodar `npx prisma generate` se estiver rodando localmente sem usar a imagem Docker que já gera o client.
- Migrations: se a tabela `Payment` não existir, rode `npx prisma migrate deploy` para aplicar as migrations em `prisma/migrations`.
- Rotas/Controllers: há uma inconsistência em `routes/payouts.ts` — a rota `GET /batch` chama `getPayoutById` que espera um `external_id` nos params. Se for necessário consultar por `external_id` por rota, recomendo trocar para `router.get('/:external_id', getPayoutById)`.


Passos para rodar
-----------------

Aqui estão passos diretos, copy/paste, para rodar o projeto em dois modos: via Docker Compose (recomendado) ou localmente para desenvolvimento.

Requisitos mínimos
- Docker e Docker Compose (ou Docker com Compose V2)
- Node.js e npm (para rodar localmente)

1) Rodar com Docker Compose (mais simples para reproduzir o ambiente)

- Subir e construir a imagem (modo background):

```bash
docker compose up --build -d
```

- Verificar logs em tempo real:

```bash
docker compose logs -f
```

- Aplicar migrations (do host) apontando para o banco (caso necessário):

```bash
npm run docker:migrate
# ou alternativamente
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

- Entrar no psql do container Postgres:

```bash
npm run docker:psql
# ou
docker compose exec postgres psql -U docker -d payouts_db
```

- Parar e remover containers:

```bash
docker compose down
```

2) Rodar localmente (fast feedback / desenvolvimento)

- Inicie apenas o Postgres via Docker Compose:

```bash
docker compose up -d postgres
```

- Instale dependências e gere o client Prisma (se necessário):

```bash
npm install
npx prisma generate
```

- Aplique migrations no banco local (caso precisem ser aplicadas):

```bash
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

- Rode o servidor em modo desenvolvimento (hot reload):

```bash
npm run dev
```

3) Endpoint de exemplo

- Enviar um batch de exemplo:

```bash
curl -v -X POST "http://localhost:3000/payouts/batch" \
	-H "Content-Type: application/json" \
	--data '{"batch_id":"2025-10-05-A","items":[{"external_id":"u1-001","user_id":"u1","amount_cents":35000,"pix_key":"u1@email.com"},{"external_id":"u2-002","user_id":"u2","amount_cents":120000,"pix_key":"+55 11 91234-5678"}]}'
```

4) Troubleshooting rápido

- Se aparecer "@prisma/client did not initialize yet": execute `npx prisma generate` localmente.
- Se aparecer `relation "public.Payment" does not exist`: aplique migrations (`npx prisma migrate deploy`).
- Portas: o serviço escuta em `3000` internamente; o compose mapeia conforme `docker-compose.yaml`.
- Scripts úteis (adicionados ao `package.json`): `npm run docker:up`, `npm run docker:logs`, `npm run docker:migrate`, `npm run docker:psql`.


