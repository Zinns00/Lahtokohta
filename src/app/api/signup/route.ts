import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signupSchema } from '@/lib/validators/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function POST(req: Request) {
    console.log('API Hit: /api/signup');
    try {
        const body = await req.json();
        const { username, email, password } = signupSchema.parse(body);

        // 1. Check if user exists
        const existingUser = await db.query(
            'SELECT * FROM "User" WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            if (existingUser.rows[0].username === username) {
                return NextResponse.json(
                    { message: '이미 사용 중인 아이디입니다.' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { message: '이미 가입된 이메일입니다.' },
                { status: 409 }
            );
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create user
        // Generate UUID manually since uuid-ossp might not be enabled
        const id = crypto.randomUUID();

        await db.query(
            `INSERT INTO "User" (id, username, email, password, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [id, username, email, hashedPassword]
        );

        return NextResponse.json(
            { message: '회원가입이 완료되었습니다.' },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: '입력 값이 올바르지 않습니다.', errors: error },
                { status: 400 }
            );
        }
        console.error('Signup Error:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.', debug: String(error) },
            { status: 500 }
        );
    }
}
