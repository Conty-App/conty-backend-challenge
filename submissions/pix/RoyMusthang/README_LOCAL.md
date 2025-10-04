# Desafio Conty – Josué Vitor Porto Lobo / @RoyMusthang}

> **Local da submissão:** `submissions/RoyMusthang/pix

## Como rodar
- Requisitos: Docker
- Comandos: `make docker-run`
- Variáveis: ver `.env.example`

## Endpoints
POST /payouts/batch

Processa um lote de pagamentos.

Request
curl -X POST http://localhost:8080/payouts/batch \
  -H "content-type: application/json" \
  --data @seeds/payouts_batch_example.json

## Arquitetura
- Desenho rápido das camadas
- Principais decisões e trade‑offs
- O que faria diferente com mais tempo


## IA/Libraries
- [go-blueprint](https://github.com/Melkeydev/go-blueprint): criação de base rápida com os principais frameworks
- [goose](https://github.com/pressly/goose): migrations
- [gin-gonic](https://gin-gonic.com/): web framework
