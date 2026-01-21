"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signupSchema, LoginInput, SignupInput } from '@/lib/validators/auth';
import { FaEye, FaEyeSlash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import styles from './AuthModal.module.css'; // Import generic CSS
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // New Success State
    const router = useRouter();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-overlay"
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose} // Close on backdrop click
                >
                    <motion.div
                        key="modal-content"
                        className={styles.modal}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent closing when clicking modal
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className={styles.closeButton}>
                            <FaTimes size={20} />
                        </button>

                        {/* Header */}
                        <div className={styles.header}>
                            {/* Logo in Modal */}
                            <div style={{ fontFamily: 'var(--font-grenze)', fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
                                Lähtökohta
                            </div>

                            {isSuccess ? (
                                <>
                                    <h2 className={styles.title} style={{ color: '#10b981' }}>Success!</h2>
                                    <p className={styles.subtitle}>회원가입이 완료되었습니다.</p>
                                </>
                            ) : (
                                <>
                                    <h2 className={styles.title}>
                                        {isLoginMode ? 'Welcome Back' : 'Create Account'}
                                    </h2>
                                    <p className={styles.subtitle}>
                                        {isLoginMode ? '성장을 위한 여정을 계속하세요.' : '새로운 성장의 시작을 함께해요.'}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Error Message */}
                        {errorMsg && (
                            <div className={styles.errorMessage}>
                                {errorMsg}
                            </div>
                        )}

                        {/* Forms & Success View */}
                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: "spring", duration: 0.5 }}
                                    className={styles.successView}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                                    >
                                        <FaCheckCircle size={80} color="#10b981" />
                                    </motion.div>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className={styles.successText}
                                    >
                                        잠시 후 로그인 화면으로 이동합니다...
                                    </motion.p>
                                </motion.div>
                            ) : isLoginMode ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <LoginForm
                                        onError={setErrorMsg}
                                        setIsLoading={setIsLoading}
                                        isLoading={isLoading}
                                        onSuccess={() => {
                                            onClose();
                                            router.push('/dashboard');
                                        }}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signup"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <SignupForm
                                        onError={setErrorMsg}
                                        setIsLoading={setIsLoading}
                                        isLoading={isLoading}
                                        onSuccess={() => {
                                            // Show Success View instead of Alert
                                            setIsSuccess(true);
                                            setErrorMsg(null);

                                            // Auto switch to login after 2 seconds
                                            setTimeout(() => {
                                                setIsSuccess(false);
                                                setIsLoginMode(true);
                                            }, 2200);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Toggle Mode */}
                        <div className={styles.toggleArea}>
                            {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                            <button
                                onClick={() => {
                                    setIsLoginMode(!isLoginMode);
                                    setErrorMsg(null);
                                }}
                                className={styles.toggleButton}
                            >
                                {isLoginMode ? '회원가입' : '로그인'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ----------------------------------------------------------------------
// Login Form Component
// ----------------------------------------------------------------------
function LoginForm({ onError, isLoading, setIsLoading, onSuccess }: any) {
    const [showPw, setShowPw] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true);
        onError(null);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            // Defensive: Check content type or try/catch parsing
            let result;
            try {
                result = await res.json();
            } catch (jsonError) {
                // If JSON parse fails (e.g. 500 HTML page), throw generic error
                console.error("Failed to parse response:", jsonError);
                throw new Error(`Server Error (${res.status}): Please check console or try again.`);
            }

            if (!res.ok) throw new Error(result.message || '로그인 실패');
            onSuccess();
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {/* Username */}
            <div className={styles.inputGroup}>
                <label className={styles.label}>ID</label>
                <input
                    {...register('username')}
                    className={styles.input}
                    placeholder="아이디를 입력하세요"
                />
                {errors.username && <p className={styles.errorText}>{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                    <input
                        {...register('password')}
                        type={showPw ? 'text' : 'password'}
                        className={styles.input}
                        placeholder="비밀번호를 입력하세요"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className={styles.eyeButton}
                    >
                        {showPw ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? '로그인 중...' : '로그인'}
            </button>
        </form>
    );
}

// ----------------------------------------------------------------------
// Signup Form Component
// ----------------------------------------------------------------------
function SignupForm({ onError, isLoading, setIsLoading, onSuccess }: any) {
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupInput) => {
        setIsLoading(true);
        onError(null);
        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            // Defensive: Safely handle non-JSON responses
            let result;
            try {
                result = await res.json();
            } catch (jsonError) {
                console.error("Failed to parse response:", jsonError);
                throw new Error(`Server Error (${res.status}): Please try again later.`);
            }

            if (!res.ok) throw new Error(result.message || '회원가입 실패');
            onSuccess(); // Trigger Success View in parent
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {/* Username */}
            <div className={styles.inputGroup}>
                <label className={styles.label}>ID</label>
                <input
                    {...register('username')}
                    className={styles.input}
                    placeholder="한글, 영문, 숫자 (3~13자)"
                />
                {errors.username && <p className={styles.errorText}>{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div className={styles.inputGroup}>
                <label className={styles.label}>Email</label>
                <input
                    {...register('email')}
                    className={styles.input}
                    placeholder="example@email.com"
                />
                {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                    <input
                        {...register('password')}
                        type={showPw ? 'text' : 'password'}
                        className={styles.input}
                        placeholder="비밀번호 설정"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className={styles.eyeButton}
                    >
                        {showPw ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-1">
                    * 영문, 숫자, 특수문자(!@#$) 포함 8자 이상
                </p>
                {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.inputWrapper}>
                    <input
                        {...register('confirmPassword')}
                        type={showConfirmPw ? 'text' : 'password'}
                        className={styles.input}
                        placeholder="비밀번호 다시 입력"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className={styles.eyeButton}
                    >
                        {showConfirmPw ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className={styles.errorText}>{errors.confirmPassword.message}</p>
                )}
            </div>

            <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? '가입 중...' : '회원가입 완료'}
            </button>
        </form>
    );
}
