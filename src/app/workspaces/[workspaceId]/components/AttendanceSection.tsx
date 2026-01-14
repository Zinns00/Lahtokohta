"use client";

import { useState } from 'react';
import styles from '../page.module.css';
import { FiLogIn, FiLogOut, FiCalendar } from "react-icons/fi";

export default function AttendanceSection({ streak, attendances }: { streak: number, attendances: any[] }) {
    // In MVP, we mock the session state. In production, check existing attendance for today.
    // Logic: If there is an attendance for today with no endTime, we are Checked In.
    const today = new Date().toDateString();

    // Simple state for demo
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<string | null>(null);

    const handleCheckIn = () => {
        setIsCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString());
        // Call API to create attendance
    };

    const handleCheckOut = () => {
        setIsCheckedIn(false);
        // Call API to update attendance (endTime)
    };

    return (
        <section className={styles.section} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className={styles.sectionTitle} style={{ justifyContent: 'center' }}>
                <span>🔥 오늘의 출석부 (Daily Check-in)</span>
            </div>

            <div className={styles.streakContainer}>
                <div className={styles.streakValue}>{streak}</div>
                <div className={styles.streakLabel}>일 연속 출석 달성!</div>
            </div>

            <div className={styles.attendanceActionArea}>
                {!isCheckedIn ? (
                    <button className={`${styles.sessionBtn} ${styles.startBtn}`} onClick={handleCheckIn}>
                        <FiLogIn style={{ marginRight: '8px', fontSize: '1.2rem' }} />
                        입실하기 (Check In)
                    </button>
                ) : (
                    <div style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#fbbf24' }}>
                            현재 학습 중입니다... <br />
                            <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>입실 시간: {checkInTime}</span>
                        </div>
                        <button className={`${styles.sessionBtn} ${styles.stopBtn}`} onClick={handleCheckOut}>
                            <FiLogOut style={{ marginRight: '8px', fontSize: '1.2rem' }} />
                            퇴실하기 (Check Out)
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.historyList}>
                <h4 style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '1rem', borderBottom: '1px solid #27272a', paddingBottom: '0.5rem' }}>
                    <FiCalendar style={{ display: 'inline', marginRight: '6px' }} />
                    최근 출석 기록
                </h4>
                {(!attendances || attendances.length === 0) && (
                    <div style={{ fontSize: '0.8rem', color: '#52525b', textAlign: 'center', padding: '1rem' }}>
                        아직 기록이 없습니다.
                    </div>
                )}
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {/* Mock Data for visual if empty */}
                    {(!attendances || attendances.length === 0) && (
                        <>
                            <li className={styles.historyItem}>
                                <span>2026.01.14</span>
                                <span className={styles.historyTime}>3시간 20분</span>
                            </li>
                            <li className={styles.historyItem}>
                                <span>2026.01.13</span>
                                <span className={styles.historyTime}>2시간 10분</span>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </section>
    );
}
