import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use Prisma
import { loginSchema } from '@/lib/validators/auth';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { z } from 'zod';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';

export async function POST(req: Request) {
    console.log('[API] Login Request Received');
    try {
        const body = await req.json();
        console.log('[API] Login Body:', body);

        const { username, password } = loginSchema.parse(body);

        // 1. Find user (Prisma)
        console.log('[API] Querying Prisma for user:', username);
        const user = await prisma.user.findUnique({
            where: { username }
        });
        console.log('[API] Prisma Result:', user ? 'User Found' : 'User Not Found');

        if (!user) {
            return NextResponse.json(
                { message: '존재하지 않는 아이디입니다.' },
                { status: 401 }
            );
        }

        // 2. Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('[API] Password Match:', passwordMatch);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: '비밀번호가 일치하지 않습니다.' },
                { status: 401 }
            );
        }

        // 3. Create Session (JWT using jose)
        const token = await new SignJWT({ userId: user.id, username: user.username })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(JWT_SECRET_KEY);

        // 4. Set Cookie
        console.log('[API] Login Successful, generating response');
        const response = NextResponse.json(
            { message: '로그인 성공', user: { id: user.id, username: user.username } },
            { status: 200 }
        );

        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('[API] Login CRITICAL Error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: '입력 값이 올바르지 않습니다.', errors: error },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.', debug: String(error) },
            { status: 500 }
        );
    }
}
