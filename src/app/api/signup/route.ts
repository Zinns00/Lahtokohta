import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use Prisma
import { signupSchema } from '@/lib/validators/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, email, password } = signupSchema.parse(body);

        // 1. Check if user exists (Prisma)
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.username === username) {
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

        // 3. Create user (Prisma)
        await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                // totalXP maps to default 0 in schema
            }
        });

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
