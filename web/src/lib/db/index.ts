import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDbConnection() {
  if (_db) return _db;
  
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  // Ensure we only use the first URL if multiple are concatenated
  connectionString = connectionString.split('\n')[0].trim();
  
  const sql = neon(connectionString);
  _db = drizzle(sql, { schema });
  return _db;
}

// Proxy that lazily initializes the database connection
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const connection = getDbConnection();
    const value = connection[prop as keyof typeof connection];
    if (typeof value === "function") {
      return value.bind(connection);
    }
    return value;
  },
});

export * from "./schema";

