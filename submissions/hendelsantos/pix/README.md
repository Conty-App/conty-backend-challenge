# PIX Payment Processing Service - Conty Challenge

> **Desafio:** Sistema de pagamentos em lote via PIX (simulado) com idempotência  
> **Autor:** Hendel Santos (@hendelsantos)  
> **Tecnologias:** Go 1.23+ | PostgreSQL | Docker | Gin Framework

## � Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Como Rodar](#como-rodar)
- [Uso da API](#uso-da-api)
- [Exemplos Práticos](#exemplos-práticos)
- [Arquitetura](#arquitetura)
- [Testes](#testes)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contribuição](#contribuição)

## 🎯 Sobre o Projeto

Este é um sistema de processamento de pagamentos PIX em lote desenvolvido para o **Desafio Técnico Backend da Conty**. O sistema foi projetado com foco em:

- **Idempotência**: Evita processamento duplicado usando `external_id` como chave única
- **Concorrência**: Processamento paralelo para alta performance
- **Confiabilidade**: Tratamento robusto de falhas e recuperação
- **Observabilidade**: Logs estruturados e métricas detalhadas
- **Escalabilidade**: Arquitetura preparada para crescimento

## ✨ Funcionalidades

### Core Features
- ✅ **Processamento de Lotes PIX**: Processa múltiplos pagamentos simultaneamente
- ✅ **Idempotência Garantida**: `external_id` previne duplicações
- ✅ **Simulação Realística**: Delays aleatórios e taxa de sucesso configurável
- ✅ **Relatórios Detalhados**: Contadores e status por transação
- ✅ **API REST**: Endpoints HTTP com validação completa

### Funcionalidades Técnicas
- ✅ **Persistência PostgreSQL**: Dados auditáveis e consistentes
- ✅ **Processamento Concorrente**: Goroutines para performance
- ✅ **Logs Estruturados**: JSON logs com contexto completo
- ✅ **Graceful Shutdown**: Finalização segura de operações
- ✅ **Health Check**: Monitoramento de saúde da aplicação

## 🛠 Tecnologias Utilizadas

### Backend
- **Go 1.23+**: Linguagem principal
- **Gin Framework**: Router HTTP rápido e minimalista
- **PostgreSQL**: Banco de dados relacional
- **Logrus**: Logging estruturado

### DevOps & Ferramentas
- **Docker & Docker Compose**: Containerização
- **Makefile**: Automação de comandos
- **Go Modules**: Gerenciamento de dependências
- **Air** (opcional): Live reload para desenvolvimento

### Bibliotecas Principais
```go
github.com/gin-gonic/gin         // HTTP framework
github.com/lib/pq               // PostgreSQL driver
github.com/golang-migrate/migrate // Database migrations
github.com/sirupsen/logrus      // Structured logging
github.com/google/uuid          // UUID generation
github.com/joho/godotenv        // Environment management
github.com/stretchr/testify     // Testing framework
```

## 📋 Pré-requisitos

### Para Desenvolvimento Local
- **Go 1.23+** ([Download](https://golang.org/dl/))
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### Para Execução com Docker
- **Docker 20.10+** ([Download](https://docs.docker.com/get-docker/))
- **Docker Compose 2.0+** ([Download](https://docs.docker.com/compose/install/))

### Verificação dos Requisitos
```bash
# Verificar versões
go version        # Deve ser 1.23+
docker --version  # Deve ser 20.10+
docker-compose --version # Deve ser 2.0+
```

## 🚀 Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd Desafio_Conty
```

### 2. Configuração de Ambiente
```bash
# Copiar arquivo de configuração
cp .env.example .env

# Editar variáveis se necessário
nano .env
```

### 3. Configuração do Banco (Desenvolvimento Local)
```bash
# Criar banco PostgreSQL
sudo -u postgres createdb conty_pix

# Executar migrações
sudo -u postgres psql -d conty_pix -f migrations/001_initial_schema.up.sql

# Ou definir senha para o usuário postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

## 📡 Endpoints

### POST /payouts/batch
Processa um lote de pagamentos PIX de forma idempotente.

**Request:**
```bash
curl -X POST http://localhost:8080/payouts/batch \
  -H "Content-Type: application/json" \
  --data @seeds/payouts_batch_example.json
```

**Request Body:**
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

**Response:**
```json
{
  "batch_id": "2025-10-05-A",
  "processed": 2,
  "successful": 2,
  "failed": 0,
  "duplicates": 0,
  "details": [
    {
      "external_id": "u1-001",
      "status": "paid",
      "amount_cents": 35000
    },
    {
      "external_id": "u2-002", 
      "status": "paid",
      "amount_cents": 120000
    }
  ]
}
```

### GET /health
Health check do serviço.

## 🏗️ Arquitetura

### Camadas
```
cmd/api/           # Entry point da aplicação
internal/
  ├── domain/      # Entidades de negócio e interfaces
  ├── service/     # Lógica de negócio  
  ├── repository/  # Acesso a dados
  ├── handler/     # Controllers HTTP
  └── config/      # Configurações
migrations/        # Migrações do banco
seeds/            # Dados de exemplo
tests/            # Testes
```

### Principais decisões
- **Idempotência**: `external_id` como chave única para evitar duplicações
- **Simulação PIX**: Processamento assíncrono com delay aleatório 
- **Clean Architecture**: Separação clara de responsabilidades
- **Logs estruturados**: JSON logs com contexto para observabilidade
- **Graceful shutdown**: Finalização segura de processamentos em andamento

### Trade-offs
- **Simulação vs Integração real**: Optei por simulação para simplicidade
- **Sync vs Async**: API síncrona com processamento interno assíncrono
- **In-memory vs Persistent**: PostgreSQL para persistência e auditoria

### Com mais tempo faria
- [ ] Implementação de webhooks para notificação de status
- [ ] Rate limiting e circuit breaker
- [ ] Métricas com Prometheus
- [ ] Pipeline de CI/CD completo
- [ ] Testes de carga e stress

## 🧪 Testes

```bash
# Rodar todos os testes
make test

# Testes com coverage
make test-coverage

# Testes de integração
make test-integration
```

### Cobertura
- Testes unitários para lógica de negócio
- Testes de integração para endpoints
- Mocks para simulação de dependências

## 🚀 Deployment

### Produção com Docker
```bash
# Build da imagem
docker build -t conty-pix-api .

# Executar container
docker run -p 8080:8080 --env-file .env conty-pix-api
```

### Deploy com Docker Compose
```bash
# Produção
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verificar status
docker-compose ps
docker-compose logs -f app
```

### Variáveis de Ambiente - Produção
```bash
# Copiar configuração
cp .env.example .env.prod

# Ajustar para produção
GIN_MODE=release
LOG_LEVEL=warn
DB_PASSWORD=<senha-forte>
PIX_SUCCESS_RATE=0.99
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Erro: "Failed to ping database"
# Solução: Verificar se PostgreSQL está rodando
sudo systemctl status postgresql
sudo systemctl start postgresql

# Verificar configurações em .env
cat .env | grep DB_
```

#### 2. Porta já em uso
```bash
# Erro: "bind: address already in use"
# Solução: Encontrar processo usando a porta
sudo lsof -i :8080
sudo kill -9 <PID>

# Ou mudar porta no .env
PORT=8081
```

#### 3. Permissões do PostgreSQL
```bash
# Erro: "password authentication failed"
# Solução: Configurar usuário postgres
sudo -u postgres psql
\password postgres
\q

# Atualizar .env
DB_PASSWORD=postgres
```

#### 4. Migrações não aplicadas
```bash
# Erro: "relation does not exist"
# Solução: Aplicar migrações
sudo -u postgres psql -d conty_pix -f migrations/001_initial_schema.up.sql

# Verificar tabelas criadas
sudo -u postgres psql -d conty_pix -c "\dt"
```

### Logs de Debug
```bash
# Habilitar logs detalhados
LOG_LEVEL=debug
GIN_MODE=debug

# Acompanhar logs em tempo real
tail -f /var/log/conty-pix.log

# Logs estruturados JSON
jq '.' /var/log/conty-pix.log
```

### Performance Issues
```bash
# Verificar uso de recursos
docker stats

# Monitorar queries do banco
sudo -u postgres psql -d conty_pix
SELECT * FROM pg_stat_activity;

# Verificar índices
\d+ payouts
```

## 📈 Monitoramento

### Métricas Importantes
- **Latência**: Tempo de resposta da API
- **Throughput**: Requests por segundo
- **Taxa de sucesso**: % de pagamentos bem-sucedidos
- **Uso de recursos**: CPU, memória, conexões DB

### Health Check Detalhado
```bash
# Script de monitoramento
#!/bin/bash
while true; do
  response=$(curl -s -w "%{http_code}" http://localhost:8080/health)
  echo "$(date): Health check - $response"
  sleep 30
done
```

## 🤝 Contribuição

### Desenvolvimento Local
```bash
# Fork do projeto
git clone <seu-fork>
cd Desafio_Conty

# Criar branch para feature
git checkout -b feature/nova-funcionalidade

# Instalar dependências
go mod download

# Fazer alterações...

# Testes
make test

# Commit e push
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### Padrões de Código
- **Gofmt**: Formatação automática
- **Golint**: Linting de código
- **Testes**: Mínimo 80% de cobertura
- **Commits**: Conventional Commits

### Estrutura de PR
1. **Título**: Breve descrição da mudança
2. **Descrição**: Contexto e justificativa
3. **Testes**: Evidências de que funciona
4. **Breaking Changes**: Se aplicável

## 📄 Licença

Este projeto foi desenvolvido para o Desafio Técnico da Conty e é de uso educacional.

## 🙏 Agradecimentos

- **Conty Team**: Pelo desafio técnico inspirador
- **Go Community**: Pelas bibliotecas excelentes
- **PostgreSQL Team**: Pelo banco robusto

---

## 📞 Contato

**Hendel Santos**  
- GitHub: [@hendelsantos](https://github.com/hendelsantos)
- LinkedIn: [Hendel Santos](https://linkedin.com/in/hendelsantos)
- Email: hendel@example.com

---

**⚡ Sistema PIX em produção - Rápido, Confiável e Escalável!**# PIX
