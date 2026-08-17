import { Pool } from "pg";
import { config } from "../config/env.config";

export const pool = new Pool({
  host: config.db.dbHost,
  port: config.db.dbPort,
  user: config.db.dbUser,
  password: config.db.dbPassword,
  database: config.db.dbName,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
  process.exit(1);
});