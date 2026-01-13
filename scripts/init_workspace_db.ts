
import { db } from '@/lib/db';

async function initWorkspaceTable() {
    try {
        console.log('Creating Workspace table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS "Workspace" (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                color VARCHAR(50) DEFAULT 'bronze',
                category VARCHAR(50),
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                description TEXT, /* Main Goal */
                min_study_hours INTEGER DEFAULT 0,
                creator_id INTEGER NOT NULL references "User"(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Workspace table created successfully.');

        console.log('Creating WorkspaceMember table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
                id SERIAL PRIMARY KEY,
                workspace_id INTEGER NOT NULL references "Workspace"(id),
                user_id INTEGER NOT NULL references "User"(id),
                role VARCHAR(20) DEFAULT 'member', /* owner, admin, member */
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(workspace_id, user_id)
            );
        `);
        console.log('WorkspaceMember table created successfully.');

    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

initWorkspaceTable();
