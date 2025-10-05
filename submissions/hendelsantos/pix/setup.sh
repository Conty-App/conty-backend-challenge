#!/bin/bash

# Setup script for Conty PIX Challenge
# Author: Hendel Santos

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${BLUE}"
echo "██████╗ ██╗██╗  ██╗     ██████╗ ██████╗ ███╗   ██╗████████╗██╗   ██╗"
echo "██╔══██╗██║╚██╗██╔╝    ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝╚██╗ ██╔╝"
echo "██████╔╝██║ ╚███╔╝     ██║     ██║   ██║██╔██╗ ██║   ██║    ╚████╔╝ "
echo "██╔═══╝ ██║ ██╔██╗     ██║     ██║   ██║██║╚██╗██║   ██║     ╚██╔╝  "
echo "██║     ██║██╔╝ ██╗    ╚██████╗╚██████╔╝██║ ╚████║   ██║      ██║   "
echo "╚═╝     ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝      ╚═╝   "
echo -e "${NC}"
echo -e "${GREEN}🚀 Setup do Sistema de Pagamentos PIX${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "Este script não deve ser executado como root"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
log_info "Verificando pré-requisitos..."

# Check Go
if command_exists go; then
    GO_VERSION=$(go version | grep -oE 'go[0-9]+\.[0-9]+' | cut -d'o' -f2)
    log_success "Go encontrado: versão $GO_VERSION"
else
    log_error "Go não encontrado. Instale Go 1.23+ em https://golang.org/dl/"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    PG_VERSION=$(psql --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    log_success "PostgreSQL encontrado: versão $PG_VERSION"
else
    log_warning "PostgreSQL não encontrado. Tentando instalar..."
    sudo apt update && sudo apt install -y postgresql postgresql-contrib || {
        log_error "Falha ao instalar PostgreSQL"
        exit 1
    }
fi

# Check Docker (optional)
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log_success "Docker encontrado: versão $DOCKER_VERSION"
else
    log_warning "Docker não encontrado (opcional para desenvolvimento)"
fi

# Check Docker Compose (optional)
if command_exists docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    log_success "Docker Compose encontrado: versão $COMPOSE_VERSION"
else
    log_warning "Docker Compose não encontrado (opcional para desenvolvimento)"
fi

echo ""
log_info "Configurando projeto..."

# Create .env file if it doesn't exist
if [[ ! -f .env ]]; then
    log_info "Criando arquivo .env..."
    cp .env.example .env
    log_success "Arquivo .env criado a partir do .env.example"
else
    log_warning "Arquivo .env já existe"
fi

# Install Go dependencies
log_info "Instalando dependências Go..."
go mod download
go mod tidy
log_success "Dependências Go instaladas"

# Setup PostgreSQL
log_info "Configurando PostgreSQL..."

# Start PostgreSQL service if not running
if ! sudo systemctl is-active --quiet postgresql; then
    log_info "Iniciando serviço PostgreSQL..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Create database
log_info "Criando banco de dados 'conty_pix'..."
sudo -u postgres createdb conty_pix 2>/dev/null || log_warning "Banco 'conty_pix' já existe"

# Set password for postgres user
log_info "Configurando senha do usuário postgres..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || true

# Run migrations
log_info "Executando migrações do banco..."
sudo -u postgres psql -d conty_pix -f migrations/001_initial_schema.up.sql
log_success "Migrações aplicadas com sucesso"

# Verify database setup
log_info "Verificando configuração do banco..."
TABLES=$(sudo -u postgres psql -d conty_pix -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [[ $TABLES -gt 0 ]]; then
    log_success "Banco configurado com $TABLES tabelas"
else
    log_error "Problema na configuração do banco"
    exit 1
fi

# Build application
log_info "Compilando aplicação..."
go build -o bin/api cmd/api/main.go
log_success "Aplicação compilada com sucesso"

# Test build
log_info "Testando compilação..."
if [[ -x "bin/api" ]]; then
    log_success "Binário executável criado: bin/api"
else
    log_error "Falha na criação do binário"
    exit 1
fi

echo ""
log_success "🎉 Setup concluído com sucesso!"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Execute: ${GREEN}make run${NC} para iniciar a aplicação"
echo "2. Teste: ${GREEN}curl http://localhost:8080/health${NC}"
echo "3. Processe pagamentos: ${GREEN}make test-api${NC}"
echo ""
echo -e "${BLUE}Comandos úteis:${NC}"
echo "• ${GREEN}make help${NC}     - Ver todos os comandos disponíveis"
echo "• ${GREEN}make dev${NC}      - Iniciar com Docker"
echo "• ${GREEN}make test${NC}     - Executar testes"
echo "• ${GREEN}make logs${NC}     - Ver logs da aplicação"
echo ""
echo -e "${GREEN}✨ Divirta-se processando pagamentos PIX! ✨${NC}"