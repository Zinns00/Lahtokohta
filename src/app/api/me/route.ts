import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');

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
        const { payload } = await jwtVerify(token, SECRET_KEY);

        if (!payload.userId) {
            return NextResponse.json(
                { message: 'Invalid token payload' },
                { status: 401 }
            );
        }

        // Optional: Fetch fresh user data from DB to ensure user still exists
        // simplified query for now
        const result = await db.query('SELECT id, username, email, "createdAt" FROM "User" WHERE id = $1', [
            payload.userId,
        ]);
        const user = result.rows[0];

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Auth Check Error:', error);
        return NextResponse.json(
            { message: 'Authentication failed' },
            { status: 401 }
        );
    }
}
