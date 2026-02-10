import { Elysia } from "elysia";
import { payoutsRoutes } from "./routes/payouts";

const app = new Elysia().use(payoutsRoutes).listen(8080);

console.log(`Server running at http://localhost:${app.server?.port}`);
