FROM rust:1.90-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN cargo build --release

EXPOSE 8080

CMD ["./target/release/pix"]