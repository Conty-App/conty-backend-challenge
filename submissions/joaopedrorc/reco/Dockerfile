FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY . .

RUN pnpm build

FROM node:22-alpine AS production
