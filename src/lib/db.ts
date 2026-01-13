import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2571@localhost:5432/lahtokohta?schema=public',
});

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
};
