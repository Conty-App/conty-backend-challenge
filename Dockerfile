# Base image
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json primeiro (para cache)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todo o código
COPY . .

# Expõe porta da aplicação
EXPOSE 8080

# Comando de desenvolvimento (pode ser alterado para produção depois)
CMD ["npm", "run", "dev"]
