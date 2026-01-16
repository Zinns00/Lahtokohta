"use client";

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import { FiPlus, FiActivity, FiBook, FiCode, FiZap, FiGrid, FiBriefcase, FiHeart } from "react-icons/fi";
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CreateWorkspaceModal from '@/components/CreateWorkspaceModal';
import ProfileSettingsModal from '@/components/ProfileSettingsModal';
import UserAvatar from '@/components/UserAvatar';
import { getUserLevelInfo, getWorkspaceMaxXP, getWorkspaceTier } from '@/lib/levelSystem';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12
        }
    }
};

interface User {
    id: string;
    username: string;
    email: string;
    image?: string;
    bio?: string;
    totalXP: number;
    title?: string;
    equippedFrame?: string;
}

interface Workspace {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string; // 'Easy' | 'Normal' | 'Hard'
    level: number;
    progress: number;
    color: string;
    created_at: string;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
    const router = useRouter();

    const fetchWorkspaces = useCallback(async () => {
        try {
            const res = await fetch('/api/workspaces');
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((ws: any) => {
                    const difficulty = ws.difficulty as 'Easy' | 'Normal' | 'Hard';
                    const maxXP = getWorkspaceMaxXP(ws.level || 1);
                    const progress = maxXP === 0 ? 0 : Math.min(100, Math.floor(((ws.currentXP || 0) / maxXP) * 100));

                    return {
                        ...ws,
                        progress: progress,
                        level: ws.level || 1,
                        color: getWorkspaceTier(ws.level || 1)
                    };
                });
                setWorkspaces(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch workspaces', error);
        }
    }, []);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch('/api/user/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                throw new Error('Not authenticated');
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchUser(), fetchWorkspaces()]);
            setIsLoading(false);
        };
        init();
    }, [fetchUser, fetchWorkspaces]);

    const getIconByCategory = (cat: string) => {
        switch (cat) {
            case 'Health': return <FiActivity />;
            case 'Study': return <FiBook />;
            case 'Project': return <FiBriefcase />;
            case 'Hobby': return <FiHeart />;
            default: return <FiBook />;
        }
    };

    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    if (isLoading) {
        return <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    const levelInfo = user ? getUserLevelInfo(user.totalXP) : { level: 1, title: '탐험가', badge: '🔭' };
    // Use equipped title if available, otherwise calculated title
    const displayTitle = user?.title || levelInfo.title;

    return (
        <div className={styles.container}>
            <CreateWorkspaceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchWorkspaces();
                }}
            />

            {user && (
                <ProfileSettingsModal
                    isOpen={isProfileSettingsOpen}
                    onClose={() => setIsProfileSettingsOpen(false)}
                    user={user}
                    onSuccess={() => {
                        fetchUser(); // Refresh user data
                    }}
                />
            )}

            {/* Navbar */}
            <motion.nav
                className={styles.navbar}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.logo} style={{ gap: '12px' }}>
                    <img src="/latokohta_logo.png" alt="Logo" style={{ width: '54px', height: '54px', mixBlendMode: 'multiply' }} />
                    Lähtökohta
                </div>

                <div className={styles.profileSection} onClick={() => setIsProfileSettingsOpen(true)} style={{ cursor: 'pointer' }}>
                    <div className={styles.userProfile}>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.username || '게스트'}</span>
                            <span className={styles.userTitle}>
                                {`Lv.${levelInfo.level} ${displayTitle} ${levelInfo.badge}`}
                            </span>
                        </div>
                        <UserAvatar
                            src={user?.image}
                            alt={user?.username || 'User'}
                            frameId={user?.equippedFrame}
                            size="md"
                            width={40}
                            height={40}
                        />
                    </div>
                </div>
            </motion.nav>

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.sectionHeader}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <h1 className={styles.greeting}>환영합니다, {user?.username}님 👋</h1>
                        <p className={styles.subtitle}>오늘도 성장할 준비 되셨나요?</p>
                    </motion.div>
                    <motion.button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: '#fff',
                            border: '1px solid #e4e4e7',
                            cursor: 'pointer'
                        }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiGrid /> 전체 보기
                    </motion.button>
                </header>

                <motion.div
                    className={styles.grid}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Create New Card */}
                    <motion.div
                        className={`${styles.card} ${styles.createCard}`}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <div className={styles.plusIcon}><FiPlus /></div>
                        <span className={styles.createText}>새 워크스페이스</span>
                    </motion.div>

                    {/* Workspace Cards */}
                    {workspaces.map((workspace) => {
                        const tier = workspace.color.toLowerCase();
                        let tierStyle = styles.cardBronze; // Default

                        if (tier.includes('grandidierite')) tierStyle = styles.cardGrandidierite;
                        else if (tier.includes('painite')) tierStyle = styles.cardPainite;
                        else if (tier.includes('red diamond')) tierStyle = styles.cardRedDiamond;
                        else if (tier.includes('diamond')) tierStyle = styles.cardDiamond;
                        else if (tier.includes('platinum')) tierStyle = styles.cardPlatinum;
                        else if (tier.includes('gold')) tierStyle = styles.cardGold;
                        else if (tier.includes('silver')) tierStyle = styles.cardSilver;


                        return (
                            <motion.div
                                key={workspace.id}
                                className={`${styles.card} ${tierStyle}`}
                                variants={itemVariants}
                                whileHover={{
                                    scale: 1.02,
                                    translateY: -5,
                                }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(`/workspaces/${workspace.id}`)}
                            >
                                <div className={styles.cardContentCore} />

                                {/* Level Badge - Stat Indicator Style */}
                                <div className={styles.levelBadge}>
                                    <span className={styles.levelLabel}>LVL</span>
                                    <span className={styles.levelValue}>{workspace.level}</span>
                                </div>

                                <div className={styles.cardHeader}>
                                    <div className={styles.cardIcon}>
                                        {getIconByCategory(workspace.category)}
                                    </div>
                                    <div>
                                        <h3 className={styles.cardTitle}>{workspace.title}</h3>
                                        <span className={styles.categoryTag}>{workspace.category}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className={styles.progressContainer}>
                                        <div className={styles.progressLabel}>
                                            <span>EXP</span>
                                            <span>{workspace.progress}%</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <motion.div
                                                className={styles.progressFill}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${workspace.progress}%` }}
                                                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </main>
        </div>
    );
}
