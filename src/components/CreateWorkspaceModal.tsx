"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiCalendar, FiClock, FiTarget, FiMinus, FiPlus, FiChevronRight, FiBarChart2 } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from './CreateWorkspaceModal.module.css';
import { ko } from 'date-fns/locale';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const steps = [
    { id: 1, title: '기본 정보', icon: <FiTarget /> },
    { id: 2, title: '기간 설정', icon: <FiCalendar /> },
    { id: 3, title: '목표 설정', icon: <FiClock /> },
];

export default function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        difficulty: 'Normal', // Replaced color with difficulty
        category: 'Study',
        startDate: new Date(),
        endDate: null as Date | null,
        description: '',
        minStudyHours: 1
    });
    const [isEndDateEnabled, setIsEndDateEnabled] = useState(false);
    const [dateInputStr, setDateInputStr] = useState({ start: '', end: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Initial Setup
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            setFormData(prev => ({
                ...prev,
                title: '',
                startDate: today,
                endDate: null,
                difficulty: 'Normal'
            }));
            setDateInputStr({
                start: formatDate(today),
                end: ''
            });
            setIsEndDateEnabled(false);
            setCurrentStep(1);
        }
    }, [isOpen]);

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = date.getMonth() + 1;
        const d = date.getDate();
        return `${y}. ${m}. ${d}.`;
    };

    const parseDate = (str: string) => {
        const parts = str.match(/(\d+)/g);
        if (!parts || parts.length < 3) return null;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const date = new Date(y, m, d);
        if (isNaN(date.getTime())) return null;
        return date;
    };

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                startDate: formData.startDate.toISOString().split('T')[0],
                endDate: (isEndDateEnabled && formData.endDate)
                    ? formData.endDate.toISOString().split('T')[0]
                    : formData.startDate.toISOString().split('T')[0]
            };

            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to create workspace');

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('워크스페이스 생성에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCalendarChange = (dates: Date | [Date | null, Date | null] | null) => {
        if (!dates) return;

        if (Array.isArray(dates)) {
            // Range Selection (only when end date enabled)
            const [start, end] = dates;
            setFormData(prev => ({
                ...prev,
                startDate: start || prev.startDate,
                endDate: end
            }));
            setDateInputStr({
                start: formatDate(start || formData.startDate),
                end: formatDate(end)
            });
        } else {
            // Single Selection
            const date = dates as Date;
            if (isEndDateEnabled) {
                setFormData(prev => ({ ...prev, startDate: date }));
                setDateInputStr(prev => ({ ...prev, start: formatDate(date) }));
            } else {
                setFormData(prev => ({ ...prev, startDate: date, endDate: null }));
                setDateInputStr(prev => ({ ...prev, start: formatDate(date), end: '' }));
            }
        }
    };

    // Explicit Handlers for Inputs
    const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDateInputStr(prev => ({ ...prev, start: val }));
        const parsed = parseDate(val);
        if (parsed) {
            setFormData(prev => ({ ...prev, startDate: parsed }));
        }
    };

    const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setDateInputStr(prev => ({ ...prev, end: val }));
        const parsed = parseDate(val);
        if (parsed) {
            setFormData(prev => ({ ...prev, endDate: parsed }));
        }
    };

    const toggleEndDate = () => {
        const newState = !isEndDateEnabled;
        setIsEndDateEnabled(newState);
        if (!newState) {
            setFormData(prev => ({ ...prev, endDate: null }));
            setDateInputStr(prev => ({ ...prev, end: '' }));
        } else {
            // Default end date to start date + 7 days
            const nextWeek = new Date(formData.startDate);
            nextWeek.setDate(nextWeek.getDate() + 7);
            setFormData(prev => ({ ...prev, endDate: nextWeek }));
            setDateInputStr(prev => ({ ...prev, end: formatDate(nextWeek) }));
        }
    };

    // Preset Handlers
    const setPreset = (days: number) => {
        if (!isEndDateEnabled) setIsEndDateEnabled(true);
        const end = new Date(formData.startDate);
        end.setDate(end.getDate() + days);
        setFormData(prev => ({ ...prev, endDate: end }));
        setDateInputStr(prev => ({ ...prev, end: formatDate(end) }));
    };

    const incrementHours = () => setFormData(prev => ({ ...prev, minStudyHours: Math.min(24, prev.minStudyHours + 1) }));
    const decrementHours = () => setFormData(prev => ({ ...prev, minStudyHours: Math.max(0, prev.minStudyHours - 1) }));

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={styles.overlay} onClick={onClose}>
                <motion.div
                    className={styles.modal}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>

                    <div className={styles.header}>
                        <h2>새 워크스페이스 만들기</h2>
                        <div className={styles.stepIndicator}>
                            {steps.map(step => (
                                <div
                                    key={step.id}
                                    className={`${styles.step} ${step.id <= currentStep ? styles.activeStep : ''}`}
                                >
                                    <div className={styles.stepIcon}>{step.icon}</div>
                                    <span>{step.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.content}>
                        {currentStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={styles.stepContent}
                            >
                                <label>
                                    워크스페이스 이름
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="예: 아침 코딩 스터디"
                                        autoFocus
                                    />
                                </label>

                                <label>
                                    카테고리
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Study">공부 (Study)</option>
                                        <option value="Project">프로젝트 (Project)</option>
                                        <option value="Hobby">취미 (Hobby)</option>
                                        <option value="Health">운동 (Health)</option>
                                    </select>
                                </label>

                                <label>
                                    난이도 설정 (Difficulty)
                                    <p className={styles.helperTextLeft}>난이도에 따라 경험치 획득량이 달라집니다.</p>
                                    <div className={styles.difficultyOptions}>
                                        {['Easy', 'Normal', 'Hard'].map(diff => (
                                            <div
                                                key={diff}
                                                className={`${styles.difficultyChip} ${formData.difficulty === diff ? styles.selectedDifficulty : ''} ${styles[diff.toLowerCase()]}`}
                                                onClick={() => setFormData({ ...formData, difficulty: diff })}
                                            >
                                                <div className={styles.diffTitle}>{diff}</div>
                                                <div className={styles.diffMultiplier}>
                                                    {diff === 'Easy' ? 'x1.0' : diff === 'Normal' ? 'x1.5' : 'x2.0'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </label>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={styles.stepContent}
                            >
                                <div className={styles.dateInputsHeader}>
                                    <div className={styles.dateField}>
                                        <span>시작일</span>
                                        <input
                                            type="text"
                                            value={dateInputStr.start}
                                            onChange={handleStartInputChange}
                                            placeholder="YYYY. MM. DD"
                                            className={styles.dateTextInput}
                                        />
                                    </div>
                                    <div className={styles.arrowContainer}><FiChevronRight /></div>
                                    <div className={`${styles.dateField} ${!isEndDateEnabled ? styles.disabledField : ''}`}>
                                        <div className={styles.endDateLabel}>
                                            <span>종료일</span>
                                            <label className={styles.toggleSwitch}>
                                                <input
                                                    type="checkbox"
                                                    checked={isEndDateEnabled}
                                                    onChange={toggleEndDate}
                                                />
                                                <span className={styles.slider}></span>
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            value={isEndDateEnabled ? dateInputStr.end : ''}
                                            onChange={handleEndInputChange}
                                            placeholder={isEndDateEnabled ? "YYYY. MM. DD" : "설정 없음"}
                                            className={styles.dateTextInput}
                                            disabled={!isEndDateEnabled}
                                        />
                                    </div>
                                </div>

                                {isEndDateEnabled && (
                                    <div className={styles.presetButtons}>
                                        <button onClick={() => setPreset(7)}>1주</button>
                                        <button onClick={() => setPreset(30)}>1개월</button>
                                        <button onClick={() => setPreset(90)}>3개월</button>
                                        <button onClick={() => setPreset(365)}>1년</button>
                                    </div>
                                )}

                                <div className={styles.calendarWrapper}>
                                    <DatePicker
                                        selected={formData.startDate}
                                        onChange={handleCalendarChange}
                                        startDate={formData.startDate}
                                        endDate={formData.endDate}
                                        selectsRange={isEndDateEnabled}
                                        inline
                                        locale={ko}
                                        dateFormat="yyyy. MM. dd"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={styles.stepContent}
                            >
                                <label>
                                    메인 목표
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="이 워크스페이스의 최종 목표는 무엇인가요?"
                                        rows={3}
                                    />
                                </label>

                                <label>
                                    일일 최소 공부 시간
                                    <div className={styles.timeControl}>
                                        <button onClick={decrementHours} className={styles.timeBtn}><FiMinus /></button>
                                        <div className={styles.timeDisplay}>
                                            <span className={styles.timeValue}>{formData.minStudyHours}</span>
                                            <span className={styles.timeUnit}>시간</span>
                                        </div>
                                        <button onClick={incrementHours} className={styles.timeBtn}><FiPlus /></button>
                                    </div>
                                    <p className={styles.helperText}>하루에 이만큼은 꼭 공부해요!</p>
                                </label>
                            </motion.div>
                        )}
                    </div>

                    <div className={styles.footer}>
                        {currentStep > 1 && (
                            <button className={styles.backBtn} onClick={handleBack}>이전</button>
                        )}
                        {currentStep < 3 ? (
                            <button className={styles.nextBtn} onClick={handleNext} disabled={!formData.title}>다음</button>
                        ) : (
                            <button className={styles.createBtn} onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? '생성 중...' : '생성 완료'}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
