
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const workspaceId = 11; // Workspace 'test case'
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    try {
        const deleteResult = await prisma.attendance.deleteMany({
            where: {
                workspaceId: workspaceId,
                startTime: { gte: startOfDay }
            }
        });
        console.log(`Deleted ${deleteResult.count} attendance records for today.`);

        // Also reset currentXP if needed? No, user wants to see it go UP.
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
