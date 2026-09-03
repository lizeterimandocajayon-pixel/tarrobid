import { neon } from '@neondatabase/serverless';

// Reuse connection across requests in serverless environment
let sql;

export function getDb() {
  if (!sql) {
    sql = neon(process.env.TARROBID_DATABASE_URL);
  }
  return sql;
}
