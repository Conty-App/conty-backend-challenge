FROM golang:1.25.1-alpine AS build

WORKDIR /app

COPY . .

RUN go mod download
RUN go build -o main .

EXPOSE 8080

CMD ["./main"]