"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { useEffect, useState } from 'react';

interface AttendanceRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: 'success' | 'info' | 'error';
    title?: string;
    message?: string;
    data?: {
        streak: number;
        addedXP: number;
        levelUp?: {
            prevLevel: number;
            newLevel: number;
        };
    } | null;
}

export default function AttendanceRewardModal({
    isOpen,
    onClose,
    type = 'success',
    title,
    message,
    data
}: AttendanceRewardModalProps) {
    const [xpCount, setXpCount] = useState(0);

    // XP Count-up effect
    useEffect(() => {
        if (isOpen && data && type === 'success') {
            let start = 0;
            const end = data.addedXP;
            if (start === end) return;

            const duration = 1000; // 1 second
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

                setXpCount(Math.floor(easeOut * end));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        } else {
            setXpCount(0);
        }
    }, [isOpen, data, type]);

    if (!isOpen) return null;

    // Dynamic styles based on type
    const getStyles = () => {
        switch (type) {
            case 'info':
                return {
                    icon: <FiInfo size={40} />,
                    iconBg: 'rgba(59, 130, 246, 0.1)',
                    iconColor: '#3b82f6',
                    glow: 'rgba(59, 130, 246, 0.15)',
                    btnGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    btnShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                };
            case 'error':
                return {
                    icon: <FiAlertCircle size={40} />,
                    iconBg: 'rgba(239, 68, 68, 0.1)',
                    iconColor: '#ef4444',
                    glow: 'rgba(239, 68, 68, 0.15)',
                    btnGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    btnShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                };
            case 'success':
            default:
                return {
                    icon: <FiCheckCircle size={40} />,
                    iconBg: 'rgba(34, 197, 94, 0.1)',
                    iconColor: '#22c55e',
                    glow: 'rgba(251, 191, 36, 0.15)',
                    btnGradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                    btnShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                };
        }
    };

    const styles = getStyles();
    const displayTitle = title || (type === 'success' ? '출석체크 완료!' : type === 'info' ? '알림' : '오류');
    const displayMessage = message || (type === 'success' ? '오늘의 여정을 시작하신 것을 축하합니다.' : '');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        width: '100%',
                        maxWidth: '380px', // Slightly compact
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '16px', // Slightly less rounded than full modal
                        padding: '24px',
                        zIndex: 10000,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                        textAlign: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {/* Background Deco */}
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '200px',
                        height: '200px',
                        background: `radial-gradient(circle, ${styles.glow} 0%, transparent 70%)`,
                        pointerEvents: 'none'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', textAlign: 'left' }}>
                            {/* Small Icon */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                flexShrink: 0,
                                borderRadius: '12px',
                                backgroundColor: styles.iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: styles.iconColor,
                            }}>
                                {styles.icon}
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
                                    {displayTitle}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                                    {displayMessage}
                                </p>
                            </div>
                        </div>

                        {/* Stats Grid - Compact */}
                        {type === 'success' && data && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginTop: '16px',
                                marginBottom: '16px',
                                backgroundColor: '#27272a',
                                borderRadius: '12px',
                                padding: '12px'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Streak</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>
                                        <FaFire size={14} />
                                        <span>{data.streak}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #3f3f46' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>XP Gained</span>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#22c55e' }}>
                                        +{xpCount}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Button - Compact */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: (type === 'success' && data) ? '0' : '16px' }}>
                            <motion.button
                                onClick={onClose}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: styles.btnGradient,
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    boxShadow: styles.btnShadow
                                }}
                            >
                                확인
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
