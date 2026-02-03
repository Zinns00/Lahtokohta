"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ko } from 'date-fns/locale';
import { FiX, FiCheck, FiChevronRight, FiTarget, FiCalendar, FiClock } from 'react-icons/fi';
import styles from './CreateWorkspaceModal.module.css';
import { WORKSPACE_CATEGORIES, WORKSPACE_DIFFICULTIES, WORKSPACE_DEFAULTS, WORKSPACE_PRESET_DAYS, WORKSPACE_CREATION_STEPS, WorkspaceCategory, WorkspaceDifficulty } from '@/constants/workspace';
import { formatDate, parseDateString, autoFormatDateInput } from '@/utils/date';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
    const [step, setStep] = useState(1);
    const [isEndDateEnabled, setIsEndDateEnabled] = useState(false);
    const [error, setError] = useState(''); // Validation error state

    const [formData, setFormData] = useState({
        title: '',
        difficulty: WORKSPACE_DEFAULTS.DEFAULT_DIFFICULTY as WorkspaceDifficulty,
        category: WORKSPACE_DEFAULTS.DEFAULT_CATEGORY as WorkspaceCategory,
        startDate: new Date(),
        endDate: null as Date | null,
        description: '',
        minStudyHours: WORKSPACE_DEFAULTS.MIN_STUDY_HOURS
    });

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
                difficulty: WORKSPACE_DEFAULTS.DEFAULT_DIFFICULTY,
                category: WORKSPACE_DEFAULTS.DEFAULT_CATEGORY,
                startDate: now,
                endDate: null,
                description: '',
                minStudyHours: WORKSPACE_DEFAULTS.MIN_STUDY_HOURS
            });
            setDateInputStr({
                start: formatDate(now),
                end: ''
            });
            setIsEndDateEnabled(false);
        }
    }, [isOpen]);

    const handleInputBlur = (field: 'start' | 'end') => {
        const currentVal = dateInputStr[field];
        let formatted = autoFormatDateInput(currentVal);

        const parsed = parseDateString(formatted);
        if (parsed) {
            formatted = formatDate(parsed);
            setFormData(prev => ({
                ...prev,
                [field === 'start' ? 'startDate' : 'endDate']: parsed
            }));
        }
        setDateInputStr(prev => ({ ...prev, [field]: formatted }));
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'start' | 'end') => {
        const val = e.target.value;
        const cursor = e.target.selectionStart;

        if (/[^0-9. ]/.test(val)) return;

        let finalVal = val;
        if (cursor === null || cursor === val.length) {
            finalVal = autoFormatDateInput(val);
        }

        setDateInputStr(prev => ({ ...prev, [field]: finalVal }));

        const parsed = parseDateString(finalVal);
        if (parsed) {
            setFormData(prev => ({ ...prev, [field === 'start' ? 'startDate' : 'endDate']: parsed }));
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
                const errData = await res.json();
                alert(`Failed to create workspace: ${errData.message || 'Unknown error'} ${JSON.stringify(errData.errors || '')}`);
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
                        {WORKSPACE_CREATION_STEPS.map((s) => (
                            <div key={s.step} className={`${styles.step} ${step === s.step ? styles.activeStep : ''}`}>
                                <div className={styles.stepIcon}>
                                    {s.step === 1 ? <FiTarget /> : s.step === 2 ? <FiCalendar /> : <FiClock />}
                                </div>
                                <span>{s.label}</span>
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
                                        className={error ? styles.inputError : ''}
                                        value={formData.title}
                                        onChange={e => {
                                            setFormData({ ...formData, title: e.target.value });
                                            if (error) setError('');
                                        }}
                                        autoFocus
                                    />
                                    {error && <p className={styles.errorMessage}>{error}</p>}
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
                                                {WORKSPACE_CATEGORIES.find(c => c.val === formData.category)?.label || formData.category}
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
                                                    {WORKSPACE_CATEGORIES.map((opt) => (
                                                        <div
                                                            key={opt.val}
                                                            className={`${styles.selectOption} ${formData.category === opt.val ? styles.selectedOption : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData(prev => ({ ...prev, category: opt.val as WorkspaceCategory }));
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
                                        {WORKSPACE_DIFFICULTIES.map(diff => (
                                            <div
                                                key={diff.val}
                                                className={`${styles.difficultyChip} ${formData.difficulty === diff.val ? styles.selectedDifficulty : ''} ${styles[diff.val.toLowerCase()]}`}
                                                onClick={() => setFormData({ ...formData, difficulty: diff.val as WorkspaceDifficulty })}
                                            >
                                                <div className={styles.diffTitle}>{diff.label}</div>
                                                <div className={styles.diffMultiplier}>
                                                    {diff.multiplier}
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
                                            onChange={(e) => handleDateInputChange(e, 'start')}
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
                                            onChange={(e) => handleDateInputChange(e, 'end')}
                                            onBlur={() => handleInputBlur('end')}
                                            placeholder={isEndDateEnabled ? "YYYY. MM. DD." : "설정 없음"}
                                            disabled={!isEndDateEnabled}
                                        />
                                    </div>
                                </div>

                                {/* Quick Presets */}
                                {isEndDateEnabled && (
                                    <div className={styles.presetButtons}>
                                        {WORKSPACE_PRESET_DAYS.map(preset => (
                                            <button key={preset.days} onClick={() => setPreset(preset.days)}>{preset.label}</button>
                                        ))}
                                    </div>
                                )}

                                {/* Calendar */}
                                <div className={styles.calendarWrapper}>
                                    <DatePicker
                                        selected={formData.startDate}
                                        onChange={handleDateChange as any}
                                        startDate={formData.startDate}
                                        endDate={formData.endDate}
                                        selectsRange={true}
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
                                            onClick={() => setFormData(p => ({ ...p, minStudyHours: p.minStudyHours <= 0 ? 23 : p.minStudyHours - 1 }))}
                                        >-</button>
                                        <div className={styles.timeDisplay}>
                                            <span className={styles.timeValue}>{formData.minStudyHours}</span>
                                            <span className={styles.timeUnit}>시간</span>
                                        </div>
                                        <button
                                            className={styles.timeBtn}
                                            onClick={() => setFormData(p => ({ ...p, minStudyHours: p.minStudyHours >= 23 ? 0 : p.minStudyHours + 1 }))}
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
                            onClick={() => {
                                if (step === 1 && formData.title.length > 50) {
                                    setError("워크스페이스 이름은 50자 이내로 입력해주세요.");
                                    return;
                                }
                                setStep(step + 1);
                            }}
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
