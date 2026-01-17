import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';

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
        if (isNaN(workspaceId)) {
            return NextResponse.json({ message: 'Invalid Workspace ID' }, { status: 400 });
        }

        const workspace = await prisma.workspace.findUnique({
            where: {
                id: workspaceId
            },
            include: {
                tasks: {
                    orderBy: { createdAt: 'desc' }
                },
                attendances: {
                    orderBy: { startTime: 'desc' },
                    take: 7
                },
                user: {
                    select: {
                        username: true,
                        image: true,
                        totalXP: true,
                        title: true,
                        equippedFrame: true
                    }
                }
            }
        });

        if (!workspace) {
            return NextResponse.json({ message: 'Workspace not found' }, { status: 404 });
        }

        if (workspace.userId !== user.userId) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Get Workspace Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
