
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId: idStr } = await params;
        const workspaceId = parseInt(idStr);

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { streak: true }
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const attendances = await prisma.attendance.findMany({
            where: { workspaceId: workspaceId },
            orderBy: { startTime: 'desc' },
            take: 365 // Limit to a year for now
        });

        // Map to UI format if needed, or send raw
        return NextResponse.json({
            streak: workspace.streak,
            attendances
        });

    } catch (error) {
        console.error('Fetch attendance error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
