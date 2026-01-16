"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { motion, AnimatePresence } from 'framer-motion';
// Icons
import {
    FiCheckSquare, FiUserCheck,
    FiBriefcase, FiBookOpen, FiActivity, FiLayers
} from "react-icons/fi";
import { FaFire, FaBolt } from "react-icons/fa";

// Separate components import
import CurriculumSection from './components/CurriculumSection';
import AttendanceSection from './components/AttendanceSection';
import { getUserLevelInfo } from '@/lib/levelSystem';

type Tab = 'CURRICULUM' | 'ATTENDANCE';

export default function WorkspaceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId;

    const [workspace, setWorkspace] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [activeTab, setActiveTab] = useState<Tab>('ATTENDANCE');

    useEffect(() => {
        if (workspaceId) {
            fetch(`/api/workspaces/${workspaceId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed');
                    return res.json();
                })
                .then(data => {
                    setWorkspace(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }, [workspaceId, router]);

    const handleAddTask = async (content: string, type: string, priority: string) => {
        if (!content.trim()) return;

        const optimisticTask = {
            id: Date.now(),
            content,
            isDone: false,
            xpReward: 10,
            type,
            priority
        };

        setWorkspace((prev: any) => ({
            ...prev,
            tasks: [optimisticTask, ...(prev.tasks || [])]
        }));
    };

    // Helper: Dynamic Icon based on Category
    const getCategoryIcon = (category: string) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('study') || cat.includes('학습')) return <FiBookOpen />;
        if (cat.includes('project') || cat.includes('프로젝트')) return <FiBriefcase />;
        if (cat.includes('health') || cat.includes('운동')) return <FiActivity />;
        return <FiLayers />;
    };

    if (isLoading) return <div className={styles.loading}>Accessing Workspace...</div>;
    if (!workspace) return null;



    const userLevelInfo = workspace.user ? getUserLevelInfo(workspace.user.totalXP) : { level: 1, title: '탐험가', badge: '🔭', progress: 0 };

    return (
        <div className={styles.container}>
            {/* 1. Slim Compact HUD Header */}
            <header className={styles.headerHud}>
                <div className={styles.hudLeft}>
                    {/* Dynamic Workspace Logo */}
                    <div className={styles.workspaceLogo}>
                        {getCategoryIcon(workspace.category)}
                    </div>

                    <div className={styles.workspaceTitle}>
                        <h1>{workspace.title}</h1>
                        <div className={styles.metaRow}>
                            <span className={styles.metaBadge}>{workspace.category}</span>
                            <span className={`${styles.metaBadge} ${styles.difficultyBadge}`}>
                                {workspace.difficulty}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.hudRight}>
                    {/* Gamified Streak Badge */}
                    <div className={styles.streakBadge}>
                        <FaFire style={{ color: '#fbbf24' }} />
                        <span>{workspace.streak} Days</span>
                    </div>

                    {/* Designer Profile with XP Bar */}
                    {/* Designer Profile with XP Bar */}
                    <div className={styles.profileContainer}>
                        {/* Name & XP Bar (Left) */}
                        <div className={styles.profileInfo}>
                            <span className={styles.profileName}>
                                {workspace.user?.username || '게스트'}
                            </span>
                            {/* Visual XP Bar for Decoration */}
                            <div className={styles.levelBarContainer}>
                                <div className={styles.levelBarFill} style={{ width: `${userLevelInfo.progress}%` }}></div>
                            </div>
                        </div>

                        {/* Avatar & Level Badge (Right) */}
                        <div className={styles.avatarWrapper}>
                            <div className={styles.avatarFrame}>
                                {workspace.user?.image ? (
                                    <img src={workspace.user.image} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e4e4e7' }}>
                                        {workspace.user?.username?.[0]?.toUpperCase() || 'G'}
                                    </span>
                                )}
                            </div>
                            <div className={styles.levelBadgeDesign}>
                                {userLevelInfo.level}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Layout: Sidebar + Content */}
            <div className={styles.mainLayout}>
                {/* Vertical GNB (Korean) */}
                <nav className={styles.sidebar}>
                    <button
                        className={`${styles.sideTab} ${activeTab === 'ATTENDANCE' ? styles.activeSideTab : ''}`}
                        onClick={() => setActiveTab('ATTENDANCE')}
                    >
                        <FiUserCheck size={18} />
                        <span>출석부</span>
                    </button>
                    <button
                        className={`${styles.sideTab} ${activeTab === 'CURRICULUM' ? styles.activeSideTab : ''}`}
                        onClick={() => setActiveTab('CURRICULUM')}
                    >
                        <FiCheckSquare size={18} />
                        <span>커리큘럼</span>
                    </button>
                    {/* Stats removed for MVP cleanliness */}

                    {/* Spacer to push Back Button to bottom */}
                    <div style={{ flex: 1 }}></div>

                    {/* Divider */}
                    <div className={styles.sidebarDivider}></div>

                    {/* Back Button */}
                    <button
                        className={styles.backButton}
                        onClick={() => router.push('/dashboard')}
                    >
                        <FiLayers style={{ transform: 'rotate(180deg)' }} />
                        <span>나가기</span>
                    </button>
                </nav>

                {/* Main Content */}
                <main className={styles.contentArea}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'CURRICULUM' && (
                            <motion.div
                                key="curriculum"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={styles.pageHeader}>
                                    <h2>커리큘럼 & 목표</h2>
                                    <p>함께 달성할 목표와 개인 학습 리스트를 관리하세요.</p>
                                </div>
                                <CurriculumSection
                                    tasks={workspace.tasks || []}
                                    onAddTask={handleAddTask}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'ATTENDANCE' && (
                            <motion.div
                                key="attendance"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={styles.pageHeader}>
                                    <h2>출석 체크</h2>
                                    <p>매일 꾸준한 기록이 위대한 결과를 만듭니다.</p>
                                </div>
                                <AttendanceSection
                                    streak={workspace.streak}
                                    startDate={workspace.startDate}
                                    endDate={workspace.endDate}
                                    attendances={workspace.attendances || []}
                                    minStudyHours={workspace.minStudyHours}
                                    onCheckInComplete={(newTotalXP) => {
                                        console.log('WorkspacePage received newTotalXP:', newTotalXP);
                                        setWorkspace((prev: any) => ({
                                            ...prev,
                                            user: {
                                                ...prev.user,
                                                totalXP: newTotalXP
                                            }
                                        }));
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
