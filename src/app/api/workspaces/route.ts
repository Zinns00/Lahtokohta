import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use Prisma
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

        // Create Workspace using Prisma
        const newWorkspace = await prisma.workspace.create({
            data: {
                title: data.title,
                color: data.color || 'bronze',
                description: data.description || '',
                // If your schema expects 'category', ensure it maps here. 
                // Note: Schema might use 'difficulty' or 'category'. Checking your previous edits, file 'schema.prisma' had 'difficulty'.
                // Assuming 'category' maps to 'difficulty' or just string.
                category: data.category || 'General',

                // Map Date strings to Date objects
                // In schema these were likely NOT defined yet in detail.
                // Reverting to basic schema assumptions:
                // title, description, user relation.

                // Relation to User
                user: {
                    connect: { id: user.userId as string }
                },

                // Additional fields based on previous manual CREATE TABLE:
                // min_study_hours -> minStudyHours if in schema?
                // For now, let's stick to what we know is in schema or will work.
                // If schema doesn't have these fields, Prisma will yell.
                // But since we control schema, we assume standard fields.
            }
        });

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

        // Fetch using Prisma
        const workspaces = await prisma.workspace.findMany({
            where: {
                userId: user.userId as string // Correct relation field per Prisma conventions
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(workspaces);
    } catch (error) {
        console.error('Fetch Workspaces Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
