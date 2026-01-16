import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import styles from '../page.module.css';
import { FiPlus, FiTrash2, FiMoreVertical, FiCheck } from "react-icons/fi";
import AttendanceRewardModal from '@/components/AttendanceRewardModal';

const INITIAL_COLUMNS = ['년-월-일', '학습시작시간', '학습종료시간', '사유(외출, 조퇴 등)'];

const EXAMPLE_ROW = ['예시: 2025-01-15(수)', '09:00', '18:00', '예시: 병원 진료로 외출'];

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

    // Ref to solve Stale Closure in onBlur
    const rowsRef = useRef(rows);
    useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    // LocalStorage Helper
    const getLocalDraftKey = () => `attendance_drafts_${workspaceId}`;
    const getLocalDrafts = () => {
        if (typeof window === 'undefined') return {};
        try {
            const stored = localStorage.getItem(getLocalDraftKey());
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Failed to parse local drafts', e);
            return {};
        }
    };
    const saveLocalDraft = (dateKey: string, data: { start: string, end: string, note?: string }) => {
        if (typeof window === 'undefined') return;
        const drafts = getLocalDrafts();
        drafts[dateKey] = { ...data, timestamp: Date.now() };
        localStorage.setItem(getLocalDraftKey(), JSON.stringify(drafts));
    };
    const removeLocalDraft = (dateKey: string) => {
        if (typeof window === 'undefined') return;
        const drafts = getLocalDrafts();
        delete drafts[dateKey];
        localStorage.setItem(getLocalDraftKey(), JSON.stringify(drafts));
    };

    // Reward Modal State
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [rewardData, setRewardData] = useState<{ streak: number; addedXP: number } | null>(null);
    const [modalType, setModalType] = useState<'success' | 'info' | 'error'>('success');
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    // Menu State
    const [activeMenu, setActiveMenu] = useState<{ type: 'row' | 'col', index: number, top: number, left: number } | null>(null);
    const [rowsToAdd, setRowsToAdd] = useState<number | ''>(1);

    // Helper: Format Date to YYYY-MM-DD(Day)
    const formatDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[date.getDay()];
        return `${yyyy}-${mm}-${dd}(${dayName})`;
    };

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/attendance`);
            if (res.ok) {
                const data = await res.json();
                setCurrentStreak(data.streak);

                if (data.attendances && Array.isArray(data.attendances)) {
                    // Create a lookup map: "YYYY-MM-DD" -> Attendance Record
                    const attendanceMap = new Map();
                    data.attendances.forEach((att: any) => {
                        const dateObj = new Date(att.startTime);
                        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

                        // Extract HH:mm
                        const start = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                        const endObj = new Date(att.endTime);
                        const end = endObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

                        attendanceMap.set(dateKey, { start, end, note: att.note });
                    });

                    setRows(prevRows => {
                        const newRows = [...prevRows];
                        const processedDates = new Set();

                        // 0. Load Local Drafts
                        const localDrafts = getLocalDrafts();

                        // 1. Update existing rows
                        const updatedRows = newRows.map((row, index) => {
                            if (index === 0) return row; // Skip header

                            const datePart = row[0].split('(')[0]; // "YYYY-MM-DD"

                            const serverAtt = attendanceMap.get(datePart);
                            const localAtt = localDrafts[datePart];

                            let finalStart = '';
                            let finalEnd = '';
                            let finalStatus = '';

                            if (serverAtt) {
                                if (serverAtt.note !== 'DRAFT') {
                                    // Confirmed attendance - Trust Server
                                    finalStart = serverAtt.start;
                                    finalEnd = serverAtt.end;
                                    finalStatus = '출석 완료 ✅';
                                } else {
                                    // Server has Draft
                                    // If local exists and has data, use local
                                    if (localAtt && (localAtt.start || localAtt.end)) {
                                        finalStart = localAtt.start;
                                        finalEnd = localAtt.end;
                                        finalStatus = '작성 중... 💾';
                                    } else {
                                        finalStart = serverAtt.start;
                                        finalEnd = serverAtt.end;
                                        finalStatus = '작성 중... 💾';
                                    }
                                }
                            } else {
                                // No Server Data - Check Local
                                if (localAtt && (localAtt.start || localAtt.end)) {
                                    finalStart = localAtt.start;
                                    finalEnd = localAtt.end;
                                    finalStatus = '작성 중... 💾';
                                }
                            }

                            // Apply if we found data (either server or local)
                            if (serverAtt || (localAtt && !attendanceMap.has(datePart))) {
                                if (serverAtt) processedDates.add(datePart); // Mark processed if valid server data
                                if (localAtt && !serverAtt) processedDates.add(datePart); // Mark if relying on local

                                const newRow = [...row];
                                if (finalStart || finalEnd || finalStatus) {
                                    if (finalStart) newRow[1] = finalStart;
                                    if (finalEnd) newRow[2] = finalEnd;
                                    if (finalStatus) newRow[3] = finalStatus;
                                }
                                return newRow;
                            }

                            return row;
                        });

                        // 2. Add missing rows from history (Server OR Local)
                        const allDates = new Set([...attendanceMap.keys(), ...Object.keys(localDrafts)]);

                        allDates.forEach((dateKey) => {
                            if (!processedDates.has(dateKey)) {
                                const serverAtt = attendanceMap.get(dateKey);
                                const localAtt = localDrafts[dateKey] as any;

                                let finalStart = '';
                                let finalEnd = '';
                                let finalStatus = '';

                                if (serverAtt && serverAtt.note !== 'DRAFT') {
                                    finalStart = serverAtt.start;
                                    finalEnd = serverAtt.end;
                                    finalStatus = '출석 완료 ✅';
                                } else if (localAtt) {
                                    finalStart = localAtt.start;
                                    finalEnd = localAtt.end;
                                    finalStatus = '작성 중... 💾';
                                } else if (serverAtt) {
                                    finalStart = serverAtt.start;
                                    finalEnd = serverAtt.end;
                                    finalStatus = '작성 중... 💾';
                                }

                                // Reconstruct format: YYYY-MM-DD(Day)
                                const dateObj = new Date(dateKey);
                                const days = ['일', '월', '화', '수', '목', '금', '토'];
                                const dayName = days[dateObj.getDay()];
                                const dateStr = `${dateKey}(${dayName})`;

                                updatedRows.push([
                                    dateStr,
                                    finalStart,
                                    finalEnd,
                                    finalStatus
                                ]);
                            }
                        });

                        // Sort rows by date? Optional but good for consistency
                        // Skip header (0), sort rest
                        const header = updatedRows[0];
                        const body = updatedRows.slice(1).sort((a, b) => {
                            const dateA = a[0].split('(')[0];
                            const dateB = b[0].split('(')[0];
                            return dateA.localeCompare(dateB);
                        });

                        return [header, ...body];
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch attendance data', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [workspaceId]);

    const saveDraft = async (rowIndex: number) => {
        // Use Ref to get latest data (avoids stale closure on fast blur)
        const row = rowsRef.current[rowIndex];
        if (!row) return;

        const dateStr = row[0].split('(')[0]; // YYYY-MM-DD
        const startTime = row[1];
        const endTime = row[2];

        // 1. Save or Clear LocalDraft
        // If both empty, remove draft
        if (!startTime && !endTime) {
            removeLocalDraft(dateStr);

            // Remove "Writing..." status visually if it was there
            setRows(prevRows => {
                const newRows = [...prevRows];
                if (newRows[rowIndex]) {
                    newRows[rowIndex] = [...newRows[rowIndex]];
                    newRows[rowIndex][3] = ''; // Clear status
                }
                return newRows;
            });

            // Call API to remove Server Draft if exists
            try {
                // We need a valid Date object for the API, even for deletion key
                const dateObj = new Date(dateStr);
                await fetch(`/api/workspaces/${workspaceId}/attendance/check-in`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: dateObj.toISOString(),
                        startTime: '00:00', // Dummy time required by validation
                        endTime: '00:00',   // Dummy time
                        type: 'delete'
                    }),
                });
            } catch (e) {
                console.error('Failed to delete server draft', e);
            }
            return;
        }

        // Optimistic UI Update: Mark as Saving immediately
        setRows(prevRows => {
            const newRows = [...prevRows];
            if (newRows[rowIndex]) {
                newRows[rowIndex] = [...newRows[rowIndex]];
                newRows[rowIndex][3] = '작성 중... 💾'; // Optimistic status
            }
            return newRows;
        });

        // Save valid partial draft
        saveLocalDraft(dateStr, { start: startTime, end: endTime });

        // Only save to DB if valid draft (At least we need both times for the DB schema usually, 
        // or check backend requirement. Backend rejects if missing fields.
        // So we only call API if both are present to avoid 400 errors.)
        if (!startTime || !endTime) return;

        // Convert dateStr back to Date object for API
        const dateObj = new Date(dateStr);

        try {
            await fetch(`/api/workspaces/${workspaceId}/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateObj.toISOString(),
                    startTime,
                    endTime,
                    type: 'save' // DRAFT MODE
                }),
            });
            fetchData(); // Refresh to confirm sync

            // If saved successfully to DB (as draft), we can keep local default active 
            // or even rely on DB next load. But keeping local is fine as backup.
        } catch (error) {
            console.error('Auto-save failed', error);
        }
    };

    const checkAttendance = async () => {
        const today = new Date();
        const todayStr = formatDate(today);

        // Find row for today
        const todayRowIndex = rows.findIndex(row => row[0] === todayStr);
        if (todayRowIndex === -1) {
            // If row doesn't exist (e.g. manually added but date mismatch?), add it?
            // Or just error.
            setModalType('error');
            setModalTitle('오류');
            setModalMessage('오늘 날짜의 행을 찾을 수 없습니다.');
            setShowRewardModal(true);
            return;
        }

        const todayRow = rows[todayRowIndex];
        const startTime = todayRow[1];
        const endTime = todayRow[2];

        if (!startTime || !endTime) {
            setModalType('error');
            setModalTitle('입력 부족');
            setModalMessage('학습 시작 시간과 종료 시간을 모두 입력해주세요.');
            setShowRewardModal(true);
            return;
        }

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/attendance/check-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: today.toISOString(),
                    startTime,
                    endTime,
                    type: 'confirm' // CONFIRM MODE
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle "Already checked in" specifically
                if (res.status === 400 && data.error === 'Already checked in today') {
                    setModalType('info');
                    setModalTitle('미션 완료 (Mission Complete)');
                    setModalMessage('오늘의 출석이 이미 완료되었습니다!\n내일 새로운 도전을 이어가세요.');
                    setShowRewardModal(true);
                } else {
                    setModalType('error');
                    setModalTitle('출석 체크 실패');
                    setModalMessage(data.error || '알 수 없는 오류가 발생했습니다.');
                    setShowRewardModal(true);
                }
                return;
            }

            if (data.success) {
                // Show Reward Modal instead of alert
                setModalType('success');
                setModalTitle('출석체크 완료!');
                setModalMessage('오늘의 여정을 시작하신 것을 축하합니다.');
                setRewardData({ streak: data.streak, addedXP: data.addedXP });
                setShowRewardModal(true);

                setCurrentStreak(data.streak);

                // Clear local draft for today as it is now confirmed
                removeLocalDraft(todayStr.split('(')[0]);

                if (onCheckInComplete && data.newTotalXP) {
                    console.log('Calling onCheckInComplete with newTotalXP:', data.newTotalXP);
                    onCheckInComplete(data.newTotalXP);
                } else {
                    console.log('onCheckInComplete skipped:', { hasCallback: !!onCheckInComplete, newTotalXP: data.newTotalXP });
                }

                fetchData(); // Refresh to update status
            }

        } catch (error) {
            console.error('Check-in failed', error);
            setModalType('error');
            setModalTitle('오류');
            setModalMessage('서버 오류로 출석 체크에 실패했습니다.');
            setShowRewardModal(true);
        }
    };

    useEffect(() => {
        if (!startDate) {
            // Default rows if no date provided
            setRows([
                EXAMPLE_ROW,
                ['2025-01-01(월)', '', '', ''],
                ['2025-01-02(화)', '', '', ''],
            ]);
            return;
        }

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(start);

        // If no end date (Ongoing), default to showing rows up to Today.
        // This creates a "Daily" feeling where new rows appear as days pass.
        if (!endDate) {
            const today = new Date();
            // If we started in the past, show up to today.
            // If we start in the future (scheduled), show at least the start date.
            if (today > start) {
                end.setTime(today.getTime());
            } else {
                end.setTime(start.getTime());
            }
        }

        const dateRows: string[][] = [];

        // 1. Add Example Row (Fixed)
        dateRows.push(EXAMPLE_ROW);

        // 2. Generate Date Rows
        const current = new Date(start);
        const maxRows = 365; // Safety limit
        let count = 0;
        while (current <= end && count < maxRows) {
            const dateStr = formatDate(current);
            dateRows.push([dateStr, '', '', '']);
            current.setDate(current.getDate() + 1);
            count++;
        }

        setRows(dateRows);

    }, [startDate, endDate]);

    // Close menu on scroll or resize
    useEffect(() => {
        const handleScroll = () => setActiveMenu(null);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        if (rowIndex === 0) return; // Prevent editing example row via handler
        const newRows = [...rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = value;
        setRows(newRows);
        rowsRef.current = newRows; // Update Ref immediately for onBlur

        // Real-time Persistence: Save to LocalStorage immediately on change
        // This prevents data loss if user refreshes while typing (before blur)
        const row = newRows[rowIndex];
        const dateStr = row[0].split('(')[0];
        const startTime = row[1];
        const endTime = row[2];

        // If both empty, we might want to wait for blur to delete, 
        // to avoid spamming delete on backspace. 
        // But for saving, let's keep it safe.
        if (startTime || endTime) {
            saveLocalDraft(dateStr, { start: startTime, end: endTime });

            // Optional: Set "Writing..." status immediately if not set
            if (row[3] === '') {
                newRows[rowIndex][3] = '작성 중... 💾';
                setRows(newRows);
            }
        }
    };

    const handleColumnHeaderChange = (colIndex: number, value: string) => {
        const newCols = [...columns];
        newCols[colIndex] = value;
        setColumns(newCols);
    };

    const addRows = () => {
        const count = rowsToAdd === '' ? 1 : rowsToAdd;
        const newRows = [];
        for (let i = 0; i < count; i++) {
            newRows.push(new Array(columns.length).fill(''));
        }
        setRows([...rows, ...newRows]);
    };

    const deleteRow = (rowIndex: number) => {
        if (rowIndex === 0) return; // Cannot delete example row
        setRows(rows.filter((_, i) => i !== rowIndex));
        setActiveMenu(null);
    };

    const addColumn = () => {
        setColumns([...columns, '새 열']);
        setRows(rows.map(row => [...row, '']));
    };

    const deleteColumn = (colIndex: number) => {
        // Prevent deleting original columns - Safety check (UI also prevents this)
        if (colIndex < INITIAL_COLUMNS.length) return;

        setColumns(columns.filter((_, i) => i !== colIndex));
        setRows(rows.map(row => row.filter((_, i) => i !== colIndex)));
        setActiveMenu(null);
    };

    const toggleMenu = (type: 'row' | 'col', index: number, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (activeMenu?.type === type && activeMenu?.index === index) {
            setActiveMenu(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveMenu({
                type,
                index,
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX - 100 // Shift left to align better
            });
        }
    };

    const renderMenu = () => {
        if (!activeMenu) return null;

        // Ensure document is available
        if (typeof document === 'undefined') return null;

        const menuContent = activeMenu.type === 'col' ? (
            <button
                onClick={() => deleteColumn(activeMenu.index)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444', // Red for delete action
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#27272a'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
                <FiTrash2 size={14} /> 열 삭제
            </button>
        ) : (
            <button
                onClick={() => deleteRow(activeMenu.index)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444', // Red for delete action
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#27272a'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
                <FiTrash2 size={14} /> 행 삭제
            </button>
        );

        return createPortal(
            <>
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9998, cursor: 'default' }}
                    onClick={() => setActiveMenu(null)}
                />
                <div style={{
                    position: 'fixed',
                    top: `${activeMenu.top}px`,
                    left: `${activeMenu.left}px`,
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    minWidth: '120px',
                    overflow: 'hidden'
                }}>
                    {menuContent}
                </div>
            </>,
            document.body
        );
    };

    return (
        <>
            <AttendanceRewardModal
                isOpen={showRewardModal}
                onClose={() => setShowRewardModal(false)}
                data={rewardData}
                type={modalType}
                title={modalTitle}
                message={modalMessage}
            />

            <section className={styles.section} style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', padding: '0', position: 'relative' }}>
                {renderMenu()}

                {/* Header / Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '1.1rem', color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%' }}>
                            🔥
                        </div>
                        {currentStreak} Day Streak
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {minStudyHours > 0 && (
                            <div style={{
                                fontSize: '0.85rem',
                                color: '#e4e4e7',
                                background: 'linear-gradient(135deg, rgba(39, 39, 42, 0.8) 0%, rgba(63, 63, 70, 0.8) 100%)',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ fontSize: '1rem' }}>🎯</span>
                                <span>최소 <strong style={{ color: '#fbbf24' }}>{minStudyHours}시간</strong> 목표</span>
                            </div>
                        )}
                        <button
                            onClick={checkAttendance}
                            style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.9rem',
                                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
                                transition: 'transform 0.1s',
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <FiCheck size={18} /> 출석체크
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div style={{ overflowX: 'auto', border: '1px solid #3f3f46', borderRadius: '8px', backgroundColor: '#18181b', marginBottom: '1rem', minHeight: '300px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'center', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#27272a' }}>
                                {columns.map((col, colIndex) => (
                                    <th key={colIndex} style={{ padding: 0, borderBottom: '1px solid #3f3f46', borderRight: '1px solid #3f3f46', minWidth: '120px', position: 'relative' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                value={col}
                                                onChange={(e) => handleColumnHeaderChange(colIndex, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#e4e4e7',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    outline: 'none'
                                                }}
                                            />
                                            {colIndex >= INITIAL_COLUMNS.length && (
                                                <button
                                                    onClick={(e) => toggleMenu('col', colIndex, e)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#71717a',
                                                        cursor: 'pointer',
                                                        padding: '8px',
                                                        marginRight: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        borderRadius: '4px',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#3f3f46'; e.currentTarget.style.color = '#e4e4e7'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#71717a'; }}
                                                >
                                                    <FiMoreVertical size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th style={{ width: '50px', padding: 0, borderBottom: '1px solid #3f3f46', verticalAlign: 'middle', backgroundColor: '#202023' }}>
                                    <button
                                        onClick={addColumn}
                                        title="열 추가"
                                        style={{ width: '100%', height: '100%', padding: '12px 0', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
                                    >
                                        <FiPlus size={16} />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => {
                                const isExample = rowIndex === 0;
                                return (
                                    <tr key={rowIndex} style={{ borderBottom: '1px solid #27272a', backgroundColor: isExample ? '#27272a50' : 'transparent' }}>
                                        {row.map((cell, colIndex) => (
                                            <td key={colIndex} style={{ padding: 0, borderRight: '1px solid #3f3f46' }}>
                                                <input
                                                    type="text"
                                                    value={cell}
                                                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur(); // Trigger blur to save
                                                        }
                                                    }}
                                                    readOnly={isExample}
                                                    onBlur={() => {
                                                        // Auto-save on blur for Date (0) and Time columns (1 & 2)
                                                        if (!isExample && (colIndex === 0 || colIndex === 1 || colIndex === 2)) {
                                                            saveDraft(rowIndex);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: isExample ? '#71717a' : '#d4d4d8',
                                                        textAlign: 'center',
                                                        outline: 'none',
                                                        fontStyle: isExample ? 'italic' : 'normal',
                                                        cursor: isExample ? 'default' : 'text'
                                                    }}
                                                    placeholder={'-'}
                                                />
                                            </td>
                                        ))}
                                        <td style={{ padding: '0', verticalAlign: 'middle', position: 'relative' }}>
                                            {!isExample && (
                                                <button
                                                    onClick={(e) => toggleMenu('row', rowIndex, e)}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#71717a',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '12px 0'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.color = '#e4e4e7'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.color = '#71717a'; }}
                                                >
                                                    <FiMoreVertical size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={addRows}
                        style={{
                            flex: 1,
                            height: '48px',
                            padding: '0 14px',
                            backgroundColor: '#27272a',
                            color: '#a1a1aa',
                            border: '1px dashed #52525b',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#3f3f46'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#27272a'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                        <FiPlus /> {rowsToAdd === '' ? 1 : rowsToAdd}개 행 추가 (Add {rowsToAdd === '' ? 1 : rowsToAdd} Rows)
                    </button>

                    <div style={{ position: 'relative', width: '120px', height: '48px' }}>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={rowsToAdd}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    setRowsToAdd('');
                                } else {
                                    const num = parseInt(val);
                                    if (!isNaN(num)) {
                                        setRowsToAdd(Math.min(50, num)); // Allow 0 or any typing, limit max only
                                    }
                                }
                            }}
                            onBlur={() => {
                                if (rowsToAdd === '' || rowsToAdd < 1) {
                                    setRowsToAdd(1);
                                }
                            }}
                            className={styles.noSpinners}
                            style={{
                                width: '100%',
                                height: '100%',
                                padding: '0 14px',
                                backgroundColor: '#27272a',
                                color: '#e4e4e7',
                                border: '1px solid #3f3f46',
                                borderRadius: '8px',
                                textAlign: 'center',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: '0.8rem', pointerEvents: 'none' }}>
                            개
                        </span>
                    </div>
                </div>
            </section>
        </>
    );
}
