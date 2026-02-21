import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await db.execute(sql`SELECT id, nombre FROM clientes LIMIT 2`);

console.log('Type of result:', typeof result);
console.log('Is array:', Array.isArray(result));
console.log('Has rows property:', 'rows' in result);
console.log('Result:', JSON.stringify(result, null, 2));

await connection.end();
