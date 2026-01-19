import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// PATCH: Update Content (Title, Description, Difficulty)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ contentId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { contentId } = await params;
        const cId = parseInt(contentId);
        const body = await request.json();
        const { title, description, difficulty } = body;

        const updatedContent = await prisma.curriculumContent.update({
            where: { id: cId },
            data: {
                title: title || undefined,
                description: description || undefined,
                difficulty: difficulty || undefined
            }
        });

        return NextResponse.json(updatedContent);
    } catch (error) {
        console.error('Error updating content:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove Content
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ contentId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { contentId } = await params;
        const cId = parseInt(contentId);

        await prisma.curriculumContent.delete({
            where: { id: cId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting content:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
