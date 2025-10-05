.PHONY: help dev run build test test-coverage test-integration clean deps lint format setup db-create db-migrate db-reset logs

# Colors for help output
BLUE := \033[36m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

help: ## 📋 Mostra todos os comandos disponíveis
	@echo "$(BLUE)🚀 Conty PIX - Sistema de Pagamentos$(NC)"
	@echo ""
	@echo "$(BLUE)Comandos disponíveis:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(BLUE)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# 🚀 Development
dev: ## 🐳 Iniciar ambiente completo com Docker Compose
	docker-compose up --build

dev-bg: ## 🐳 Iniciar em background
	docker-compose up -d --build

stop: ## 🛑 Parar todos os containers
	docker-compose down

logs: ## 📋 Acompanhar logs da aplicação
	docker-compose logs -f app

setup: deps db-setup ## 🔧 Configuração inicial completa

# 🏃 Local Development
run: ## 🏃 Executar aplicação localmente
	go run cmd/api/main.go

run-watch: ## 👁️ Executar com live reload (requer air)
	air

build: ## 🔨 Compilar aplicação
	go build -o bin/api cmd/api/main.go

build-linux: ## 🐧 Compilar para Linux
	GOOS=linux GOARCH=amd64 go build -o bin/api-linux cmd/api/main.go

# 🧪 Testing
test: ## 🧪 Executar testes unitários
	go test -v ./internal/...

test-coverage: ## 📊 Executar testes com coverage
	go test -v -coverprofile=coverage.out ./internal/...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

test-integration: ## 🔗 Executar testes de integração
	go test -v -tags=integration ./tests/...

benchmark: ## ⚡ Executar benchmarks
	go test -bench=. -benchmem ./internal/...

# 🗃️ Database
db-setup: db-create db-migrate ## 🗃️ Configuração completa do banco

db-create: ## 📦 Criar banco de dados
	sudo -u postgres createdb conty_pix || echo "Database already exists"

db-migrate: ## ⬆️ Aplicar migrações
	sudo -u postgres psql -d conty_pix -f migrations/001_initial_schema.up.sql

db-migrate-down: ## ⬇️ Reverter migrações
	sudo -u postgres psql -d conty_pix -f migrations/001_initial_schema.down.sql

db-reset: db-migrate-down db-migrate ## 🔄 Resetar banco de dados

db-shell: ## 💻 Acessar shell do PostgreSQL
	sudo -u postgres psql -d conty_pix

db-status: ## 📊 Status do banco
	sudo -u postgres psql -d conty_pix -c "SELECT COUNT(*) as payouts FROM payouts; SELECT COUNT(*) as reports FROM batch_reports;"

# 🔧 Utilities
deps: ## 📦 Instalar/atualizar dependências
	go mod download
	go mod tidy

deps-update: ## 🔄 Atualizar todas as dependências
	go get -u ./...
	go mod tidy

lint: ## 🔍 Executar linter
	golangci-lint run || echo "Install golangci-lint: curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(shell go env GOPATH)/bin v1.54.2"

format: ## 💅 Formatar código
	go fmt ./...
	gofumpt -l -w . || echo "Install gofumpt: go install mvdan.cc/gofumpt@latest"

vet: ## 🔎 Analisar código
	go vet ./...

mod-verify: ## ✅ Verificar integridade dos módulos
	go mod verify

# 🧹 Cleanup
clean: ## 🧹 Limpar arquivos temporários
	rm -rf bin/
	rm -f coverage.out coverage.html
	go clean -cache
	docker system prune -f

clean-all: clean ## 🗑️ Limpeza completa (incluindo containers e volumes)
	docker-compose down -v
	docker system prune -a -f --volumes

# 🚀 Production
docker-build: ## 🐳 Build da imagem Docker
	docker build -t conty-pix-api .

docker-run: ## 🏃 Executar container Docker
	docker run -p 8080:8080 --env-file .env conty-pix-api

# 🔍 Monitoring
health: ## 💓 Verificar saúde da aplicação
	curl -f http://localhost:8080/health || echo "❌ Service not healthy"

test-api: ## 🧪 Testar API completa
	@echo "🔍 Testing health endpoint..."
	curl -s http://localhost:8080/health | jq .
	@echo ""
	@echo "💰 Testing payout processing..."
	curl -s -X POST http://localhost:8080/payouts/batch \
		-H "Content-Type: application/json" \
		--data @seeds/payouts_batch_example.json | jq .

stress-test: ## ⚡ Teste de stress básico
	@echo "🚀 Running stress test..."
	for i in {1..10}; do \
		curl -s -X POST http://localhost:8080/payouts/batch \
			-H "Content-Type: application/json" \
			--data @seeds/payouts_batch_example.json > /dev/null & \
	done; wait
	@echo "✅ Stress test completed"

# 📋 Documentation
docs: ## 📚 Gerar documentação
	godoc -http=:6060 &
	@echo "📚 Documentation available at http://localhost:6060"

tree: ## 🌳 Mostrar estrutura do projeto
	tree -I 'bin|vendor|node_modules|.git' .

install-tools: ## 🛠️ Instalar ferramentas de desenvolvimento
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install mvdan.cc/gofumpt@latest
	go install github.com/cosmtrek/air@latest

# 📊 Statistics
stats: ## 📊 Estatísticas do projeto
	@echo "📊 Project Statistics:"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📁 Files:"
	@find . -name "*.go" -not -path "./vendor/*" | wc -l | xargs echo "  Go files:"
	@find . -name "*.sql" | wc -l | xargs echo "  SQL files:"
	@echo "📏 Lines of code:"
	@find . -name "*.go" -not -path "./vendor/*" -exec wc -l {} + | tail -n1 | awk '{print "  Go: " $$1 " lines"}'
	@echo "📦 Dependencies:"
	@go list -m all | wc -l | xargs echo "  Modules:"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"