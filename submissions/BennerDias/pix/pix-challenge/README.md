# Desafio Conty – {Benner Dias / @BennerDias}

> **Local da submissão:** `submissions/BennerDias/pix`

## Como rodar

🚀 Como rodar o projeto
🧩 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

Node.js
(versão 18 ou superior)

NestJS CLI
:

npm install -g @nestjs/cli

MySQL
rodando localmente

(Opcional) Insomnia
para testar as rotas

⚙️ 1. Clonar o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio

📦 2. Instalar as dependências
npm install

🧾 3. Configurar variáveis de ambiente

Crie um arquivo .env na raiz do projeto com as configurações do banco:

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=db_pix

💡 Caso utilize outro banco ou senha, ajuste os valores acima conforme seu ambiente.

🧱 4. Configurar o banco de dados

Crie o banco manualmente no MySQL:

CREATE DATABASE db_pix;

O TypeORM se encarrega de criar as tabelas automaticamente (se synchronize: true) ou via migrations, dependendo da configuração.

▶️ 5. Rodar o projeto

Para iniciar em modo desenvolvimento com hot reload:

npm run start:dev

Ou em modo de produção:

npm run start:prod

O servidor será iniciado em:

http://localhost:3000

🧪 6. Rodar os testes

Este projeto utiliza Jest para testes unitários.

Para executar todos os testes:

npm run test

Para ver o relatório detalhado:

npm run test:watch

🔗 Rotas disponíveis

POST /payouts/batch

Processa um lote de pagamentos PIX.

Exemplo de requisição:

POST http://localhost:3000/payouts/batch
Content-Type: application/json

Body (JSON):

{
"batch_id": "batch_001",
"items": [
{ "external_id": "123", "amount": 500 },
{ "external_id": "456", "amount": 1000 }
]
}

Resposta (exemplo):

{
"batch_id": "batch_001",
"processed": 2,
"successful": 2,
"failed": 0,
"duplicates": 0,
"details": [
{ "external_id": "123", "success": true },
{ "external_id": "456", "success": true }
]
}

✅ Tecnologias utilizadas

NestJS

TypeORM

MySQL

Jest

Insomnia

## Endpoints/CLI

- Liste endpoints/flags e exemplos de request/response (cURL/Postman)

## Arquitetura

- Desenho rápido das camadas
- Principais decisões e trade‑offs
- O que faria diferente com mais tempo

## Testes

- Como rodar e o que cobre

## IA/Libraries

- Onde usou IA
- O que é seu vs. de terceiros
