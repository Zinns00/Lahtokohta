import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { JWT_SECRET_KEY } from '@/lib/auth-constants';

export async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
        return payload;
    } catch (error) {
        return null;
    }
}
