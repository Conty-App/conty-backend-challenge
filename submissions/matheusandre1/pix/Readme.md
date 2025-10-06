# Desafio Conty – {Matheus André / @matheusandre1}

> **Local da submissão:** `submissions/matheusandre1/pix`

### Pré-requisitos
- Docker
- Docker Compose

### Executar a aplicação

1. **Clone o repositório e navegue até a pasta:**
```bash
cd submissions/matheusandre1/pix
```

2. **Execute com Docker Compose:**
```bash
docker-compose up --build
```

3. **A API estará disponível em:** `http://localhost:8080`

## Endpoints/CLI

### Endpoints disponíveis

- `POST /payouts/batch` - Processar lote de pagamentos
- `GET /payouts` - Listar todos os pagamentos


Casos de Testes com cUrl :
```bash
curl -X POST http://localhost:8080/payouts/batch \
  -H "Content-Type: application/json" \
  -d '{
  "batch_id": "2025-10-05-S",
  "items": [
    { "external_id": "sp-001", "user_id": "user_sp_1", "amount_cents": 45000, "pix_key": "user_sp_1@email.com" },
    { "external_id": "sp-002", "user_id": "user_sp_2", "amount_cents": 60000, "pix_key": "+55 11 98888-1111" },
    { "external_id": "sp-003", "user_id": "user_sp_3", "amount_cents": 35000, "pix_key": "user_sp_3@banco.com" }
  ]
}'
```

```bash
curl -X POST http://localhost:8080/payouts/batch \
  -H "Content-Type: application/json" \
  -d '{
  "batch_id": "2025-10-05-B",
  "items": [
    { "external_id": "u3-001", "user_id": "u3", "amount_cents": 50000, "pix_key": "u3@email.com" },
    { "external_id": "u4-002", "user_id": "u4", "amount_cents": 75000, "pix_key": "u4@banco.com" },
    { "external_id": "u5-003", "user_id": "u5", "amount_cents": 150000, "pix_key": "+55 21 99999-9999" }
  ]
}'
```

```bash
curl -X POST http://localhost:8080/payouts/batch \
  -H "Content-Type: application/json" \
  -d '{
  "batch_id": "2025-10-05-FL",
  "items": [
    { "external_id": "fl-001", "user_id": "freela_1", "amount_cents": 120000, "pix_key": "freela1@contato.com" },
    { "external_id": "fl-002", "user_id": "freela_2", "amount_cents": 95000, "pix_key": "+55 21 97777-2222" }
  ]
}'
```

Casos  de Testes PostMan : 

Método: POST
URL: http://localhost:8080/payouts/batch

```json
{
  "batch_id": "2025-10-05-SP",
  "items": [
    { "external_id": "sp-001", "user_id": "user_sp_1", "amount_cents": 45000, "pix_key": "user_sp_1@email.com" },
    { "external_id": "sp-002", "user_id": "user_sp_2", "amount_cents": 60000, "pix_key": "+55 11 98888-1111" },
    { "external_id": "sp-003", "user_id": "user_sp_3", "amount_cents": 35000, "pix_key": "user_sp_3@banco.com" }
  ]
}
```

```json
{
  "batch_id": "2025-10-05-FL",
  "items": [
    { "external_id": "fl-001", "user_id": "freela_1", "amount_cents": 120000, "pix_key": "freela1@contato.com" },
    { "external_id": "fl-002", "user_id": "freela_2", "amount_cents": 95000, "pix_key": "+55 21 97777-2222" }
  ]
}
```

Criei um Endpoint Get - Pra Listar os Payments

Método: POST
URL: http://localhost:8080/payouts


Outra Opção Válida Swagger :

http://localhost:8080/swagger/index.html

Colocar o Json Acimas ou esse casos aqui:

```json
{
  "batch_id": "2025-10-05-ENT",
  "items": [
    { "external_id": "ent-001", "user_id": "delivery_1", "amount_cents": 42000, "pix_key": "delivery1@empresa.com" },
    { "external_id": "ent-002", "user_id": "delivery_2", "amount_cents": 51000, "pix_key": "+55 11 95555-4444" },
    { "external_id": "ent-003", "user_id": "delivery_3", "amount_cents": 48000, "pix_key": "delivery3@empresa.com" }
  ]
}
```

```json
{
  "batch_id": "2025-10-05-DEV",
  "items": [
    { "external_id": "dev-001", "user_id": "dev_front", "amount_cents": 150000, "pix_key": "devfront@empresa.com" },
    { "external_id": "dev-002", "user_id": "dev_back", "amount_cents": 165000, "pix_key": "devback@empresa.com" },
    { "external_id": "dev-003", "user_id": "dev_full", "amount_cents": 210000, "pix_key": "+55 41 98888-7777" }
  ]
}
```



## Arquitetura
- Optei por Não ter Persistência, Criando Ali uma espécie de  "Repository Pattern" em Memoria, algo simples e prático, Com Ajustes utilizando Hexagonal.
- Optei pela Simplicidade e Boas práticas de Programação
- 
- Se tivesse mais tempo colocaria mais complexidade Pra Melhor Perfomance da aplicação por Exemplo:
- Mensageria utilizando Kafka
- Event-driven architecture e CQRS
- Utilizaria Design Pattern pra Camada de Acesso a Dados(A conversar com o Time) por questão de escalabilidade, Podendo utilizar e Implementaria um Repository Pattern pra ter interdependência de Banco.
- Monitoramento e Observabilidade com Grafana e Open Telemetry e Configurar Os Logs, Metricas e etc.
- Uma esteira de Ci CD

## 🧪 Testes

- Alguns testes irão Falhar De Maneiro Proposicional

Para executar os testes do projeto, certifique-se de estar na raiz do repositório e rode o comando abaixo:

```bash
# Executa apenas os testes dentro da pasta tests
go test -v ./tests/...

```



## IA/Libraries - Referencias Pra Criação do Projeto com Meus Ajustes
* [Implementando Clean Architecture com Golang](https://dev.to/booscaaa/implementando-clean-architecture-com-golang-4n0a) - Vinícius Boscardin
* [Testes unitários com Golang](https://dev.to/booscaaa/testes-unitarios-com-golang-22ph) - Vinícius Boscardin
* [Documentando uma api Go com Swagger](https://dev.to/booscaaa/documentanto-uma-api-go-com-swagger-2k05) - Vinícius Boscardin
* [Aprenda Go Com Testes](https://larien.gitbook.io/aprenda-go-com-testes) - Aprenda Go
* [Aprenda a fazer testes unitários pra qualquer função em Go](https://www.youtube.com/watch?v=c-6ZRF-FZY4) - Jonathan Moura
