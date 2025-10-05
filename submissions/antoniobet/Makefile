.PHONY: help install dev build test test-e2e lint clean seed docker-build docker-up all

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:
	npm install
	npx prisma generate

dev:
	npm run start:dev

build:
	npm run build

test:
	npm run test

test-e2e:
	npm run test:e2e

lint:
	npm run lint

clean:
	rm -rf dist node_modules prisma/dev.db

seed:
	npx prisma migrate dev --name init
	npx prisma db seed

docker-build:
	docker build -t recommendations-api .

docker-up:
	docker run -p 3000:3000 recommendations-api

all: install seed dev