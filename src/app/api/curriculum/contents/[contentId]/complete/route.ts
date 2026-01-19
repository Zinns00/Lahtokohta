
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getUserLevelInfo, getWorkspaceMaxXP } from '@/lib/levelSystem';

// Helper to calculate Level from XP (Account Level)
// Formula: Level = Math.floor(Math.sqrt(XP / 100)) + 1
function calculateLevel(xp: number) {
    return Math.floor(Math.sqrt(xp / 1000)) + 1; // Using 1000 base as per previous discussions/files if referenced?
    // Wait, let's check PLANNING.md or previous knowledge.
    // User mentioned "Level 1 promotion XP is 1000XP" in the specific User Request about balance.
    // Let's assume standard formula or just stick to adding XP. Front-end usually calculates display level, but we assume backend stores totalXP.
    // We update totalXP.
}

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

// POST: Toggle content completion
export async function POST(
    request: Request,
    { params }: { params: Promise<{ contentId: string }> }
) {
    try {
        const user = await getUser();
        if (!user || typeof user.userId !== 'string') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.userId;

        const { contentId } = await params;
        const cId = parseInt(contentId);

        // 1. Get Content & Chapter Info
        const content = await prisma.curriculumContent.findUnique({
            where: { id: cId },
            include: { chapter: true }
        });

        if (!content) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        // 2. Toggle Status
        const newStatus = !content.isDone;
        const updatedContent = await prisma.curriculumContent.update({
            where: { id: cId },
            data: { isDone: newStatus }
        });

        // 3. XP Logic
        // Ranges: EASY(10-150), NORMAL(150-450), HARD(450-1000)
        let minXP = 150, maxXP = 450;
        if (content.difficulty === 'EASY') { minXP = 10; maxXP = 150; }
        else if (content.difficulty === 'HARD') { minXP = 450; maxXP = 1000; }

        // Deterministic Random (Pseudo-random based on Content ID)
        // Allows "random" distribution but prevents "re-roll" exploit by toggling undo/redo.
        const seed = cId * 9973;
        const rand = Math.abs(Math.sin(seed)); // deterministic 0.0 ~ 1.0 (approx)
        const baseXP = Math.floor(rand * (maxXP - minXP + 1)) + minXP;

        // Calculate Amount
        let xpAmount = baseXP;
        let isPenalty = false;

        // Apply Penalty if Forced Unlocked
        if (content.chapter.isForcedUnlocked) {
            isPenalty = true;
            xpAmount = Math.floor(baseXP * 0.7); // 30% Penalty
        }

        // Determine Change Direction (Gain or Loss)
        const xpChange = newStatus ? xpAmount : -xpAmount;

        const workspaceId = content.chapter.workspaceId;

        // Transaction
        await prisma.$transaction(async (tx) => {
            // Update Workspace XP
            const ws = await tx.workspace.findUnique({ where: { id: workspaceId } });
            if (ws) {
                let newWsXP = ws.currentXP + xpChange;
                let newWsLevel = ws.level;

                // Handle Level Up
                if (xpChange > 0) {
                    while (newWsXP >= getWorkspaceMaxXP(newWsLevel)) {
                        newWsXP -= getWorkspaceMaxXP(newWsLevel);
                        newWsLevel++;
                    }
                }
                // Handle Level Down (Simple rollback)
                else {
                    while (newWsXP < 0 && newWsLevel > 1) {
                        newWsLevel--;
                        newWsXP += getWorkspaceMaxXP(newWsLevel);
                    }
                    if (newWsXP < 0) newWsXP = 0; // Cap at 0 for level 1
                }

                await tx.workspace.update({
                    where: { id: workspaceId },
                    data: { currentXP: newWsXP, level: newWsLevel }
                });
            }

            // Update User XP
            const u = await tx.user.findUnique({ where: { id: userId } });
            if (u) {
                await tx.user.update({
                    where: { id: userId },
                    data: { totalXP: { increment: xpChange } }
                });
            }
        });

        return NextResponse.json({
            content: updatedContent,
            gainedXP: newStatus ? xpAmount : 0,
            removedXP: newStatus ? 0 : xpAmount,
            isPenalty
        });

    } catch (error: any) {
        console.error('Error toggling content:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
