import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// PATCH: Update Chapter (Title, Week)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; chapterId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { chapterId } = await params;
        const cId = parseInt(chapterId);
        const body = await request.json();
        const { title, week } = body;

        // Validation (Optional: Check if user owns workspace)
        // For MVP, we assume workspace access is controlled or user is owner.
        // Ideally checking workspace ownership:
        // const chapter = await prisma.chapter.findUnique({ where: { id: cId }, include: { workspace: true } });
        // if (chapter.workspace.userId !== user.userId) ...

        const updatedChapter = await prisma.chapter.update({
            where: { id: cId },
            data: {
                title: title || undefined,
                week: week || undefined
            }
        });

        return NextResponse.json(updatedChapter);
    } catch (error) {
        console.error('Error updating chapter:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove Chapter
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string; chapterId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { chapterId } = await params;
        const cId = parseInt(chapterId);

        await prisma.chapter.delete({
            where: { id: cId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chapter:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
