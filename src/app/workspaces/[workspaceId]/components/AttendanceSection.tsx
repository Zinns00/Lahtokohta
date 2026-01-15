"use client";

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { FiPlus, FiTrash2, FiMoreVertical } from "react-icons/fi";

const INITIAL_COLUMNS = ['년-월-일', '학습시작시간', '학습종료시간', '사유(외출, 조퇴 등)'];

const EXAMPLE_ROW = ['예시: 2025-01-15(수)', '09:00', '18:00', '예시: 병원 진료로 외출'];

interface AttendanceSectionProps {
    streak: number;
    startDate?: string | Date;
    endDate?: string | Date;
    attendances?: any[];
}

export default function AttendanceSection({ streak, startDate, endDate, attendances }: AttendanceSectionProps) {
    const [columns, setColumns] = useState<string[]>(INITIAL_COLUMNS);
    const [rows, setRows] = useState<string[][]>([]);

    // Menu State
    const [activeMenu, setActiveMenu] = useState<{ type: 'row' | 'col', index: number } | null>(null);

    // Helper: Format Date to YYYY-MM-DD(Day)
    const formatDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[date.getDay()];
        return `${yyyy}-${mm}-${dd}(${dayName})`;
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

        // If no end date, default to +6 days
        if (!endDate) {
            end.setDate(end.getDate() + 6);
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

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        if (rowIndex === 0) return; // Prevent editing example row via handler
        const newRows = [...rows];
        newRows[rowIndex] = [...newRows[rowIndex]];
        newRows[rowIndex][colIndex] = value;
        setRows(newRows);
    };

    const handleColumnHeaderChange = (colIndex: number, value: string) => {
        const newCols = [...columns];
        newCols[colIndex] = value;
        setColumns(newCols);
    };

    const addRow = () => {
        setRows([...rows, new Array(columns.length).fill('')]);
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

    const toggleMenu = (type: 'row' | 'col', index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeMenu?.type === type && activeMenu?.index === index) {
            setActiveMenu(null);
        } else {
            setActiveMenu({ type, index });
        }
    };

    return (
        <section className={styles.section} style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', padding: '0', position: 'relative' }}>
            {/* Backdrop for menu */}
            {activeMenu && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 50, cursor: 'default' }}
                    onClick={() => setActiveMenu(null)}
                />
            )}

            {/* Header / Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 'bold' }}>
                    🔥 {streak} Streak
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
                                                padding: '12px 12px 12px 36px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#e4e4e7',
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                outline: 'none'
                                            }}
                                        />
                                        {colIndex >= INITIAL_COLUMNS.length && (
                                            <>
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
                                                {/* Column Menu */}
                                                {activeMenu?.type === 'col' && activeMenu.index === colIndex && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '36px',
                                                        right: '8px',
                                                        backgroundColor: '#18181b', // Main popup bg
                                                        border: '1px solid #3f3f46',
                                                        borderRadius: '6px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                        zIndex: 100,
                                                        minWidth: '120px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            onClick={() => deleteColumn(colIndex)}
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
                                                    </div>
                                                )}
                                            </>
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
                                                readOnly={isExample}
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
                                            <>
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
                                                {/* Row Menu */}
                                                {activeMenu?.type === 'row' && activeMenu.index === rowIndex && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '30px',
                                                        right: '30px',
                                                        backgroundColor: '#18181b', // Main popup bg
                                                        border: '1px solid #3f3f46',
                                                        borderRadius: '6px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                        zIndex: 100,
                                                        minWidth: '120px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <button
                                                            onClick={() => deleteRow(rowIndex)}
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
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <button
                onClick={addRow}
                style={{
                    width: '100%',
                    padding: '14px',
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
                <FiPlus /> 행 추가 (Add Row)
            </button>
        </section>
    );
}
