
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const workspaces = await prisma.workspace.findMany({
            select: { id: true, title: true }
        });
        console.log('All Workspaces:', JSON.stringify(workspaces, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
