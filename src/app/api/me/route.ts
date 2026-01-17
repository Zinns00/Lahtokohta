import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use Prisma
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getUserLevelInfo } from '@/lib/levelSystem';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Verify JWT
        const { payload } = await jwtVerify(token, JWT_SECRET_KEY);

        if (!payload.userId) {
            return NextResponse.json(
                { message: 'Invalid token payload' },
                { status: 401 }
            );
        }

        // Fetch user with Prisma
        const user = await prisma.user.findUnique({
            where: { id: payload.userId as string },
            select: {
                id: true,
                username: true,
                email: true,
                totalXP: true,
                // Add any other fields you need
            }
        });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Calculate Level Info
        const levelInfo = getUserLevelInfo(user.totalXP || 0);

        return NextResponse.json({
            user: {
                ...user,
                levelInfo // Inject calculated level data
            }
        });
    } catch (error) {
        console.error('Auth Check Error:', error);
        return NextResponse.json(
            { message: 'Authentication failed' },
            { status: 401 }
        );
    }
}
