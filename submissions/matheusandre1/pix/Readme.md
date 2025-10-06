# Desafio Conty – {Matheus André / @matheusandre1}

> **Local da submissão:** `submissions/matheusandre1/pix`

## Como rodar
- Requisitos: Docker (ou Go/Node/Python + Postgres/SQLite)
- Comandos: `make dev` / `docker compose up` / scripts equivalentes **dentro desta pasta**
- Variáveis: ver `.env.example`

## Endpoints/CLI
- Liste endpoints/flags e exemplos de request/response (cURL/Postman)

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



## IA/Libraries - Referencias da Criação do Projeto com Meus Ajustes
* [Implementando Clean Architecture com Golang](https://dev.to/booscaaa/implementando-clean-architecture-com-golang-4n0a) - Vinícius Boscardin
* [Testes unitários com Golang](https://dev.to/booscaaa/testes-unitarios-com-golang-22ph) - Vinícius Boscardin
* [Documentando uma api Go com Swagger](https://dev.to/booscaaa/documentanto-uma-api-go-com-swagger-2k05) - Vinícius Boscardin
* [Aprenda Go Com Testes](https://larien.gitbook.io/aprenda-go-com-testes) - Aprenda Go
* [Aprenda a fazer testes unitários pra qualquer função em Go](https://www.youtube.com/watch?v=c-6ZRF-FZY4) - Jonathan Moura
