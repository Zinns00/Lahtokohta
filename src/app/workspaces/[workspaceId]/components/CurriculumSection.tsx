"use client";

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import {
    FiCheckCircle, FiCircle, FiPlayCircle, FiCode, FiFileText,
    FiChevronDown, FiChevronRight, FiClock, FiPlus, FiMoreHorizontal, FiMessageSquare, FiHash,
    FiLock, FiUnlock, FiBook, FiUser
} from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type Tab = 'CURRICULUM' | 'PERSONAL';
type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

interface CurriculumItem {
    id: number;
    title: string;
    type: string;
    completed: boolean;
    difficulty?: Difficulty;
    content?: string;
}

interface CurriculumModule {
    id: number;
    week: string;
    title: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
    progress: number;
    items: CurriculumItem[];
    isForcedUnlocked?: boolean; // New flag for forced unlock
}

interface PersonalPost {
    id: number;
    title: string;
    content: string;
    difficulty: Difficulty;
    tags: string[];
    createdAt: string;
    isDone: boolean;
}

// --- Initial Data ---
const INITIAL_CURRICULUM: CurriculumModule[] = [
    {
        id: 1,
        week: 'Week 1',
        title: '풀스택 개발 환경 세팅 & 온보딩',
        status: 'COMPLETED',
        progress: 100,
        items: [
            { id: 101, title: '개발 툴 설치 (VS Code, Node.js, Git)', type: 'SETUP', completed: true },
            { id: 102, title: 'Git & GitHub 협업 기초 (Commit, Push, PR)', type: 'VOD', completed: true },
            { id: 103, title: '1주차 과제: 자기소개 페이지 배포하기', type: 'TASK', completed: true },
        ]
    },
    {
        id: 2,
        week: 'Week 2',
        title: 'React.js 핵심 문법 정복',
        status: 'IN_PROGRESS',
        progress: 45,
        items: [
            { id: 201, title: 'JSX와 컴포넌트의 이해', type: 'Concept', completed: true },
            { id: 202, title: 'State와 Props 완벽 가이드', type: 'VOD', completed: false },
            { id: 203, title: 'Hooks 패턴 (useState, useEffect)', type: 'CODE', completed: false },
            { id: 204, title: '미니 프로젝트: 투두 리스트 만들기', type: 'TASK', completed: false },
        ]
    },
    {
        id: 3,
        week: 'Week 3',
        title: 'Next.js 14 App Router 심화',
        status: 'LOCKED',
        progress: 0,
        items: [
            { id: 301, title: 'Server Component vs Client Component', type: 'Concept', completed: false },
            { id: 302, title: 'Routing & Layout 시스템', type: 'CODE', completed: false },
        ]
    }
];

export default function CurriculumSection({ tasks, onAddTask }: { tasks: any[], onAddTask?: (c: string, t: string, p: string) => void }) {
    const [activeTab, setActiveTab] = useState<Tab>('CURRICULUM');

    // State for Data
    const [regularList, setRegularList] = useState<CurriculumModule[]>(INITIAL_CURRICULUM);
    const [personalList, setPersonalList] = useState<PersonalPost[]>([]);

    // UI State
    const [openModules, setOpenModules] = useState<number[]>([2]);
    const [isCreatingRegular, setIsCreatingRegular] = useState(false);
    const [isCreatingPersonal, setIsCreatingPersonal] = useState(false);

    // Form State (Regular Item)
    const [addingItemToModule, setAddingItemToModule] = useState<number | null>(null);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemContent, setNewItemContent] = useState('');
    const [newItemDifficulty, setNewItemDifficulty] = useState<Difficulty>('NORMAL');

    // Form State (Regular)
    const [newRegularTitle, setNewRegularTitle] = useState('');
    const [newRegularWeek, setNewRegularWeek] = useState('');

    // Form State (Personal)
    const [newPersonalTitle, setNewPersonalTitle] = useState('');
    const [newPersonalContent, setNewPersonalContent] = useState('');
    const [newPersonalCategoryInput, setNewPersonalCategoryInput] = useState(''); // Input buffer
    const [newPersonalTags, setNewPersonalTags] = useState<string[]>([]); // Actual tags list
    const [newPersonalDifficulty, setNewPersonalDifficulty] = useState<Difficulty>('NORMAL');

    // UI State for Modal
    const [selectedPost, setSelectedPost] = useState<PersonalPost | null>(null);
    const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);

    useEffect(() => {
        // Hydrate personal list from props if needed later, for now we mock/local
        // Just for demo, let's load some initial if empty
        if (personalList.length === 0 && tasks && tasks.length > 0) {
            // Map existing simple tasks to Post format for MVP visualization
            const mapped = tasks.map((t: any) => ({
                id: t.id,
                title: t.content,
                content: '개인 학습 목표입니다.',
                difficulty: (t.priority === 'HIGH' ? 'HARD' : t.priority === 'LOW' ? 'EASY' : 'NORMAL') as Difficulty,
                tags: ['Personal'],
                createdAt: new Date(t.createdAt || Date.now()).toLocaleDateString(),
                isDone: t.isDone
            }));
            // Deduplicate based on ID to avoid react key warnings if effect runs twice
            const uniqueMapped = mapped.filter((m: any, index: number, self: any[]) =>
                index === self.findIndex((t: any) => t.id === m.id)
            );
            setPersonalList(uniqueMapped);
        }
    }, [tasks]);

    // --- Helpers ---
    const toggleModule = (id: number) => {
        setOpenModules(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return '#10b981'; // Green
            case 'IN_PROGRESS': return '#fbbf24'; // Amber
            case 'LOCKED': return '#52525b'; // Gray
            default: return '#71717a';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'VOD': return <FiPlayCircle />;
            case 'CODE': return <FiCode />;
            case 'TASK': return <FiCheckCircle />;
            case 'SETUP': return <FiFileText />;
            default: return <FiCircle />;
        }
    };

    // --- Actions ---
    const handleForceUnlock = (e: React.MouseEvent, moduleId: number) => {
        e.stopPropagation();
        if (!confirm("이 챕터를 강제로 해금하시겠습니까?\n강제 해금 시 획득 경험치가 감소합니다.")) return;

        setRegularList(prev => prev.map(mod => {
            if (mod.id === moduleId) {
                return { ...mod, status: 'IN_PROGRESS', isForcedUnlocked: true };
            }
            return mod;
        }));
        // Auto open
        if (!openModules.includes(moduleId)) {
            toggleModule(moduleId);
        }
    };

    const handleCreateRegular = () => {
        if (!newRegularTitle.trim() || !newRegularWeek.trim()) return;
        const newModule: CurriculumModule = {
            id: Date.now(),
            week: newRegularWeek,
            title: newRegularTitle,
            status: 'IN_PROGRESS',
            progress: 0,
            items: []
        };
        setRegularList([...regularList, newModule]);
        setNewRegularTitle('');
        setNewRegularWeek('');
        setIsCreatingRegular(false);
    };

    const handleAddItem = (moduleId: number) => {
        if (!newItemTitle.trim()) return;

        setRegularList(prev => prev.map(mod => {
            if (mod.id === moduleId) {
                return {
                    ...mod,
                    items: [...mod.items, {
                        id: Date.now(),
                        title: newItemTitle,
                        content: newItemContent,
                        type: 'TASK',
                        difficulty: newItemDifficulty,
                        completed: false
                    }]
                };
            }
            return mod;
        }));

        setNewItemTitle('');
        setNewItemContent('');
        setAddingItemToModule(null);
        setNewItemDifficulty('NORMAL');
    };

    const toggleItemCompletion = (moduleId: number, itemId: number) => {
        setRegularList(prev => prev.map(mod => {
            if (mod.id === moduleId) {
                const updatedItems = mod.items.map(item =>
                    item.id === itemId ? { ...item, completed: !item.completed } : item
                );
                // Auto-update module progress/status could go here
                const completedCount = updatedItems.filter(i => i.completed).length;
                const newProgress = updatedItems.length > 0 ? Math.round((completedCount / updatedItems.length) * 100) : 0;
                // Keep status as IN_PROGRESS or COMPLETED. If it was LOCKED (forced open), keep IN_PROGRESS unless 100%
                let newStatus = mod.status;
                if (newProgress === 100) newStatus = 'COMPLETED';
                else if (mod.status === 'COMPLETED' && newProgress < 100) newStatus = 'IN_PROGRESS';
                else if (mod.status === 'LOCKED') newStatus = 'IN_PROGRESS'; // Should not happen via toggle but safe check

                return { ...mod, items: updatedItems, progress: newProgress, status: newStatus };
            }
            return mod;
        }));
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (newPersonalCategoryInput.trim()) {
                if (!newPersonalTags.includes(newPersonalCategoryInput.trim())) {
                    setNewPersonalTags([...newPersonalTags, newPersonalCategoryInput.trim()]);
                }
                setNewPersonalCategoryInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setNewPersonalTags(newPersonalTags.filter(tag => tag !== tagToRemove));
    };

    const handleCreatePersonal = () => {
        if (!newPersonalTitle.trim()) return;

        // Optimistic UI update
        const newPost: PersonalPost = {
            id: Date.now(),
            title: newPersonalTitle,
            content: newPersonalContent,
            difficulty: newPersonalDifficulty,
            tags: newPersonalTags.length > 0 ? newPersonalTags : ['General'],
            createdAt: new Date().toLocaleDateString(),
            isDone: false
        };

        setPersonalList([newPost, ...personalList]);

        // Call Parent for basic sync if needed (MVP simplified)
        if (onAddTask) {
            onAddTask(newPersonalTitle, 'PERSONAL', newPersonalDifficulty === 'HARD' ? 'HIGH' : newPersonalDifficulty === 'EASY' ? 'LOW' : 'MEDIUM');
        }

        setNewPersonalTitle('');
        setNewPersonalContent('');
        setNewPersonalCategoryInput('');
        setNewPersonalTags([]);
        setNewPersonalDifficulty('NORMAL');
        setIsCreatingPersonal(false);
    };

    const getDifficultyColor = (diff: Difficulty) => {
        switch (diff) {
            case 'EASY': return '#34d399';
            case 'NORMAL': return '#60a5fa';
            case 'HARD': return '#f87171';
            default: return '#9ca3af';
        }
    };

    return (
        <section className={styles.section} style={{ padding: '0 4px', minHeight: '600px' }}>
            {/* Top Tabs */}
            {/* Top Tabs (Premium Motion Design) */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '2rem', borderBottom: '1px solid #27272a', position: 'relative' }}>
                {[
                    { id: 'CURRICULUM', label: '정규 커리큘럼', icon: <FiBook size={18} /> },
                    { id: 'PERSONAL', label: '개인 포럼 (Personal)', icon: <FiUser size={18} /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        style={{
                            position: 'relative',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 4px',
                            marginBottom: '-1px', // Pull down to overlap border
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: '0.95rem', fontWeight: activeTab === tab.id ? 700 : 500,
                            color: activeTab === tab.id ? '#e4e4e7' : '#71717a',
                            transition: 'color 0.2s ease',
                            outline: 'none'
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', color: activeTab === tab.id ? '#fbbf24' : 'currentColor', transition: 'color 0.2s' }}>
                            {tab.icon}
                        </span>
                        <span>{tab.label}</span>

                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabUnderline"
                                style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    height: '2px', backgroundColor: '#fbbf24',
                                    borderRadius: '2px 2px 0 0'
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* --- REGULAR TAB --- */}
            {activeTab === 'CURRICULUM' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>

                    {/* Module List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {regularList.map((module, idx) => {
                            const isOpen = openModules.includes(module.id);
                            const isLocked = module.status === 'LOCKED';
                            const isCompleted = module.status === 'COMPLETED';

                            return (
                                <div key={module.id} style={{
                                    border: isCompleted ? '1px solid #059669' : '1px solid #27272a',
                                    borderRadius: '12px',
                                    backgroundColor: isCompleted ? '#064e3b20' : '#18181b',
                                    opacity: isLocked ? 0.7 : 1, // Reduced opacity for locked but visible
                                    overflow: 'hidden',
                                    transition: 'all 0.2s'
                                }}>
                                    {/* Module Header */}
                                    <div
                                        onClick={() => toggleModule(module.id)} // Always toggleable now
                                        style={{
                                            padding: '1.2rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            backgroundColor: isOpen ? '#202022' : 'transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '8px',
                                                backgroundColor: isCompleted ? '#059669' : isLocked ? '#27272a' : '#27272a',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isCompleted ? '#fff' : getStatusColor(module.status),
                                                fontWeight: 'bold',
                                                border: isLocked ? '1px solid #3f3f46' : 'none',
                                                boxShadow: isCompleted ? '0 0 10px #05966950' : 'none'
                                            }}>
                                                {isCompleted ? <FiCheckCircle size={20} /> : isLocked ? <FiLock size={18} /> : (idx + 1)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: getStatusColor(module.status), fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {module.week} • {module.status.replace('_', ' ')}
                                                    {module.isForcedUnlocked && <span style={{ fontSize: '0.7rem', color: '#ef4444', border: '1px solid #ef4444', padding: '0 4px', borderRadius: '4px' }}>PENALTY ACTIVE</span>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <h3 style={{ fontSize: '1rem', color: isCompleted ? '#d1fae5' : isLocked ? '#a1a1aa' : '#e4e4e7', margin: 0, textDecoration: isCompleted ? 'line-through' : 'none' }}>
                                                        {module.title}
                                                    </h3>
                                                    {isCompleted && <span style={{ fontSize: '0.7rem', backgroundColor: '#059669', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>DONE</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {isLocked && (
                                                <button
                                                    onClick={(e) => handleForceUnlock(e, module.id)}
                                                    style={{
                                                        padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px',
                                                        border: '1px solid #52525b', background: 'transparent', color: '#a1a1aa', cursor: 'pointer'
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24' }}
                                                    onMouseOut={e => { e.currentTarget.style.borderColor = '#52525b'; e.currentTarget.style.color = '#a1a1aa' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FiUnlock size={12} /> 강제 해금
                                                    </div>
                                                </button>
                                            )}
                                            {isOpen ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{ borderTop: '1px solid #27272a', backgroundColor: '#0f0f10' }}
                                            >
                                                <div style={{ padding: '1rem', filter: isLocked ? 'grayscale(1) opacity(0.5)' : 'none', pointerEvents: isLocked ? 'none' : 'auto' }}>
                                                    {/* Locked Warning */}
                                                    {isLocked && (
                                                        <div style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #3f3f46', borderRadius: '6px', color: '#a1a1aa', fontSize: '0.8rem', textAlign: 'center', background: '#18181b' }}>
                                                            🔒 잠겨있는 챕터입니다. 상단의 '강제 해금' 버튼을 눌러 시작할 수 있습니다. (패널티 적용)
                                                        </div>
                                                    )}

                                                    {module.items.length === 0 && (
                                                        <div style={{ color: '#52525b', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                                                            아직 등록된 학습 컨텐츠가 없습니다.
                                                        </div>
                                                    )}
                                                    {module.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => setSelectedItem(item)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center',
                                                                padding: '0.8rem', borderRadius: '8px',
                                                                marginBottom: '0.5rem',
                                                                backgroundColor: item.completed ? '#18181b' : '#27272a',
                                                                opacity: item.completed ? 0.7 : 1,
                                                                cursor: 'pointer',
                                                                border: item.completed ? '1px solid #059669' : '1px solid transparent'
                                                            }}
                                                        >
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); toggleItemCompletion(module.id, item.id); }}
                                                                style={{ marginRight: '12px', color: item.completed ? '#10b981' : '#fbbf24', cursor: 'pointer', padding: '4px' }}
                                                            >
                                                                {item.completed ? <FiCheckCircle size={18} /> : getTypeIcon(item.type)}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ color: '#e4e4e7', fontSize: '0.9rem', textDecoration: item.completed ? 'line-through' : 'none' }}>
                                                                    {item.title}
                                                                </div>
                                                                <div style={{ color: '#71717a', fontSize: '0.75rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    {item.difficulty ? (
                                                                        <span style={{ color: getDifficultyColor(item.difficulty), fontWeight: 600 }}>{item.difficulty}</span>
                                                                    ) : (
                                                                        item.type
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Add Item Trigger/Form - Only if unlocked */}
                                                    {!isLocked && (
                                                        addingItemToModule === module.id ? (
                                                            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#18181b', borderRadius: '8px', border: '1px dashed #3f3f46' }}>
                                                                <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '8px' }}>새 컨텐츠 추가</div>
                                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexDirection: 'column' }}>
                                                                    <input
                                                                        placeholder="제목 (예: React Hooks)"
                                                                        value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)}
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}
                                                                    />
                                                                    <textarea
                                                                        placeholder="상세 내용을 입력하세요 (선택 사항)"
                                                                        value={newItemContent} onChange={e => setNewItemContent(e.target.value)}
                                                                        rows={3}
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff', resize: 'vertical' }}
                                                                    />
                                                                </div>
                                                                {/* Difficulty Buttons */}
                                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                                    {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map(diff => (
                                                                        <button
                                                                            key={diff}
                                                                            onClick={() => setNewItemDifficulty(diff)}
                                                                            style={{
                                                                                padding: '6px 10px', borderRadius: '4px',
                                                                                border: newItemDifficulty === diff ? `1px solid ${getDifficultyColor(diff)}` : '1px solid #3f3f46',
                                                                                background: newItemDifficulty === diff ? `${getDifficultyColor(diff)}20` : 'transparent',
                                                                                color: newItemDifficulty === diff ? getDifficultyColor(diff) : '#71717a',
                                                                                fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                                                                            }}
                                                                        >
                                                                            {diff}
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                    <button onClick={() => setAddingItemToModule(null)} style={{ padding: '6px 12px', background: 'transparent', color: '#71717a', border: 'none', cursor: 'pointer' }}>취소</button>
                                                                    <button onClick={() => handleAddItem(module.id)} style={{ padding: '6px 12px', background: '#fbbf24', color: '#000', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>추가</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setAddingItemToModule(module.id); }}
                                                                style={{
                                                                    width: '100%', marginTop: '0.5rem', padding: '8px',
                                                                    background: 'transparent', border: '1px dashed #3f3f46', borderRadius: '6px',
                                                                    color: '#71717a', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                                                }}
                                                                onMouseOver={e => e.currentTarget.style.color = '#e4e4e7'}
                                                                onMouseOut={e => e.currentTarget.style.color = '#71717a'}
                                                            >
                                                                <FiPlus /> 컨텐츠 추가하기
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* Creation Button (Regular) */}
                    {!isCreatingRegular ? (
                        <button
                            onClick={() => setIsCreatingRegular(true)}
                            style={{
                                width: '100%', padding: '16px', marginTop: '1rem',
                                backgroundColor: '#18181b', border: '1px dashed #3f3f46', borderRadius: '12px',
                                color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.color = '#fbbf24'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#a1a1aa'; }}
                        >
                            <FiPlus size={18} /> 새 커리큘럼 챕터 추가하기
                        </button>
                    ) : (
                        <div style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1rem' }}>새 챕터 생성</h3>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                                <input
                                    type="text" placeholder="예: Week 5"
                                    value={newRegularWeek} onChange={e => setNewRegularWeek(e.target.value)}
                                    style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff' }}
                                />
                                <input
                                    type="text" placeholder="챕터 제목을 입력하세요 (예: 백엔드 기초)"
                                    value={newRegularTitle} onChange={e => setNewRegularTitle(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button onClick={() => setIsCreatingRegular(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: '#a1a1aa', border: 'none', cursor: 'pointer' }}>취소</button>
                                <button onClick={handleCreateRegular} style={{ padding: '8px 16px', borderRadius: '8px', background: '#fbbf24', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>챕터 생성</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- PERSONAL TAB (DISCORD FORUM STYLE) --- */}
            {activeTab === 'PERSONAL' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>

                    {!isCreatingPersonal ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: '#e4e4e7' }}>개인 목표 리스트</h3>
                                    <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>자신만의 학습 마일스톤을 포럼 형식으로 관리하세요.</p>
                                </div>
                                <button
                                    onClick={() => setIsCreatingPersonal(true)}
                                    style={{
                                        padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff',
                                        border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <FiPlus /> 목표 생성
                                </button>
                            </div>

                            {/* Forum Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {personalList.map((post) => (
                                    <div
                                        key={post.id}
                                        onClick={() => setSelectedPost(post)}
                                        style={{
                                            borderRadius: '12px', padding: '1.5rem',
                                            backgroundColor: '#18181b', border: '1px solid #27272a',
                                            display: 'flex', flexDirection: 'column', gap: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, border-color 0.2s'
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px',
                                                    backgroundColor: `${getDifficultyColor(post.difficulty)}20`,
                                                    color: getDifficultyColor(post.difficulty),
                                                    fontSize: '0.7rem', fontWeight: 700
                                                }}>
                                                    {post.difficulty}
                                                </span>
                                                {post.tags?.map((tag, i) => (
                                                    <span key={i} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '0.7rem' }}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <FiMoreHorizontal color="#71717a" />
                                        </div>

                                        <h3 style={{ margin: 0, color: '#e4e4e7', fontSize: '1.1rem', lineHeight: 1.4 }}>{post.title}</h3>

                                        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '0.8rem' }}>
                                                <FiClock size={14} /> {post.createdAt}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: post.isDone ? '#10b981' : '#fbbf24' }}>
                                                {post.isDone ? <><FiCheckCircle /> 완료됨</> : <><FiPlayCircle /> 진행중</>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '1.5rem', backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46', marginBottom: '2rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#e4e4e7', fontSize: '1.1rem' }}>새로운 목표 생성</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Title */}
                                <div>
                                    <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '4px' }}>목표 제목</label>
                                    <input
                                        type="text" placeholder="무엇을 달성하고 싶으신가요?"
                                        value={newPersonalTitle} onChange={e => setNewPersonalTitle(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', outline: 'none' }}
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '4px' }}>상세 내용</label>
                                    <textarea
                                        placeholder="구체적인 실행 계획이나 메모를 적어주세요..."
                                        value={newPersonalContent} onChange={e => setNewPersonalContent(e.target.value)}
                                        rows={4}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '4px' }}>카테고리</label>
                                        <input
                                            type="text" placeholder="태그 입력 후 Enter (예: #React)"
                                            value={newPersonalCategoryInput}
                                            onChange={e => setNewPersonalCategoryInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', outline: 'none' }}
                                        />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', minHeight: '24px' }}>
                                            {newPersonalTags.map(tag => (
                                                <span key={tag} style={{
                                                    padding: '4px 8px', borderRadius: '4px', backgroundColor: '#3f3f46', color: '#fff', fontSize: '0.8rem',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    #{tag}
                                                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '12px', padding: 0 }}>×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '4px' }}>난이도 설정</label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map(diff => (
                                                <button
                                                    key={diff}
                                                    onClick={() => setNewPersonalDifficulty(diff)}
                                                    style={{
                                                        padding: '10px 12px', borderRadius: '6px',
                                                        border: newPersonalDifficulty === diff ? `1px solid ${getDifficultyColor(diff)}` : '1px solid #3f3f46',
                                                        backgroundColor: newPersonalDifficulty === diff ? `${getDifficultyColor(diff)}20` : 'transparent',
                                                        color: newPersonalDifficulty === diff ? getDifficultyColor(diff) : '#71717a',
                                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {diff}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #27272a' }}>
                                <button onClick={() => setIsCreatingPersonal(false)} style={{ padding: '10px 18px', borderRadius: '8px', background: 'transparent', color: '#a1a1aa', border: 'none', cursor: 'pointer' }}>취소</button>
                                <button onClick={handleCreatePersonal} style={{ padding: '10px 18px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>게시하기</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- DETAIL MODAL -- */}
            {selectedPost && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedPost(null)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto',
                            backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #3f3f46',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px',
                                        backgroundColor: `${getDifficultyColor(selectedPost.difficulty)}20`,
                                        color: getDifficultyColor(selectedPost.difficulty),
                                        fontSize: '0.75rem', fontWeight: 700
                                    }}>
                                        {selectedPost.difficulty}
                                    </span>
                                    {selectedPost.tags?.map((tag, i) => (
                                        <span key={i} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '0.75rem' }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{selectedPost.title}</h2>
                                <div style={{ color: '#71717a', fontSize: '0.9rem', marginTop: '6px' }}>
                                    Created on {selectedPost.createdAt}
                                </div>
                            </div>
                            <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '1.5rem', cursor: 'pointer' }}>
                                &times;
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.5rem', flex: 1 }}>
                            <div style={{
                                minHeight: '100px', color: '#d1d5db', lineHeight: 1.6, fontSize: '1rem',
                                whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginBottom: '2rem'
                            }}>
                                {selectedPost.content || "상세 내용이 없습니다."}
                            </div>

                            {/* Status and Action */}
                            <div style={{ padding: '1rem', backgroundColor: '#27272a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>현재 상태:</span>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold',
                                        color: selectedPost.isDone ? '#10b981' : '#fbbf24'
                                    }}>
                                        {selectedPost.isDone ? <FiCheckCircle size={18} /> : <FiClock size={18} />}
                                        {selectedPost.isDone ? '완료됨 (Done)' : '진행중 (In Progress)'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        // Toggle status logic
                                        const newUserList = personalList.map(p => p.id === selectedPost.id ? { ...p, isDone: !p.isDone } : p);
                                        setPersonalList(newUserList);
                                        setSelectedPost({ ...selectedPost, isDone: !selectedPost.isDone });
                                    }}
                                    style={{
                                        padding: '8px 16px', borderRadius: '6px', border: 'none',
                                        backgroundColor: selectedPost.isDone ? '#3f3f46' : '#10b981',
                                        color: '#fff', cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    {selectedPost.isDone ? '다시 진행하기' : '완료 처리하기'}
                                </button>
                            </div>
                        </div>

                        {/* Comment Shell Removed as per request */}
                    </div>
                </div>
            )}

            {/* --- REGULAR ITEM DETAIL MODAL --- */}
            {selectedItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedItem(null)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto',
                            backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #3f3f46',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px',
                                        backgroundColor: '#27272a', color: '#a1a1aa',
                                        fontSize: '0.75rem', fontWeight: 700
                                    }}>
                                        {selectedItem.type}
                                    </span>
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{selectedItem.title}</h2>
                            </div>
                            <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '1.5rem', cursor: 'pointer' }}>
                                &times;
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', flex: 1 }}>
                            <div style={{
                                minHeight: '100px', color: '#d1d5db', lineHeight: 1.6, fontSize: '1rem',
                                whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginBottom: '2rem'
                            }}>
                                {selectedItem.content || "상세 내용이 없습니다."}
                            </div>

                            <div style={{ padding: '1rem', backgroundColor: '#27272a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>학습 상태:</span>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold',
                                        color: selectedItem.completed ? '#10b981' : '#fbbf24'
                                    }}>
                                        {selectedItem.completed ? <FiCheckCircle size={18} /> : <FiClock size={18} />}
                                        {selectedItem.completed ? '학습 완료 (Done)' : '학습 중 (In Progress)'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        // Need to find which module this item belongs to.
                                        // Since we don't have parent module ID easily here without props or searching,
                                        // We'll search for it.
                                        let foundModuleId = -1;
                                        regularList.forEach(m => {
                                            if (m.items.find(i => i.id === selectedItem.id)) foundModuleId = m.id;
                                        });

                                        if (foundModuleId !== -1) {
                                            toggleItemCompletion(foundModuleId, selectedItem.id);
                                            setSelectedItem({ ...selectedItem, completed: !selectedItem.completed });
                                        }
                                    }}
                                    style={{
                                        padding: '8px 16px', borderRadius: '6px', border: 'none',
                                        backgroundColor: selectedItem.completed ? '#3f3f46' : '#10b981',
                                        color: '#fff', cursor: 'pointer', fontWeight: 600
                                    }}
                                >
                                    {selectedItem.completed ? '미완료 상태로 변경' : '학습 완료 체크'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
