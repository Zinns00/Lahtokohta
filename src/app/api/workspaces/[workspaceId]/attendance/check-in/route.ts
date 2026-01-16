
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInMinutes, parse, isSameDay, subDays } from 'date-fns';
import { getUserLevelInfo, getWorkspaceMaxXP, getDifficultyMultiplier } from '@/lib/levelSystem';

// ... (existing code)



export async function POST(
    request: Request,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId: idStr } = await params;
        const workspaceId = parseInt(idStr);
        const { startTime, endTime, date, type = 'confirm' } = await request.json();

        if (!startTime || !endTime || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Validate Time & Duration
        const today = new Date();
        const checkInDate = new Date(date);
        const start = parse(startTime, 'HH:mm', checkInDate);
        const end = parse(endTime, 'HH:mm', checkInDate);

        let durationMin = differenceInMinutes(end, start);
        if (durationMin < 0) {
            // Handle cross-midnight case if necessary, or just reject
            return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { minStudyHours: true, streak: true, userId: true, level: true, currentXP: true, difficulty: true }
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const ownerId = workspace.userId;
        const difficulty = workspace.difficulty as 'Easy' | 'Normal' | 'Hard';

        const minMinutes = workspace.minStudyHours * 60;

        // 2. Check for Existing Attendance Today
        const startOfDay = new Date(checkInDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(checkInDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                workspaceId: workspaceId,
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // --- DRAFT MODE ---
        if (type === 'save') {
            // Create or Update as Draft
            // Use upsert-like logic: if exists, update. if not, create.
            let attendance;
            if (existingAttendance) {
                // If already officially checked in, don't overwrite with draft (client shouldn't send, but safety)
                if (existingAttendance.note !== 'DRAFT') {
                    return NextResponse.json({ success: true, message: 'Already verified, skipped draft save' });
                }
                attendance = await prisma.attendance.update({
                    where: { id: existingAttendance.id },
                    data: { startTime: start, endTime: end, durationMin, note: 'DRAFT' }
                });
            } else {
                attendance = await prisma.attendance.create({
                    data: {
                        startTime: start, endTime: end, durationMin, workspaceId, note: 'DRAFT'
                    }
                });
            }
            return NextResponse.json({ success: true, mode: 'draft' });
        }

        // --- DELETE DRAFT MODE ---
        if (type === 'delete') {
            if (existingAttendance && existingAttendance.note === 'DRAFT') {
                await prisma.attendance.delete({
                    where: { id: existingAttendance.id }
                });
                return NextResponse.json({ success: true, mode: 'deleted' });
            }
            return NextResponse.json({ success: true, message: 'Nothing to delete' });
        }

        // --- CONFIRM MODE ---

        // 1. Check if already done
        if (existingAttendance && existingAttendance.note !== 'DRAFT') {
            return NextResponse.json({ error: 'Already checked in today' }, { status: 409 });
        }

        // 2. Validate Duration (Only for confirm)
        if (durationMin < minMinutes) {
            return NextResponse.json({
                error: `최소 학습 시간(${workspace.minStudyHours}시간)을 채우지 못했습니다. (현재: ${(durationMin / 60).toFixed(1)}시간)`
            }, { status: 400 });
        }

        // 3. Calculate Streak
        // Find the most recent attendance before today
        const lastAttendance = await prisma.attendance.findFirst({
            where: {
                workspaceId: workspaceId,
                startTime: { lt: startOfDay },
                note: { not: 'DRAFT' } // Only count valid check-ins
            },
            orderBy: { startTime: 'desc' }
        });

        let newStreak = 1;
        if (lastAttendance) {
            const lastDate = new Date(lastAttendance.startTime);
            const yesterday = subDays(startOfDay, 1);

            if (isSameDay(lastDate, yesterday)) {
                newStreak = workspace.streak + 1;
            } else if (isSameDay(lastDate, startOfDay)) {
                // Should be caught above, but fallback
                newStreak = workspace.streak;
            } else {
                newStreak = 1; // Streak broken
            }
        }

        // 4. Calculate XP
        // Formula: (10 * minStudyHours) * DiffMultiplier * StreakMultiplier
        const baseXP = 10 * workspace.minStudyHours;
        const diffMultiplier = getDifficultyMultiplier(difficulty);
        const streakMultiplier = 1 + 0.2 * (newStreak - 1);

        const xpReward = Math.floor(baseXP * diffMultiplier * streakMultiplier);

        // 4.5 Calculate Workspace Level Up
        let newWorkspaceLevel = workspace.level;
        let newWorkspaceXP = workspace.currentXP + xpReward;

        while (true) {
            const maxXP = getWorkspaceMaxXP(newWorkspaceLevel);
            if (newWorkspaceXP >= maxXP) {
                newWorkspaceXP -= maxXP;
                newWorkspaceLevel++;
            } else {
                break;
            }
        }

        // 5. Transaction: Update User, Workspace, Create Attendance
        const result = await prisma.$transaction(async (tx) => {
            // Update or Create Attendance
            let attendance;
            if (existingAttendance) {
                attendance = await tx.attendance.update({
                    where: { id: existingAttendance.id },
                    data: { startTime: start, endTime: end, durationMin, note: 'CHECK-IN' }
                });
            } else {
                attendance = await tx.attendance.create({
                    data: {
                        startTime: start, endTime: end, durationMin, workspaceId, note: 'CHECK-IN'
                    }
                });
            }

            // Update Workspace Streak & Level
            await tx.workspace.update({
                where: { id: workspaceId },
                data: {
                    streak: newStreak,
                    level: newWorkspaceLevel,
                    currentXP: newWorkspaceXP
                }
            });

            // Update User XP
            const user = await tx.user.findUnique({ where: { id: ownerId } });
            if (!user) throw new Error('User not found');

            const newTotalXP = user.totalXP + xpReward;

            await tx.user.update({
                where: { id: ownerId },
                data: { totalXP: newTotalXP }
            });

            return { attendance, newTotalXP };
        });

        // 6. Get New Level Info
        const levelInfo = getUserLevelInfo(result.newTotalXP);

        return NextResponse.json({
            success: true,
            streak: newStreak,
            addedXP: xpReward,
            levelInfo,
            newTotalXP: result.newTotalXP,
            attendance: result.attendance
        });

    } catch (error: any) {
        console.error('Check-in error FULL:', error);
        return NextResponse.json({
            error: `Server Error: ${error.message || 'Unknown'}`,
            details: JSON.stringify(error)
        }, { status: 500 });
    }
}
