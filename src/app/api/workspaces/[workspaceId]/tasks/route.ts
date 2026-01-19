import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

async function getUser() {
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

// GET: List tasks (Personal Forum)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await params;
        const wId = parseInt(workspaceId);

        const tasks = await prisma.task.findMany({
            where: { workspaceId: wId, type: 'PERSONAL' },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tasks);
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new task (Personal Forum Post)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await params;
        const wId = parseInt(workspaceId);

        const body = await request.json();
        const { title, content, tags, difficulty } = body;

        // Determine XP based on difficulty
        let xp = 100;
        if (difficulty === 'EASY') xp = 25;
        if (difficulty === 'HARD') xp = 250;

        const newTask = await prisma.task.create({
            data: {
                workspaceId: wId,
                title: title || '',
                content: content || '',
                type: 'PERSONAL',
                priority: 'MEDIUM',
                difficulty: difficulty || 'NORMAL',
                tags: tags || [],
                xpReward: xp
            }
        });

        return NextResponse.json(newTask);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
