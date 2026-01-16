"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import styles from '../page.module.css';
import { FiPlus, FiTrash2, FiMoreVertical, FiCheck } from "react-icons/fi";
import AttendanceRewardModal from '@/components/AttendanceRewardModal';

const INITIAL_COLUMNS = ['년-월-일', '학습시작시간', '학습종료시간', '사유(외출, 조퇴 등)', '상태(자동갱신)'];

// Example Row (Read Only)
const EXAMPLE_ROW = ['예시: 2025-01-15(수)', '09:00', '18:00', '예시: 병원 진료로 외출', '출석 완료 ✅'];

interface AttendanceSectionProps {
    streak: number;
    startDate?: string | Date;
    endDate?: string | Date;
    attendances?: any[];
    minStudyHours?: number;
    onCheckInComplete?: (newTotalXP: number) => void;
}

export default function AttendanceSection({ streak: initialStreak, startDate, endDate, attendances, minStudyHours = 0, onCheckInComplete }: AttendanceSectionProps) {
    const params = useParams();
    const workspaceId = params.workspaceId as string;

    const [columns, setColumns] = useState<string[]>(INITIAL_COLUMNS);
    const [rows, setRows] = useState<string[][]>([]);
    const [currentStreak, setCurrentStreak] = useState(initialStreak);
    const [isLoaded, setIsLoaded] = useState(false);

    // Ref to solve Stale Closure in onBlur
    const rowsRef = useRef(rows);
    const columnsRef = useRef(columns);
    useEffect(() => {
        rowsRef.current = rows;
        columnsRef.current = columns;
    }, [rows, columns]);

    // --- LocalStorage Helpers ---
    const getStorageKey = (key: string) => `workspace_${workspaceId}_${key}`;

    const getLocalDrafts = () => {
        if (typeof window === 'undefined') return {};
        try {
            const stored = localStorage.getItem(getStorageKey('drafts'));
            return stored ? JSON.parse(stored) : {};
        } catch (e) { return {}; }
    };

    // Updated to support 'extras' for custom columns
    const saveLocalDraft = (dateKey: string, data: { start: string, end: string, note?: string, extras?: Record<number, string> }) => {
        if (typeof window === 'undefined') return;
        const drafts = getLocalDrafts();
        // Merge with existing draft to preserve other fields if partial update
        const existing = drafts[dateKey] || {};
        drafts[dateKey] = { ...existing, ...data, timestamp: Date.now() };
        localStorage.setItem(getStorageKey('drafts'), JSON.stringify(drafts));
    };

    const removeLocalDraft = (dateKey: string) => {
        if (typeof window === 'undefined') return;
        const drafts = getLocalDrafts();
        delete drafts[dateKey];
        localStorage.setItem(getStorageKey('drafts'), JSON.stringify(drafts));
    };

    // Save Table Configuration (Columns & Extra Rows)
    const saveTableConfig = (currentCols: string[], currentRows: string[][]) => {
        if (typeof window === 'undefined') return;
        const config = {
            columns: currentCols,
            // Extra rows that are NOT date rows
            extraRows: currentRows.filter((row, i) => i > 0 && !/^\d{4}-\d{2}-\d{2}/.test(row[0]))
        };
        localStorage.setItem(getStorageKey('table_config'), JSON.stringify(config));
    };

    const loadTableConfig = () => {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem(getStorageKey('table_config'));
            return stored ? JSON.parse(stored) : null;
        } catch (e) { return null; }
    };

    // --- State & Menu ---
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [rewardData, setRewardData] = useState<{ streak: number; addedXP: number } | null>(null);
    const [modalType, setModalType] = useState<'success' | 'info' | 'error'>('success');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const [activeMenu, setActiveMenu] = useState<{ type: 'row' | 'col', index: number, top: number, left: number } | null>(null);
    const [rowsToAdd, setRowsToAdd] = useState<number | ''>(1);

    // Format Date Helper
    const formatDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[date.getDay()];
        return `${yyyy}-${mm}-${dd}(${dayName})`;
    };

    // --- Main Data Fetching ---
    const fetchData = async () => {
        try {
            // Load Config First
            const savedConfig = loadTableConfig();
            let currentCols = INITIAL_COLUMNS;
            let extraRows: string[][] = [];

            if (savedConfig) {
                if (savedConfig.columns) {
                    setColumns(savedConfig.columns);
                    currentCols = savedConfig.columns;
                }
                if (savedConfig.extraRows) {
                    extraRows = savedConfig.extraRows;
                }
            }

            const res = await fetch(`/api/workspaces/${workspaceId}/attendance`);
            if (res.ok) {
                const data = await res.json();
                setCurrentStreak(data.streak);

                // Build Attendance Map
                const attendanceMap = new Map();
                if (data.attendances && Array.isArray(data.attendances)) {
                    data.attendances.forEach((att: any) => {
                        const dateObj = new Date(att.startTime);
                        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                        const start = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                        const endObj = new Date(att.endTime);
                        const end = endObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

                        // Filter legacy 'CHECK-IN'
                        const rawNote = att.note || '';
                        const note = (rawNote === 'CHECK-IN' || rawNote === 'check-in') ? '' : rawNote;

                        attendanceMap.set(dateKey, { start, end, note });
                    });
                }

                setRows(prevRows => {
                    // Determine Date Range
                    let start = new Date();
                    let end = new Date();
                    if (startDate) {
                        start = new Date(startDate);
                        end = endDate ? new Date(endDate) : new Date(start);
                        if (!endDate) {
                            const today = new Date();
                            if (today > start) end.setTime(today.getTime());
                            else end.setTime(start.getTime());
                        }
                    } else {
                        // Default Fallback
                        start = new Date();
                        start.setDate(start.getDate() - 3);
                    }

                    const localDrafts = getLocalDrafts();
                    const newDateRows: string[][] = [];

                    const current = new Date(start);
                    current.setHours(0, 0, 0, 0);
                    const finalEnd = new Date(end);
                    finalEnd.setHours(23, 59, 59, 999);

                    const maxRows = 365;
                    let count = 0;

                    const buildRow = (dateKey: string, dateLabel: string) => {
                        const serverAtt = attendanceMap.get(dateKey);
                        const localAtt = localDrafts[dateKey];

                        let finalStart = '';
                        let finalEnd = '';
                        let finalNote = '';
                        let finalStatus = '';
                        const customValues: Record<number, string> = localAtt?.extras || {};

                        if (serverAtt) {
                            if (serverAtt.note !== 'DRAFT') {
                                finalStart = serverAtt.start;
                                finalEnd = serverAtt.end;
                                finalNote = serverAtt.note || '';
                                finalStatus = '출석 완료 ✅';
                            } else {
                                if (localAtt) {
                                    finalStart = localAtt.start || serverAtt.start;
                                    finalEnd = localAtt.end || serverAtt.end;
                                    finalNote = localAtt.note || serverAtt.note || '';
                                    finalStatus = '작성 중... 💾';
                                } else {
                                    finalStart = serverAtt.start;
                                    finalEnd = serverAtt.end;
                                    finalNote = serverAtt.note || '';
                                    finalStatus = '작성 중... 💾';
                                }
                            }
                        } else if (localAtt) {
                            finalStart = localAtt.start || '';
                            finalEnd = localAtt.end || '';
                            finalNote = localAtt.note || '';
                            finalStatus = '작성 중... 💾';
                        }

                        const rowArray = new Array(currentCols.length).fill('');
                        rowArray[0] = dateLabel;
                        if (currentCols.length > 1) rowArray[1] = finalStart;
                        if (currentCols.length > 2) rowArray[2] = finalEnd;
                        if (currentCols.length > 3) rowArray[3] = finalNote;
                        // Map status to index 4 if default columns
                        if (currentCols.length > 4) rowArray[4] = finalStatus;

                        // Fill custom columns data
                        // Iterate through columns starting from index 5 (after status)
                        // Or actually, just fill any index found in extras
                        Object.keys(customValues).forEach(idxStr => {
                            const idx = parseInt(idxStr);
                            if (idx < rowArray.length && idx !== 4) { // Don't overwrite status
                                rowArray[idx] = customValues[idx];
                            }
                        });

                        return rowArray;
                    };

                    while (current <= finalEnd && count < maxRows) {
                        const yyyy = current.getFullYear();
                        const mm = String(current.getMonth() + 1).padStart(2, '0');
                        const dd = String(current.getDate()).padStart(2, '0');
                        const dateKey = `${yyyy}-${mm}-${dd}`;
                        const dateLabel = formatDate(current);

                        newDateRows.push(buildRow(dateKey, dateLabel));
                        current.setDate(current.getDate() + 1);
                        count++;
                    }

                    const normalizedExtraRows = extraRows.map(r => {
                        const newR = new Array(currentCols.length).fill('');
                        r.forEach((cell, idx) => { if (idx < newR.length) newR[idx] = cell; });
                        return newR;
                    });

                    // Ensure example row has correct length
                    const example = new Array(currentCols.length).fill('');
                    EXAMPLE_ROW.forEach((val, i) => { if (i < example.length) example[i] = val; });

                    return [example, ...newDateRows, ...normalizedExtraRows];
                });
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        fetchData();
    }, [workspaceId, startDate, endDate]);

    // --- Save Logic ---

    const saveDraft = async (rowIndex: number) => {
        const row = rowsRef.current[rowIndex];
        if (!row) return;

        const dateStr = row[0].split('(')[0];
        const startTime = row[1];
        const endTime = row[2];
        const note = row[3];

        // Gather Custom Columns (Index > 4)
        const extras: Record<number, string> = {};
        for (let i = 5; i < row.length; i++) {
            if (row[i]) extras[i] = row[i];
        }

        const isDateRow = /^\d{4}-\d{2}-\d{2}/.test(dateStr);
        if (!isDateRow) {
            saveTableConfig(columnsRef.current, rowsRef.current);
            return;
        }

        // 1. If Empty -> Clear Local Draft
        // Check if ANY field has data
        const hasData = startTime || endTime || note || Object.keys(extras).length > 0;

        if (!hasData) {
            removeLocalDraft(dateStr);
            setRows(prev => {
                const copy = [...prev];
                if (copy[rowIndex]) {
                    copy[rowIndex] = [...copy[rowIndex]];
                    if (copy[rowIndex].length > 4) copy[rowIndex][4] = '';
                }
                return copy;
            });
            try {
                const dateObj = new Date(dateStr);
                await fetch(`/api/workspaces/${workspaceId}/attendance/check-in`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: dateObj.toISOString(),
                        type: 'delete'
                    }),
                });
            } catch (e) { }
            return;
        }

        // 2. Local Save
        saveLocalDraft(dateStr, { start: startTime, end: endTime, note, extras });

        // Optimistic Status Update
        // Show "Writing..." if there is data, but only update Status Column (Idx 4)
        setRows(prev => {
            const copy = [...prev];
            if (copy[rowIndex]) {
                copy[rowIndex] = [...copy[rowIndex]];
                if (copy[rowIndex].length > 4) copy[rowIndex][4] = '작성 중... 💾';
            }
            return copy;
        });

        // 3. Server Save (Only standard fields)
        try {
            const dateObj = new Date(dateStr);
            await fetch(`/api/workspaces/${workspaceId}/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateObj.toISOString(),
                    startTime: startTime || '',
                    endTime: endTime || '',
                    note: note || '',
                    type: 'save'
                }),
            });
        } catch (error) { console.error(error); }
    };

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        if (rowIndex === 0) return;
        if (colIndex === 4) return; // Block Status Edit

        const newRows = [...rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = value;

        setRows(newRows);

        const row = newRows[rowIndex];
        const isDateRow = /^\d{4}-\d{2}-\d{2}/.test(row[0]);
        if (!isDateRow) {
            saveTableConfig(columns, newRows);
        }
    };

    const handleColumnHeaderChange = (colIndex: number, value: string) => {
        const newCols = [...columns];
        newCols[colIndex] = value;
        setColumns(newCols);
        saveTableConfig(newCols, rows);
    };

    const addRows = () => {
        const count = rowsToAdd === '' ? 1 : rowsToAdd;
        const newRows = [];

        // Find the last valid date in the current rows to increment from
        let lastDateObj = new Date(); // Default if no rows exist
        let foundDate = false;

        for (let i = rows.length - 1; i >= 0; i--) {
            const dateStr = rows[i][0].split('(')[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                lastDateObj = new Date(dateStr);
                foundDate = true;
                break;
            }
        }

        // If we didn't find a date in the table but have startDate prop, might want to use that?
        // But referencing the *last visible row* is usually what the user expects effectively.

        for (let i = 0; i < count; i++) {
            lastDateObj.setDate(lastDateObj.getDate() + 1);

            // Format: YYYY-MM-DD(Day)
            const nextDateStr = formatDate(lastDateObj);

            const newRow = new Array(columns.length).fill('');
            newRow[0] = nextDateStr; // Pre-fill Date Column

            newRows.push(newRow);
        }

        const updatedRows = [...rows, ...newRows];
        setRows(updatedRows);
        saveTableConfig(columns, updatedRows);
    };

    const deleteRow = (rowIndex: number) => {
        if (rowIndex === 0) return;
        const updatedRows = rows.filter((_, i) => i !== rowIndex);
        setRows(updatedRows);
        saveTableConfig(columns, updatedRows);
        setActiveMenu(null);
    };

    const addColumn = () => {
        const newCols = [...columns, '새 열'];
        setColumns(newCols);
        const updatedRows = rows.map(row => [...row, '']);
        setRows(updatedRows);
        saveTableConfig(newCols, updatedRows);
    };

    const deleteColumn = (colIndex: number) => {
        if (colIndex < INITIAL_COLUMNS.length) return;
        const newCols = columns.filter((_, i) => i !== colIndex);
        setColumns(newCols);
        const updatedRows = rows.map(row => row.filter((_, i) => i !== colIndex));
        setRows(updatedRows);
        saveTableConfig(newCols, updatedRows);
        setActiveMenu(null);
    };

    const checkAttendance = async () => {
        const today = new Date();
        const todayStr = formatDate(today);
        const todayRowIndex = rows.findIndex(row => row[0] === todayStr);

        if (todayRowIndex === -1) {
            setModalType('error'); setModalTitle('오류'); setModalMessage('오늘 날짜의 행을 찾을 수 없습니다.'); setShowRewardModal(true); return;
        }

        const todayRow = rows[todayRowIndex];
        const startTime = todayRow[1];
        const endTime = todayRow[2];
        const note = todayRow[3];

        if (!startTime || !endTime) {
            setModalType('error'); setModalTitle('입력 부족'); setModalMessage('학습 시작 시간과 종료 시간을 모두 입력해주세요.'); setShowRewardModal(true); return;
        }

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: today.toISOString(),
                    startTime, endTime, note,
                    type: 'confirm'
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 400 && data.error === 'Already checked in today') {
                    setModalType('info'); setModalTitle('미션 완료'); setModalMessage('오늘의 출석이 이미 완료되었습니다!');
                } else {
                    setModalType('error'); setModalTitle('출석 체크 실패'); setModalMessage(data.error || '오류 발생');
                }
                setShowRewardModal(true);
                return;
            }
            if (data.success) {
                setModalType('success'); setModalTitle('출석체크 완료!'); setModalMessage('오늘의 여정을 시작하신 것을 축하합니다.');
                setRewardData({ streak: data.streak, addedXP: data.addedXP });
                setShowRewardModal(true);
                setCurrentStreak(data.streak);
                removeLocalDraft(todayStr.split('(')[0]);
                if (onCheckInComplete && data.newTotalXP) onCheckInComplete(data.newTotalXP);
                fetchData();
            }
        } catch (error) {
            setModalType('error'); setModalTitle('오류'); setModalMessage('서버 오류'); setShowRewardModal(true);
        }
    };

    const toggleMenu = (type: 'row' | 'col', index: number, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (activeMenu?.type === type && activeMenu?.index === index) setActiveMenu(null);
        else {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveMenu({ type, index, top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 100 });
        }
    };

    const renderMenu = () => {
        if (!activeMenu) return null;
        if (typeof document === 'undefined') return null;
        const isCol = activeMenu.type === 'col';
        return createPortal(
            <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9998, cursor: 'default' }} onClick={() => setActiveMenu(null)} />
                <div style={{ position: 'fixed', top: `${activeMenu.top}px`, left: `${activeMenu.left}px`, backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', zIndex: 9999, minWidth: '120px', overflow: 'hidden' }}>
                    <button onClick={() => isCol ? deleteColumn(activeMenu.index) : deleteRow(activeMenu.index)} style={{ width: '100%', padding: '10px 12px', textAlign: 'left', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#27272a'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <FiTrash2 size={14} /> {isCol ? '열 삭제' : '행 삭제'}
                    </button>
                </div>
            </>, document.body
        );
    };

    return (
        <>
            <AttendanceRewardModal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} data={rewardData} type={modalType} title={modalTitle} message={modalMessage} />
            <section className={styles.section} style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', padding: '0', position: 'relative' }}>
                {renderMenu()}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '1.1rem', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%' }}>🔥</div>
                        {currentStreak} Day Streak
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {minStudyHours > 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#e4e4e7', background: 'linear-gradient(135deg, rgba(39, 39, 42, 0.8) 0%, rgba(63, 63, 70, 0.8) 100%)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}>🎯</span><span>최소 <strong style={{ color: '#fbbf24' }}>{minStudyHours}시간</strong> 목표</span>
                            </div>
                        )}
                        <button onClick={checkAttendance} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiCheck size={18} /> 출석체크
                        </button>
                    </div>
                </div>

                {/* Main Table Scroll Container */}
                <div
                    className={styles.premiumScrollbar}
                    style={{
                        overflow: 'auto', // Enable both X and Y
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        backgroundColor: '#18181b',
                        marginBottom: '1rem',
                        minHeight: '300px',
                        maxHeight: '600px'
                    }}
                >
                    {isLoaded ? (
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.9rem', textAlign: 'center', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#27272a' }}>
                                    {columns.map((col, colIndex) => {
                                        // Sticky Logic for Header
                                        const isFirstCol = colIndex === 0;
                                        return (
                                            <th
                                                key={colIndex}
                                                style={{
                                                    padding: 0,
                                                    borderBottom: '1px solid #3f3f46',
                                                    borderRight: '1px solid #3f3f46',
                                                    minWidth: '120px',
                                                    position: 'sticky', // Sticky Header
                                                    top: 0,
                                                    left: isFirstCol ? 0 : 'auto',
                                                    zIndex: isFirstCol ? 30 : 20, // Keep header above rows, and corner above all
                                                    backgroundColor: '#27272a' // Solid background to cover scrolling content
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input type="text" value={col} onChange={(e) => handleColumnHeaderChange(colIndex, e.target.value)} style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#e4e4e7', textAlign: 'center', fontWeight: 'bold', outline: 'none' }} />
                                                    {colIndex >= INITIAL_COLUMNS.length && (
                                                        <button onClick={(e) => toggleMenu('col', colIndex, e)} style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '8px' }}><FiMoreVertical size={16} /></button>
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                    {/* Add Button Header - Sticky Top Right */}
                                    <th style={{
                                        width: '50px',
                                        padding: 0,
                                        borderBottom: '1px solid #3f3f46',
                                        borderLeft: '1px solid #3f3f46',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 20,
                                        backgroundColor: '#202023'
                                    }}>
                                        <button onClick={addColumn} style={{ width: '100%', height: '100%', padding: '12px 0', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><FiPlus size={16} /></button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rowIndex) => {
                                    const isExample = rowIndex === 0;
                                    return (
                                        <tr key={rowIndex} style={{ borderBottom: '1px solid #27272a', backgroundColor: isExample ? '#27272a50' : 'transparent' }}>
                                            {row.map((cell, colIndex) => {
                                                const isFirstCol = colIndex === 0;
                                                return (
                                                    <td
                                                        key={colIndex}
                                                        style={{
                                                            padding: 0,
                                                            borderRight: '1px solid #3f3f46',
                                                            borderBottom: '1px solid #27272a', /* Row Line */
                                                            backgroundColor: isFirstCol
                                                                ? '#18181b' /* Default BG for Sticky Col */
                                                                : (colIndex === 4 && !isExample ? 'rgba(52, 211, 153, 0.05)' : 'transparent'),
                                                            position: isFirstCol ? 'sticky' : 'static',
                                                            left: isFirstCol ? 0 : 'auto',
                                                            zIndex: isFirstCol ? 10 : 1
                                                        }}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={cell}
                                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                                            readOnly={isExample || colIndex === 4}
                                                            onBlur={() => { if (!isExample) saveDraft(rowIndex); }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px',
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: isExample ? '#71717a' : colIndex === 4 ? '#34d399' : '#d4d4d8',
                                                                textAlign: 'center',
                                                                outline: 'none',
                                                                fontStyle: isExample ? 'italic' : 'normal',
                                                                cursor: isExample || colIndex === 4 ? 'default' : 'text'
                                                            }}
                                                            placeholder={'-'}
                                                        />
                                                    </td>
                                                );
                                            })}
                                            <td style={{
                                                padding: '0',
                                                verticalAlign: 'middle',
                                                position: 'relative',
                                                borderLeft: '1px solid #3f3f46',
                                                borderBottom: '1px solid #27272a'
                                            }}>
                                                {!isExample && (
                                                    <button onClick={(e) => toggleMenu('row', rowIndex, e)} style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiMoreVertical size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : <div style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>테이블 데이터 불러오는 중...</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={addRows} style={{ flex: 1, height: '48px', backgroundColor: '#27272a', color: '#a1a1aa', border: '1px dashed #52525b', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FiPlus /> {rowsToAdd === '' ? 1 : rowsToAdd}개 행 추가
                    </button>
                    <div style={{ position: 'relative', width: '120px', height: '48px' }}>
                        <input type="number" min="1" max="50" value={rowsToAdd} onChange={(e) => { const val = e.target.value; setRowsToAdd(val === '' ? '' : parseInt(val)); }} onBlur={() => { if (!rowsToAdd) setRowsToAdd(1); }} className={styles.noSpinners} style={{ width: '100%', height: '100%', padding: '0 14px', backgroundColor: '#27272a', color: '#e4e4e7', border: '1px solid #3f3f46', borderRadius: '8px', textAlign: 'center', outline: 'none' }} />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: '0.8rem', pointerEvents: 'none' }}>개</span>
                    </div>
                </div>
            </section>
        </>
    );
}
