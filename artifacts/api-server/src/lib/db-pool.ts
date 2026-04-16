import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 15_000,
  query_timeout: 15_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  application_name: "rayzanmart-api",
});

pool.on("error", (err) => {
  console.error("Unexpected idle client error", err);
});

export default pool;

// Use pool.query() directly — avoids manual connect/release overhead
export async function query(sql: string, params?: any[]) {
  return pool.query(sql, params);
}
