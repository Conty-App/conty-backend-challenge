import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: 'file:./src/db/sqlite.db',
});

export const db = drizzle(client, { schema });