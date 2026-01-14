
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const workspaces = await prisma.workspace.findMany();
    workspaces.forEach(w => {
        console.log(`ID: ${w.id}, Title: ${w.title}, Diff: ${w.difficulty}, CreatedAt: ${w.createdAt}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
