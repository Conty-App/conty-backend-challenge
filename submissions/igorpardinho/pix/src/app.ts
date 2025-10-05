import fastify from "fastify";
import payoutRoutes from "./routes/payout";

export const app = fastify({ logger: true });

app.register(payoutRoutes, { prefix: "payouts" });
