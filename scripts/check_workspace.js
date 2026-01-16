
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const workspaces = await prisma.workspace.findMany({
            where: { id: 9 },
            select: { id: true, title: true, difficulty: true, level: true, currentXP: true, streak: true }
        });
        console.log('Workspaces:', JSON.stringify(workspaces, null, 2));

        const attendance = await prisma.attendance.findMany({
            where: { workspaceId: 9 },
            select: { id: true, startTime: true, note: true },
            orderBy: { startTime: 'desc' },
            take: 3
        });
        console.log('Attendance:', JSON.stringify(attendance, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
