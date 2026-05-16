import { Database } from '@yanit/jsondb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../../.jsondb/test-case-admin');

let dbInstance = null;

export async function getAdminDatabase(options = {}) {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  dbInstance = new Database(DB_PATH, {
    jsonb: true,
    cacheTTL: 5000,
    enableQueryCache: true,
    queryCacheTTL: 30000,
    ...options,
  });

  await dbInstance.open();
  return dbInstance;
}

export function getAdminDatabasePath() {
  return DB_PATH;
}
