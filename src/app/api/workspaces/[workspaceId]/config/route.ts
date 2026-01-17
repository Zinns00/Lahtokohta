// API to handle Workspace Table Configuration Persistence
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';

// Helper to get user
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

export async function GET(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
    try {
        const user = await getUser(req);
        if (!user || !user.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId: idStr } = await params;
        const workspaceId = parseInt(idStr);
        if (isNaN(workspaceId)) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { userId: true, tableConfig: true, extraRows: true }
        });

        if (!workspace) return NextResponse.json({ message: 'Not Found' }, { status: 404 });
        if (workspace.userId !== user.userId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        return NextResponse.json({
            tableConfig: workspace.tableConfig,
            extraRows: workspace.extraRows
        });

    } catch (e) {
        console.error('Get Config Error:', e);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
    try {
        const user = await getUser(req);
        if (!user || !user.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId: idStr } = await params;
        const workspaceId = parseInt(idStr);

        const body = await req.json();
        const { tableConfig, extraRows } = body;

        // Verify ownership
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { userId: true }
        });

        if (!workspace) return NextResponse.json({ message: 'Not Found' }, { status: 404 });
        if (workspace.userId !== user.userId) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        // Update
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                tableConfig: tableConfig ?? undefined,
                extraRows: extraRows ?? undefined
            }
        });

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('Save Config Error:', e);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}
