"use client";

import styles from './page.module.css';
import { FiPlus, FiMoreHorizontal, FiActivity, FiBook, FiCode, FiZap, FiGrid } from "react-icons/fi";

const WORKSPACES = [
    {
        id: 1,
        title: 'Morning Coding',
        category: 'Study',
        level: 2,
        progress: 45,
        icon: <FiCode />,
        theme: 'bronze'
    },
    {
        id: 2,
        title: 'Fitness Challenge',
        category: 'Health',
        level: 5,
        progress: 82,
        icon: <FiActivity />,
        theme: 'gold'
    },
    {
        id: 3,
        title: 'Reading 2024',
        category: 'Hobby',
        level: 3,
        progress: 20,
        icon: <FiBook />,
        theme: 'silver'
    },
];

export default function DashboardPage() {
    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.logo}>
                    <FiZap style={{ color: '#111' }} />
                    Lahtokohta
                </div>

                <div className={styles.profileSection}>
                    <div className={styles.streakBadge}>
                        <FiZap />
                        <span>5 Days Streak</span>
                    </div>

                    <div className={styles.userProfile}>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>Alex Kim</span>
                            <span className={styles.userTitle}>Lv.3 Explorer</span>
                        </div>
                        <div className={styles.avatar}>AK</div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className={styles.main}>
                <header className={styles.sectionHeader}>
                    <div>
                        <h1 className={styles.greeting}>Welcome, Alex 👋</h1>
                        <p className={styles.subtitle}>Ready to level up your growth today?</p>
                    </div>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#fff',
                        border: '1px solid #e4e4e7',
                        cursor: 'pointer'
                    }}>
                        <FiGrid /> View All
                    </button>
                </header>

                <div className={styles.grid}>
                    {/* Create New Card */}
                    <div className={`${styles.card} ${styles.createCard}`} style={{ animationDelay: '0.1s' }}>
                        <div className={styles.plusIcon}><FiPlus /></div>
                        <span className={styles.createText}>New Workspace</span>
                    </div>

                    {/* Workspace Cards */}
                    {WORKSPACES.map((workspace, index) => (
                        <div
                            key={workspace.id}
                            className={`${styles.card} ${workspace.theme === 'gold' ? styles.cardGold : workspace.theme === 'silver' ? styles.cardSilver : styles.cardBronze}`}
                            style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.cardIcon}>
                                    {workspace.icon}
                                </div>
                                <button className={styles.cardMenuBtn}>
                                    <FiMoreHorizontal />
                                </button>
                            </div>

                            <div>
                                <h3 className={styles.cardTitle}>{workspace.title}</h3>
                                <div className={styles.cardMeta}>
                                    Lv.{workspace.level} • {workspace.category}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: '#888' }}>
                                    <span>Progress</span>
                                    <span>{workspace.progress}%</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${workspace.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
