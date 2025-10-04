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

✅ Tecnologias utilizadas

NestJS

TypeORM

MySQL

Jest

Insomnia

## Endpoints/CLI

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

## Arquitetura

- Desenho rápido das camadas

Controller: Responsável pelo endpoint (Post/payouts/batch). Recebe as requisições HTTP (ex.: POST /payouts/batch) e valida os dados com DTOs (para checar se batch_id e items estão corretos). Depois, chama o service. É fina – só roteia, sem lógica pesada.

Service: Responsável pela lógica de negócio da aplicação, o PayoutsService faz o processBatch. Ele loopa pelos items, checa se já existe (para evitar duplicados), simula o pagamento PIX (com um delay e chance de falha), e salva no banco. Usa o repository para falar com o DB.

Entity: Utiliza-se do typeORM para abstrair o MySQL. Módulo PayoutsModule registra tudo via TypeOrmModule.forFeature(Payout).

Infraestrutura Externa. DB MySQL, logs com NestJS Logger e testes automatizados com Jest, resultando em: 'Tests: 1 failed, 5 passed, 6 total'.

Fluxo Rápido(Exemplo): "Um request chega no Controller -> Valida DTO(Json) -> chama service.processBatch() -> service loopa items: findOne(repo) -> Se novo, simulatePixPayment -> create/save(repo) -> retorna relatório JSON."

- Principais decisões e trade‑offs

Decisão 1: NestJS para a App (em vez de só Express):

Por quê: É fácil de estruturar com comandos como nest g service – gera pastas e arquivos prontos. Tem injeção automática (o service recebe o repository sem eu configurar manualmente). Perfeito para um projeto pequeno como esse.
Trade-offs: É mais simples para mim (menos código boilerplate) além de que já tenho uma vivência com o Nest, mas pode ser um pouco mais lento que Express puro em apps muito grandes. Aqui, não importa – o foco é aprender, não performance extrema.

Decisão 2: TypeORM com MySQL (para o Banco):

Por quê: Integra direto com NestJS (só configuro no módulo). Facilita criar a tabela payouts e checar duplicados com unique no external_id.
Trade-offs: Fácil para queries simples (como save e findOne), mas se precisar de buscas complexas, seria mais trabalho. Alternativa como SQLite seria mais rápido para testes locais, mas MySQL é melhor para simular produção real, além de já estar acostumado com o MySQL e o tempo está jogando contra mim...

Decisão Geral: "Escolhi coisas que eu já conhecia um pouco (NestJS e TypeORM) para focar na lógica do PIX (idempotência e simulação). O app tem ~150 linhas, roda rápido, e os testes cobrem o básico. Evitei complicar com autenticação, pois o desafio não pedia."

- O que faria diferente com mais tempo

Adicionaria Mais Validações e Testes:

Com mais tempo, colocaria validações extras no DTO (ex.: checar se amount_cents é positivo) e mais testes, como E2E para o endpoint completo (usando supertest). Agora tenho unit tests bons (90% cobertura), mas E2E confirmaria o fluxo HTTP + DB.

Melhoraria o Setup e Erros:

Utilizaria e ajustaria o Docker para volumes persistentes (para não perder dados ao parar) e adicionaria tratamento de erros mais amigável (ex.: mensagens customizadas para o usuário). Também testaria com dados reais maiores (100 items) para ver performance.

Reflexão Simples: No geral, o projeto atende o desafio (processa batch com idempotência), mas com mais tempo, focaria em polir: documentar melhor no README e rodar em um ambiente de teste separado. Aprendi muito com TypeORM e mocks no Jest – na próxima, usaria isso para algo maior.

## Testes

Este projeto usa Jest para testes unitários (cobertura ~90% no service principal) e Insomnia (ou curl/Postman) para testes manuais de E2E no endpoint. Os unit tests mockam o repositório (sem precisar de DB real), mas para E2E, rode o app com MySQL local conectado.

Pré-requisitos
Node.js: v18+ (verifique com node --version).
MySQL Local: Instale via MySQL Installer ou XAMPP. Crie o banco pix_db com:

Run
Copy code
mysql -u root -p # Senha do seu MySQL local
CREATE DATABASE pix_db;
Credenciais no app.module.ts ou .env: DB_HOST=localhost, DB_PORT=3306, DB_USERNAME=user, DB_PASSWORD=pass, DB_DATABASE=pix_db.
Insomnia: Baixe grátis em insomnia.rest para testes HTTP (alternativa: curl ou Postman).
Instale dependências: npm install.

1. Rodar a Aplicação (Para Testes E2E)
   Antes de testar endpoints, inicie o servidor:

Run

### npm run start:dev

A app roda em http://localhost:3000.
TypeORM cria a tabela payouts automaticamente (graças a synchronize: true).
Logs: Deve mostrar "App is running" sem erros de conexão DB. Se der "connection refused", verifique MySQL rodando e creds.
Pare com Ctrl+C quando terminar.

2. Rodar Testes Unitários (Jest)
   Os unit tests focam no PayoutsService (processBatch: sucesso, duplicados, falhas, batch vazio). Não precisam de DB – usam mocks.

Todos os Testes (Uma Vez):

### npm run test

Saída esperada: PASS src/payouts/services/payouts.service.spec.ts (6 testes passando).

Testes em Modo Watch (Para Desenvolvimento):

### npm run test:watch

Roda automaticamente ao salvar arquivos (útil para iterar).
Cobertura de Código:

### npm run test:cov

Gera relatório em coverage/lcov-report/index.html (abra no browser). Esperado: >90% no service (linhas como loop, try-catch cobertas).
Teste Específico (Ex.: Só o Service):

### npm run test src/payouts/services/payouts.service.spec.ts

Se falhar (ex.: mocks undefined), limpe cache: npx jest --clearCache.

3. Testes Manuais E2E (Via Insomnia ou Curl)
   Teste o endpoint real: POST http://localhost:3000/payouts/batch. Envie JSON com batch_id e items. Valide idempotência (envie 2x o mesmo – segunda deve ter "duplicates").

Configurar no Insomnia
Crie nova requisição: POST > URL: http://localhost:3000/payouts/batch.
Headers: Content-Type: application/json.
Body (JSON): Use os exemplos abaixo.
Envie e cheque resposta (JSON com processed, successful, etc.).

POST http://localhost:3000/payouts/batch \
 -H "Content-Type: application/json" \
 --data '{
"batch_id": "test-curl-001",
"items": [{"external_id": "curl-001", "user_id": "u1", "amount_cents": 1000, "pix_key": "u1@email.com"}]
}'

## IA/Libraries

- Onde usou IA

Usei IA em partes específicas do projeto, queria aprender com esse teste de forma eficiente. Principalmente, na lógica do service (PayoutsService), onde implementei a idempotência – que era o foco central do desafio e dos testes. Eu não tinha muita experiência com isso em NestJS/TypeORM, então pedi ajuda para estruturar o loop de processamento: checar external_id no DB, simular o PIX e lidar com duplicados via unique constraint. A IA me deu um esboço inicial, mas eu revisei tudo, ajustei para o meu setup (sem Docker, com MySQL local), testei com Jest (Utilizei da IA também para fazer testes aceitáveis), pois é algo que também não tenho tanta experiência e garanti que funcionasse idempotente (enviei batches duplicados via Insomnia e vi zeros successful na segunda vez).
Também usei para estruturar o README, porém escrevi o conteúdo baseado no meu fluxo real.
No geral utilizo muito a IA para me auxiliar nas ferramentas que ainda não tenho tanta desenvoltura, meu foco máximo é no aprendizado e ela me fornece essa segurança me ajudando naquilo que ainda não domino...

- O que é seu vs. de terceiros

A maior parte é minha criação original, focada na lógica do negócio (idempotência e simulação PIX), mas usei ferramentas e bibliotecas padrão para acelerar o setup.
A lógica principal no PayoutsService: o método processBatch com loop para itens, checagem de duplicados via findOne (por external_id), simulação randômica de PIX (com delay e probabilidade de falha/sucesso), e geração do relatório JSON (com contadores de successful/failed/duplicates). Eu escrevi isso, testando cenários como batch vazio e erros DB.
A entidade Payout (campos como external_id unique, status enum) e o controller (endpoint /payouts/batch com validação DTO básica).
Os testes unitários no Jest: mocks para repository, cenários de sucesso/duplicado/falha (6 testes passando com 90% cobertura). Eu debuguei issues como timeouts nos mocks.
O README e setup local: Escrevi as instruções de rodar testes (npm run test) e payloads para Insomnia, baseado no meu fluxo sem Docker.

De terceiros - Framework e ORM: NestJS + TypeORM.
Testes: Jest, mas os Specs são meus.
IA como mencionado anteriormente, utilizei chatGPT para me auxiliar nas dúvidas.
E class-validator.
