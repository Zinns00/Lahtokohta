"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import { FiX, FiCheck, FiChevronRight, FiTarget, FiCalendar, FiClock } from 'react-icons/fi';
import styles from './CreateWorkspaceModal.module.css';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
    const [step, setStep] = useState(1);
    const [isEndDateEnabled, setIsEndDateEnabled] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        difficulty: 'Normal', // 'Easy' | 'Normal' | 'Hard'
        category: 'Study',
        startDate: new Date(),
        endDate: null as Date | null,
        description: '',
        minStudyHours: 1
    });

    // String state for date inputs to allow manual typing
    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}. ${m}. ${d}.`;
    };

    const [dateInputStr, setDateInputStr] = useState({
        start: formatDate(new Date()),
        end: ''
    });

    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const categoryRef = useRef<HTMLDivElement>(null);

    const [viewDate, setViewDate] = useState(new Date());

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        }

        if (isCategoryOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCategoryOpen]);

    useEffect(() => {
        if (formData.startDate) {
            setViewDate(formData.startDate);
        }
    }, [formData.startDate]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setIsCategoryOpen(false); // Reset dropdown
            const now = new Date();
            setFormData({
                title: '',
                difficulty: 'Normal',
                category: 'Study',
                startDate: now,
                endDate: null,
                description: '',
                minStudyHours: 1
            });
            setDateInputStr({
                start: formatDate(now),
                end: ''
            });
            setIsEndDateEnabled(false);
        }
    }, [isOpen]);

    // Parse date string (YYYY. M. D.)
    const parseDate = (str: string): Date | null => {
        const parts = str.split('.').map(p => p.trim()).filter(p => p);
        if (parts.length < 3) return null;
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return null;
        return date;
    };

    // Auto-masking helper
    const autoFormatDate = (input: string, prevValue: string) => {
        // Did we delete? (Naive check: length went down)
        // const isDeleting = input.length < prevValue.length; // Not used for simple forward typing mask

        // Remove all non-digits
        let nums = input.replace(/\D/g, '');

        // Cap at 8 digits (YYYYMMDD)
        if (nums.length > 8) nums = nums.slice(0, 8);

        // Reconstruct with dots
        let formatted = nums;
        if (nums.length > 4) {
            formatted = `${nums.slice(0, 4)}. ${nums.slice(4)}`;
        }
        if (nums.length > 6) {
            formatted = `${nums.slice(0, 4)}. ${nums.slice(4, 6)}. ${nums.slice(6)}`;
        }

        return formatted;
    };

    const handleInputBlur = (field: 'start' | 'end') => {
        const currentVal = dateInputStr[field];
        let formatted = autoFormatDate(currentVal, '');

        const parsed = parseDate(formatted);
        if (parsed) {
            formatted = formatDate(parsed);
            setFormData(prev => ({
                ...prev,
                [field === 'start' ? 'startDate' : 'endDate']: parsed
            }));
        }
        setDateInputStr(prev => ({ ...prev, [field]: formatted }));
    };

    const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const cursor = e.target.selectionStart;

        if (/[^0-9. ]/.test(val)) return;

        let finalVal = val;
        if (cursor === null || cursor === val.length) {
            finalVal = autoFormatDate(val, dateInputStr.start);
        }

        setDateInputStr(prev => ({ ...prev, start: finalVal }));

        const parsed = parseDate(finalVal);
        if (parsed) {
            setFormData(prev => ({ ...prev, startDate: parsed }));
        }
    };

    const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const cursor = e.target.selectionStart;

        if (/[^0-9. ]/.test(val)) return;

        let finalVal = val;
        if (cursor === null || cursor === val.length) {
            finalVal = autoFormatDate(val, dateInputStr.end);
        }

        setDateInputStr(prev => ({ ...prev, end: finalVal }));

        const parsed = parseDate(finalVal);
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

    const handleDateChange = (dates: any) => {
        if (Array.isArray(dates)) {
            const [start, end] = dates;
            if (start) {
                setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
                setDateInputStr({
                    start: formatDate(start),
                    end: end ? formatDate(end) : ''
                });
            }
        } else if (dates) {
            setFormData(prev => ({ ...prev, startDate: dates }));
            setDateInputStr(prev => ({ ...prev, start: formatDate(dates) }));
        }
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    endDate: isEndDateEnabled ? formData.endDate?.toISOString() : null
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Failed to create workspace');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating workspace');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
            >
                <button className={styles.closeBtn} onClick={onClose}><FiX /></button>

                <div className={styles.header}>
                    <h2>새 워크스페이스 만들기</h2>
                    <div className={styles.stepIndicator}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`${styles.step} ${step === i ? styles.activeStep : ''}`}>
                                <div className={styles.stepIcon}>
                                    {i === 1 ? <FiTarget /> : i === 2 ? <FiCalendar /> : <FiClock />}
                                </div>
                                <span>{i === 1 ? '기본 정보' : i === 2 ? '기간 설정' : '목표 설정'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={styles.stepContent}
                            >
                                <label>
                                    워크스페이스 이름
                                    <input
                                        type="text"
                                        placeholder="예: 자격증 공부, 코딩 테스트 준비"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        autoFocus
                                    />
                                </label>

                                <label>
                                    카테고리
                                    <div className={styles.customSelectWrapper} ref={categoryRef}>
                                        <div
                                            className={`${styles.selectTrigger} ${isCategoryOpen ? styles.selectOpen : ''}`}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                // Prevent default behavior if necessary but allow focus
                                            }}
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                        >
                                            <span className={styles.selectedValue}>
                                                {formData.category === 'Study' && '📚 Academic (학습)'}
                                                {formData.category === 'Project' && '🚀 Project (프로젝트)'}
                                                {formData.category === 'Health' && '🌿 Wellness (건강)'}
                                                {formData.category === 'Hobby' && '🎨 Hobby (취미)'}
                                            </span>
                                            <FiChevronRight className={`${styles.selectArrow} ${isCategoryOpen ? styles.rotateArrow : ''}`} />
                                        </div>

                                        <AnimatePresence>
                                            {isCategoryOpen && (
                                                <motion.div
                                                    className={styles.selectDropdown}
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {[
                                                        { val: 'Study', label: '📚 Academic (학습)' },
                                                        { val: 'Project', label: '🚀 Project (프로젝트)' },
                                                        { val: 'Health', label: '🌿 Wellness (건강)' },
                                                        { val: 'Hobby', label: '🎨 Hobby (취미)' }
                                                    ].map((opt) => (
                                                        <div
                                                            key={opt.val}
                                                            className={`${styles.selectOption} ${formData.category === opt.val ? styles.selectedOption : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData(prev => ({ ...prev, category: opt.val }));
                                                                setIsCategoryOpen(false);
                                                            }}
                                                        >
                                                            {opt.label}
                                                            {formData.category === opt.val && <FiCheck className={styles.checkIcon} />}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
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

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={styles.stepContent}
                            >
                                {/* Date Inputs Header */}
                                <div className={styles.dateInputsHeader}>
                                    <div className={styles.dateField}>
                                        <span>시작일</span>
                                        <input
                                            type="text"
                                            className={styles.dateTextInput}
                                            value={dateInputStr.start}
                                            onChange={handleStartInputChange}
                                            onBlur={() => handleInputBlur('start')}
                                            placeholder="YYYY. MM. DD."
                                        />
                                    </div>
                                    <div className={styles.arrowContainer}>
                                        <FiChevronRight />
                                    </div>
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
                                            className={styles.dateTextInput}
                                            value={isEndDateEnabled ? dateInputStr.end : ''}
                                            onChange={handleEndInputChange}
                                            onBlur={() => handleInputBlur('end')}
                                            placeholder={isEndDateEnabled ? "YYYY. MM. DD." : "설정 없음"}
                                            disabled={!isEndDateEnabled}
                                        />
                                    </div>
                                </div>

                                {/* Quick Presets */}
                                {isEndDateEnabled && (
                                    <div className={styles.presetButtons}>
                                        <button onClick={() => setPreset(7)}>1주</button>
                                        <button onClick={() => setPreset(30)}>1개월</button>
                                        <button onClick={() => setPreset(90)}>3개월</button>
                                        <button onClick={() => setPreset(365)}>1년</button>
                                    </div>
                                )}

                                {/* Calendar */}
                                <div className={styles.calendarWrapper}>
                                    <DatePicker
                                        selected={formData.startDate}
                                        onChange={handleDateChange as any}
                                        startDate={formData.startDate}
                                        endDate={isEndDateEnabled ? formData.endDate : null}
                                        selectsRange={isEndDateEnabled as any}
                                        inline
                                        locale={ko}
                                        dateFormat="yyyy.MM.dd"
                                        openToDate={formData.startDate}
                                        key={formData.startDate ? formData.startDate.toISOString().slice(0, 7) : 'init'}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={styles.stepContent}
                            >
                                <label>
                                    최소 공부 시간 (일일)
                                    <div className={styles.timeControl}>
                                        <button
                                            className={styles.timeBtn}
                                            onClick={() => setFormData(p => ({ ...p, minStudyHours: p.minStudyHours <= 0 ? 24 : p.minStudyHours - 1 }))}
                                        >-</button>
                                        <div className={styles.timeDisplay}>
                                            <span className={styles.timeValue}>{formData.minStudyHours}</span>
                                            <span className={styles.timeUnit}>시간</span>
                                        </div>
                                        <button
                                            className={styles.timeBtn}
                                            onClick={() => setFormData(p => ({ ...p, minStudyHours: p.minStudyHours >= 24 ? 0 : p.minStudyHours + 1 }))}
                                        >+</button>
                                    </div>
                                    <p className={styles.helperText}>매일 이 시간만큼 공부하면 출석이 인정됩니다.</p>
                                </label>

                                <label>
                                    워크스페이스 목표 (선택)
                                    <textarea
                                        rows={3}
                                        placeholder="이 워크스페이스에서 이루고 싶은 목표를 적어주세요."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </label>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={styles.footer}>
                    {step > 1 && (
                        <button className={styles.backBtn} onClick={() => setStep(step - 1)}>
                            이전
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            className={styles.nextBtn}
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 && !formData.title}
                        >
                            다음
                        </button>
                    ) : (
                        <button className={styles.createBtn} onClick={handleSubmit}>
                            생성 완료
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
