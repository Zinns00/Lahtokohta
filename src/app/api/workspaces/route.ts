import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createWorkspaceSchema } from '@/lib/validators/workspace';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');

// Helper to get user from token
async function getUser(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUser(req);
        if (!user || !user.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const data = createWorkspaceSchema.parse(body);

        // Ensure tables exist (Lazy init for demo purposes)
        await db.query(`
            CREATE TABLE IF NOT EXISTS "Workspace" (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                color VARCHAR(50) DEFAULT 'bronze',
                category VARCHAR(50),
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                description TEXT,
                min_study_hours INTEGER DEFAULT 0,
                creator_id INTEGER NOT NULL references "User"(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // WorkspaceMember table creation if needed...

        const result = await db.query(
            `INSERT INTO "Workspace" (title, color, category, start_date, end_date, description, min_study_hours, creator_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, title, color, category, description, created_at`,
            [
                data.title,
                data.color,
                data.category || 'General',
                data.startDate ? new Date(data.startDate) : null,
                data.endDate ? new Date(data.endDate) : null,
                data.description || '',
                data.minStudyHours,
                user.userId
            ]
        );

        const newWorkspace = result.rows[0];

        // Add creator as owner in WorkspaceMember
        /*
        await db.query(
            `INSERT INTO "WorkspaceMember" (workspace_id, user_id, role) VALUES ($1, $2, 'owner')`,
            [newWorkspace.id, user.userId]
        );
        */

        return NextResponse.json(newWorkspace, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid data', errors: error.flatten() }, { status: 400 });
        }
        console.error('Create Workspace Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const user = await getUser(req);
        if (!user || !user.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Fetch workspaces created by user (and eventually joined by user)
        const result = await db.query(
            `SELECT * FROM "Workspace" WHERE creator_id = $1 ORDER BY created_at DESC`,
            [user.userId]
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Fetch Workspaces Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
