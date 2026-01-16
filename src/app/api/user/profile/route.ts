
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');

async function getUser(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const payload = await getUser(req);
        if (!payload || !payload.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { username, bio, image, equippedFrame } = body;

        // Perform Update
        const updatedUser = await prisma.user.update({
            where: { id: payload.userId as string },
            data: {
                username,
                bio,
                image,
                equippedFrame,
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
