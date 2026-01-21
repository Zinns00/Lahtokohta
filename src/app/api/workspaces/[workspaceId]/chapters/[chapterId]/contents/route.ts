
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

// POST: Add content to a chapter
export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; chapterId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chapterId } = await params;
        const cId = parseInt(chapterId);

        const body = await request.json();
        const { title, description, type, difficulty } = body;

        if (!title || !type) {
            return NextResponse.json({ error: 'Title and Type are required' }, { status: 400 });
        }

        const newContent = await prisma.curriculumContent.create({
            data: {
                chapterId: cId,
                title,
                description,
                type,
                difficulty: difficulty || 'NORMAL',
                isDone: false
            }
        });

        return NextResponse.json(newContent);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
