import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validators/auth';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { z } from 'zod';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-change-this');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = loginSchema.parse(body);

        // 1. Find user
        const result = await db.query('SELECT * FROM "User" WHERE username = $1', [
            username,
        ]);
        const user = result.rows[0];

        if (!user) {
            return NextResponse.json(
                { message: '존재하지 않는 아이디입니다.' },
                { status: 401 }
            );
        }

        // 2. Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
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
            .sign(SECRET_KEY);

        // 4. Set Cookie
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
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: '입력 값이 올바르지 않습니다.', errors: error },
                { status: 400 }
            );
        }
        console.error('Login Error:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
