import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, '아이디를 입력해주세요.'),
    password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export const signupSchema = z
    .object({
        username: z
            .string()
            .min(3, '아이디는 최소 3자 이상이어야 합니다.')
            .max(13, '아이디는 최대 13자까지 가능합니다.')
            .regex(/^[a-z0-9]+$/, '영문 소문자와 숫자만 사용 가능합니다.'),
        email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
        password: z
            .string()
            .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
            .regex(
                /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$|(?=.*[a-zA-Z])(?=.*[!@#$%^&*]).{8,}$|(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/,
                '영문, 숫자, 특수문자 중 2가지 이상을 조합해주세요.'
            ),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: '비밀번호가 일치하지 않습니다.',
        path: ['confirmPassword'],
    });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
