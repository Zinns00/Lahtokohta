import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use Prisma
import { createWorkspaceSchema } from '@/lib/validators/workspace';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';

// Helper to get user from token
async function getUser(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
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
                category: data.category || 'General',
                difficulty: data.difficulty,

                // Map Date strings to Date objects
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                endDate: data.endDate ? new Date(data.endDate) : null,
                minStudyHours: data.minStudyHours || 0,

                // Relation to User
                user: {
                    connect: { id: user.userId as string }
                },
            } as any
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
