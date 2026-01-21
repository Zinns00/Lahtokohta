
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

// GET: List chapters for a workspace
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

        const chapters = await prisma.chapter.findMany({
            where: { workspaceId: wId },
            include: {
                contents: {
                    orderBy: { id: 'asc' }
                }
            },
            orderBy: { orderIndex: 'asc' }
        });

        return NextResponse.json(chapters);
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new Chapter
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
        const { title, week } = body;

        // Auto-increment orderIndex
        const lastChapter = await prisma.chapter.findFirst({
            where: { workspaceId: wId },
            orderBy: { orderIndex: 'desc' }
        });
        const newOrderIndex = lastChapter ? lastChapter.orderIndex + 1 : 0;

        // Determine locked status: First chapter is unlocked, others locked by default
        const isLocked = newOrderIndex > 0;

        const newChapter = await prisma.chapter.create({
            data: {
                workspaceId: wId,
                title,
                week,
                orderIndex: newOrderIndex,
                isLocked,
                isForcedUnlocked: false
            }
        });

        // Let's refine the logic:
        if (newOrderIndex <= 3) {
            await prisma.chapter.update({
                where: { id: newChapter.id },
                data: { isLocked: false }
            });
            newChapter.isLocked = false;
        }

        return NextResponse.json(newChapter);

    } catch (error: any) {
        console.error('Error creating chapter:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
