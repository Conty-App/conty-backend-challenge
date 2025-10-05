import { knex as setupKnex, Knex } from "knex";
import dotenv from "dotenv";
dotenv.config();

export const config: Knex.Config = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: { min: 2, max: 10 },
  migrations: {
    extension: "ts",
    directory: "./submissions/igorpardinho/pix/src/database/migrations",
  },
};
export const knex = setupKnex(config);
