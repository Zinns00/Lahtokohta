"use client";

import { useState } from 'react';
import styles from '../page.module.css';
import { FiCheck, FiPlus, FiAlertCircle } from "react-icons/fi";

type TaskType = 'TEAM' | 'PERSONAL';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export default function CurriculumSection({ tasks, onAddTask }: { tasks: any[], onAddTask: (content: string, type: string, priority: string) => void }) {
    const [activeTab, setActiveTab] = useState<TaskType>('TEAM');
    const [newTask, setNewTask] = useState('');
    const [priority, setPriority] = useState<Priority>('MEDIUM');

    // Filter tasks based on active tab
    // In MVP, we might treat all existing tasks as PERSONAL if type is undefined, or handle gracefully
    const displayTasks = tasks?.filter((t: any) => (t.type || 'PERSONAL') === activeTab) || [];

    const handleSubmit = () => {
        if (!newTask.trim()) return;
        onAddTask(newTask, activeTab, priority);
        setNewTask('');
        setPriority('MEDIUM'); // Reset priority
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'HIGH': return '#ef4444'; // Red
            case 'MEDIUM': return '#f59e0b'; // Amber
            case 'LOW': return '#71717a'; // Gray
            default: return '#71717a';
        }
    };

    return (
        <section className={styles.section}>
            {/* Inner Tabs for Task Type */}
            <div className={styles.categoryTabs}>
                <button
                    className={`${styles.categoryTab} ${activeTab === 'TEAM' ? styles.activeCategory : ''}`}
                    onClick={() => setActiveTab('TEAM')}
                >
                    👥 팀 목표 (Team)
                </button>
                <button
                    className={`${styles.categoryTab} ${activeTab === 'PERSONAL' ? styles.activeCategory : ''}`}
                    onClick={() => setActiveTab('PERSONAL')}
                >
                    👤 개인 할 일 (Personal)
                </button>
            </div>

            <div className={styles.sectionTitle}>
                <span>
                    {activeTab === 'TEAM' ? '스터디 공통 목표' : '나만의 학습 목표'}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                    {displayTasks.filter((t: any) => t.isDone).length} / {displayTasks.length} 완료
                </span>
            </div>

            {/* Input Area with Priority */}
            <div className={styles.inputWrapper}>
                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        className={styles.textInput}
                        placeholder={activeTab === 'TEAM' ? "팀원들과 함께할 목표를 추가하세요..." : "오늘 끝낼 개인 공부를 입력하세요..."}
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <button className={styles.addBtn} onClick={handleSubmit}>
                        <FiPlus />
                    </button>
                </div>

                {/* Priority Select */}
                <div className={styles.prioritySelector}>
                    <span style={{ fontSize: '0.8rem', color: '#a1a1aa', marginRight: '8px' }}>중요도:</span>
                    {['HIGH', 'MEDIUM', 'LOW'].map((p) => (
                        <button
                            key={p}
                            className={`${styles.priorityBadge} ${priority === p ? styles.priorityActive : ''}`}
                            onClick={() => setPriority(p as Priority)}
                            style={{
                                borderColor: priority === p ? getPriorityColor(p) : 'transparent',
                                color: priority === p ? getPriorityColor(p) : '#52525b'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <ul className={styles.taskList} style={{ marginTop: '1.5rem' }}>
                {displayTasks.length === 0 && (
                    <li style={{ textAlign: 'center', color: '#52525b', padding: '2rem' }}>
                        {activeTab === 'TEAM' ? '등록된 팀 목표가 없습니다.' : '등록된 개인 할 일이 없습니다.'}
                    </li>
                )}
                {displayTasks.map((task: any) => (
                    <li key={task.id} className={styles.taskItem}>
                        <button className={`${styles.checkBtn} ${task.isDone ? styles.checked : ''}`}>
                            {task.isDone && <FiCheck />}
                        </button>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span
                                    className={styles.miniTag}
                                    style={{ backgroundColor: getPriorityColor(task.priority || 'MEDIUM') }}
                                >
                                    {task.priority || 'MEDIUM'}
                                </span>
                                <span className={task.isDone ? styles.taskTextDone : styles.taskText}>
                                    {task.content}
                                </span>
                            </div>
                        </div>
                        <span className={styles.xpReward}>+{task.xpReward} XP</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
