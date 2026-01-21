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

// POST: Toggle Task Completion (and XP)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string, taskId: string }> }
) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId, taskId } = await params;
        const wId = parseInt(workspaceId);
        const tId = parseInt(taskId);

        const task = await prisma.task.findUnique({
            where: { id: tId }
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const newStatus = !task.isDone;
        // Fixed XP Logic: Easy 25, Normal 100, Hard 250
        // We trust task.xpReward corresponds to difficulty as set in creation, 
        // OR we can recalculate based on task.difficulty just to be safe.
        // But existing tasks might have old XP? 
        // Let's use the stored xpReward if possible, but the prompt specified fixed XP now.
        // Creating task sets xpReward correctly. So we can use it.

        let xpAmount = task.xpReward;

        // Safety check for legacy tasks if xpReward is 10 (default) but difficulty is HARD
        if (xpAmount === 10) {
            if (task.difficulty === 'EASY') xpAmount = 25;
            else if (task.difficulty === 'HARD') xpAmount = 250;
            else xpAmount = 100;
        }

        const xpChange = newStatus ? xpAmount : -xpAmount;
        const userId = user.userId as string;

        // Transaction: Update Task, Workspace XP, User XP
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Task
            const updatedTask = await tx.task.update({
                where: { id: tId },
                data: { isDone: newStatus }
            });

            // 2. Update Workspace XP
            await tx.workspace.update({
                where: { id: wId },
                data: { currentXP: { increment: xpChange } }
            });

            // 3. Update User XP
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { totalXP: { increment: xpChange } }
            });

            return { updatedTask, newTotalXP: updatedUser.totalXP };
        });

        return NextResponse.json({
            task: result.updatedTask,
            newTotalXP: result.newTotalXP
        });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
