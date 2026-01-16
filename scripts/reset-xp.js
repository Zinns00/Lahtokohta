
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const username = '김권희';
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            console.log(`User '${username}' not found.`);
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { username },
            data: { totalXP: 0 },
        });

        console.log(`Successfully reset XP for user '${updatedUser.username}'. New TotalXP: ${updatedUser.totalXP}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
