"use client";

import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import {
    FiCheckCircle, FiCircle, FiPlayCircle, FiCode, FiFileText,
    FiChevronDown, FiChevronRight, FiClock, FiPlus, FiMoreHorizontal, FiMessageSquare, FiHash,
    FiLock, FiUnlock, FiBook, FiUser, FiX, FiRotateCcw, FiEdit2, FiTrash2
} from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceRewardModal from '@/components/AttendanceRewardModal';

// --- Types ---
type Tab = 'CURRICULUM' | 'PERSONAL';
type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
type ContentType = 'VOD' | 'CODE' | 'TASK' | 'CONCEPT' | 'SETUP';

interface CurriculumContent {
    id: number;
    title: string;
    description?: string;
    type: string;
    difficulty: Difficulty;
    isDone: boolean;
}

interface Chapter {
    id: number;
    week: string;
    title: string;
    orderIndex: number;
    isLocked: boolean;
    isForcedUnlocked: boolean;
    contents: CurriculumContent[];
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

export default function CurriculumSection({ workspaceId, tasks, onAddTask, onXPChange }: {
    workspaceId: string,
    tasks: any[],
    onAddTask?: (c: string, t: string, p: string) => void,
    onXPChange?: (newTotalXP: number) => void
}) {
    const [activeTab, setActiveTab] = useState<Tab>('CURRICULUM');

    // State for Data
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [personalList, setPersonalList] = useState<PersonalPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [openModules, setOpenModules] = useState<number[]>([]);
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);
    const [isCreatingPersonal, setIsCreatingPersonal] = useState(false);

    // Reward Modal State
    const [rewardData, setRewardData] = useState<{ streak: number, addedXP: number, levelUp?: { prevLevel: number, newLevel: number } } | null>(null);
    const [isRewardOpen, setIsRewardOpen] = useState(false);

    // Form State (Content)
    const [addingContentToChapter, setAddingContentToChapter] = useState<number | null>(null);
    const [newContentTitle, setNewContentTitle] = useState('');
    const [newContentDesc, setNewContentDesc] = useState('');
    // const [newContentType, setNewContentType] = useState<string>('VOD'); // Removed
    const [newContentDifficulty, setNewContentDifficulty] = useState<Difficulty>('NORMAL');

    // Form State (Chapter)
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [newChapterWeek, setNewChapterWeek] = useState('');

    // Form State (Personal)
    const [newPersonalTitle, setNewPersonalTitle] = useState('');
    const [newPersonalContent, setNewPersonalContent] = useState('');
    const [newPersonalCategoryInput, setNewPersonalCategoryInput] = useState('');
    const [newPersonalTags, setNewPersonalTags] = useState<string[]>([]);
    const [newPersonalDifficulty, setNewPersonalDifficulty] = useState<Difficulty>('NORMAL');

    // UI State for Modal
    const [selectedPost, setSelectedPost] = useState<PersonalPost | null>(null);
    const [selectedContent, setSelectedContent] = useState<CurriculumContent | null>(null);

    // Edit State
    const [editingChapter, setEditingChapter] = useState<{ id: number; title: string; week: string } | null>(null);
    const [editingContent, setEditingContent] = useState<{ id: number; title: string; desc: string; difficulty: Difficulty } | null>(null);
    const [openChapterMenu, setOpenChapterMenu] = useState<number | null>(null);
    const [openContentMenu, setOpenContentMenu] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/workspaces/${workspaceId}/chapters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setChapters(data);
                // Open first unlocked chapter or last active
                if (data.length > 0 && openModules.length === 0) {
                    const firstUnlocked = data.find((c: Chapter) => !c.isLocked);
                    if (firstUnlocked) setOpenModules([firstUnlocked.id]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workspaceId]);

    // Hydrate personal list from props (MVP legacy support + new if API)
    useEffect(() => {
        if (personalList.length === 0 && tasks && tasks.length > 0) {
            const mapped = tasks.map((t: any) => ({
                id: t.id,
                title: t.content,
                content: '개인 학습 목표입니다.',
                difficulty: (t.priority === 'HIGH' ? 'HARD' : t.priority === 'LOW' ? 'EASY' : 'NORMAL') as Difficulty,
                tags: ['Personal'],
                createdAt: new Date(t.createdAt || Date.now()).toLocaleDateString(),
                isDone: t.isDone
            }));
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

    // Calculate status/progress client-side based on contents
    const getChapterStatus = (chapter: Chapter) => {
        if (chapter.isLocked && !chapter.isForcedUnlocked) return 'LOCKED';
        if (chapter.contents.length === 0) return 'IN_PROGRESS';
        const completed = chapter.contents.filter(c => c.isDone).length;
        return completed === chapter.contents.length ? 'COMPLETED' : 'IN_PROGRESS';
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
        return <FiFileText />;
    };

    const getDifficultyColor = (diff: Difficulty) => {
        switch (diff) {
            case 'EASY': return '#34d399';
            case 'NORMAL': return '#60a5fa';
            case 'HARD': return '#f87171';
            default: return '#9ca3af';
        }
    };

    // --- Actions ---
    const handleDeleteChapter = async (chapterId: number) => {
        if (!confirm("정말 이 챕터를 삭제하시겠습니까?\n하위 컨텐츠도 모두 삭제됩니다.")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/workspaces/${workspaceId}/chapters/${chapterId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setChapters(prev => prev.filter(c => c.id !== chapterId));
            }
        } catch (e) { console.error(e); alert("삭제 실패"); }
    };

    const handleUpdateChapter = async () => {
        if (!editingChapter) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/workspaces/${workspaceId}/chapters/${editingChapter.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: editingChapter.title, week: editingChapter.week })
            });

            if (res.ok) {
                setChapters(prev => prev.map(c => c.id === editingChapter.id ? { ...c, title: editingChapter.title, week: editingChapter.week } : c));
                setEditingChapter(null);
            }
        } catch (e) {
            console.error(e);
            alert("수정 실패");
        }
    };

    const handleDeleteContent = async (chapterId: number, contentId: number) => {
        if (!confirm("이 컨텐츠를 삭제하시겠습니까?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/curriculum/contents/${contentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setChapters(prev => prev.map(c => {
                    if (c.id === chapterId) {
                        return { ...c, contents: c.contents.filter(cnt => cnt.id !== contentId) };
                    }
                    return c;
                }));
            }
        } catch (e) { console.error(e); alert("삭제 실패"); }
    };

    const handleUpdateContent = async () => {
        if (!editingContent) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/curriculum/contents/${editingContent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: editingContent.title,
                    description: editingContent.desc,
                    difficulty: editingContent.difficulty
                })
            });

            if (res.ok) {
                setChapters(prev => prev.map(c => {
                    const idx = c.contents.findIndex(cnt => cnt.id === editingContent.id);
                    if (idx !== -1) {
                        const newContents = [...c.contents];
                        newContents[idx] = {
                            ...newContents[idx],
                            title: editingContent.title,
                            description: editingContent.desc,
                            difficulty: editingContent.difficulty
                        };
                        return { ...c, contents: newContents };
                    }
                    return c;
                }));
                setEditingContent(null);
                if (selectedContent && selectedContent.id === editingContent.id) {
                    setSelectedContent(prev => prev ? { ...prev, title: editingContent.title, description: editingContent.desc, difficulty: editingContent.difficulty } : null);
                }
            }
        } catch (e) { console.error(e); alert("수정 실패"); }
    };
    const handleForceUnlock = async (e: React.MouseEvent, chapterId: number) => {
        e.stopPropagation();
        if (!confirm("이 챕터를 강제로 해금하시겠습니까?\n강제 해금 시 획득 경험치가 30% 감소합니다.")) return;

        setChapters(prev => prev.map(c =>
            c.id === chapterId ? { ...c, isForcedUnlocked: true } : c
        ));
        if (!openModules.includes(chapterId)) toggleModule(chapterId);
    };

    const handleCreateChapter = async () => {
        if (!newChapterTitle.trim() || !newChapterWeek.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/workspaces/${workspaceId}/chapters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: newChapterTitle, week: newChapterWeek })
            });
            if (res.ok) {
                const newChapter = await res.json();
                setChapters(prev => [...prev, { ...newChapter, contents: [] }]); // Ensure contents array exists
                setNewChapterTitle('');
                setNewChapterWeek('');
                setIsCreatingChapter(false);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to create chapter");
        }
    };

    const handleAddContent = async (chapterId: number) => {
        if (!newContentTitle.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/workspaces/${workspaceId}/chapters/${chapterId}/contents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title: newContentTitle,
                    description: newContentDesc,
                    type: 'LESSON', // Hardcoded generic type
                    difficulty: newContentDifficulty
                })
            });

            if (res.ok) {
                const newContent = await res.json();
                setChapters(prev => prev.map(c => {
                    if (c.id === chapterId) {
                        return { ...c, contents: [...c.contents, newContent] };
                    }
                    return c;
                }));
                setNewContentTitle('');
                setNewContentDesc('');
                setAddingContentToChapter(null);
                setNewContentDifficulty('NORMAL');
            }
        } catch (e) {
            console.error(e);
            alert("Failed to add content");
        }
    };

    const handleToggleComplete = async (chapterId: number, contentId: number) => {
        // Optimistic UI
        const chapterIndex = chapters.findIndex(c => c.id === chapterId);
        if (chapterIndex === -1) return;

        const contentIndex = chapters[chapterIndex].contents.findIndex(c => c.id === contentId);
        if (contentIndex === -1) return;

        const content = chapters[chapterIndex].contents[contentIndex];
        const newStatus = !content.isDone;

        // Apply optimistic update
        const newChapters = [...chapters];
        newChapters[chapterIndex].contents[contentIndex].isDone = newStatus;
        setChapters(newChapters);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/curriculum/contents/${contentId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const result = await res.json();
                // Result has { gainedXP, removedXP, isPenalty, ... }
                if (result.gainedXP > 0) {
                    setRewardData({
                        streak: 1, // Mock streak for now or fetch from result if we updated API to return it
                        addedXP: result.gainedXP
                    });
                    setIsRewardOpen(true);
                }

                // Update User XP in parent
                if (onXPChange && result.newTotalXP !== undefined) {
                    onXPChange(result.newTotalXP);
                }
            } else {
                // Revert on failure
                const revertChapters = [...chapters];
                revertChapters[chapterIndex].contents[contentIndex].isDone = !newStatus;
                setChapters(revertChapters);
                alert("Failed to update status");
            }
        } catch (e) {
            console.error(e);
            // Revert
            setChapters(prev => prev.map(c => {
                if (c.id === chapterId) {
                    return {
                        ...c,
                        contents: c.contents.map(cnt => cnt.id === contentId ? { ...cnt, isDone: !newStatus } : cnt)
                    };
                }
                return c;
            }));
        }
    };

    // Personal Forum Logic (Client-side mostly for now per requirement scope, can perform API if needed later)
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

    // Loading State
    if (isLoading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#71717a' }}>커리큘럼 로딩중...</div>;
    }

    return (
        <section className={styles.section} style={{ padding: '0 4px', minHeight: '600px' }}>
            <AttendanceRewardModal
                isOpen={isRewardOpen}
                onClose={() => setIsRewardOpen(false)}
                data={rewardData}
            />

            {/* Top Tabs */}
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
                            marginBottom: '-1px',
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chapters.map((module, idx) => {
                            const isOpen = openModules.includes(module.id);
                            // Logic: locked if isLocked is true AND not forced unlocked. 
                            // If forced unlocked, it looks unlocked but has penalty.
                            // If locked, it looks locked.
                            const status = getChapterStatus(module);
                            const isLocked = module.isLocked && !module.isForcedUnlocked;
                            const isCompleted = status === 'COMPLETED';

                            return (
                                <div key={module.id} style={{
                                    border: isCompleted ? '1px solid #059669' : '1px solid #27272a',
                                    borderRadius: '12px',
                                    backgroundColor: isCompleted ? '#064e3b20' : '#18181b',
                                    opacity: isLocked ? 0.7 : 1,
                                    overflow: 'hidden',
                                    transition: 'all 0.2s'
                                }}>
                                    {/* Module Header */}
                                    <div
                                        onClick={() => toggleModule(module.id)}
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
                                                color: isCompleted ? '#fff' : getStatusColor(status),
                                                fontWeight: 'bold',
                                                border: isLocked ? '1px solid #3f3f46' : 'none',
                                                boxShadow: isCompleted ? '0 0 10px #05966950' : 'none'
                                            }}>
                                                {isCompleted ? <FiCheckCircle size={20} /> : isLocked ? <FiLock size={18} /> : (idx + 1)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: getStatusColor(status), fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {module.week} • {status.replace('_', ' ')}
                                                    {module.isForcedUnlocked && <span style={{ fontSize: '0.7rem', color: '#ef4444', border: '1px solid #ef4444', padding: '0 4px', borderRadius: '4px' }}>PENALTY ACTIVE (-30%)</span>}
                                                    {/* Chapter Menu */}
                                                    <div style={{ position: 'relative', marginLeft: '8px' }} onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenChapterMenu(openChapterMenu === module.id ? null : module.id);
                                                            }}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: openChapterMenu === module.id ? '#e4e4e7' : '#52525b',
                                                                cursor: 'pointer',
                                                                padding: '4px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                borderRadius: '4px',
                                                                transition: 'color 0.2s'
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.color = '#e4e4e7'}
                                                            onMouseOut={e => e.currentTarget.style.color = openChapterMenu === module.id ? '#e4e4e7' : '#52525b'}
                                                        >
                                                            <FiMoreHorizontal size={16} />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {openChapterMenu === module.id && (
                                                            <div style={{
                                                                position: 'absolute', top: '100%', left: '0',
                                                                marginTop: '4px',
                                                                backgroundColor: '#18181b',
                                                                border: '1px solid #3f3f46',
                                                                borderRadius: '8px',
                                                                padding: '4px',
                                                                zIndex: 10,
                                                                minWidth: '120px',
                                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                                            }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingChapter({ id: module.id, title: module.title, week: module.week });
                                                                        setOpenChapterMenu(null);
                                                                    }}
                                                                    style={{
                                                                        width: '100%', padding: '8px 12px',
                                                                        background: 'transparent', border: 'none',
                                                                        color: '#fbbf24', fontSize: '0.85rem',
                                                                        textAlign: 'left', cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <FiEdit2 size={14} /> 수정하기
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteChapter(module.id);
                                                                        setOpenChapterMenu(null);
                                                                    }}
                                                                    style={{
                                                                        width: '100%', padding: '8px 12px',
                                                                        background: 'transparent', border: 'none',
                                                                        color: '#ef4444', fontSize: '0.85rem',
                                                                        textAlign: 'left', cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <FiTrash2 size={14} /> 삭제하기
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
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

                                                    {isLocked && (
                                                        <div style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #3f3f46', borderRadius: '6px', color: '#a1a1aa', fontSize: '0.8rem', textAlign: 'center', background: '#18181b' }}>
                                                            🔒 잠겨있는 챕터입니다. 상단의 '강제 해금' 버튼을 눌러 시작할 수 있습니다. (XP 패널티 적용)
                                                        </div>
                                                    )}

                                                    {module.contents.length === 0 && (
                                                        <div style={{ color: '#52525b', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                                                            아직 등록된 학습 컨텐츠가 없습니다.
                                                        </div>
                                                    )}
                                                    {module.contents.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => setSelectedContent({ ...item, chapterId: module.id } as any)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center',
                                                                padding: '0.8rem', borderRadius: '8px',
                                                                marginBottom: '0.5rem',
                                                                backgroundColor: item.isDone ? '#18181b' : '#27272a',
                                                                opacity: item.isDone ? 0.7 : 1,
                                                                cursor: 'pointer',
                                                                border: item.isDone ? '1px solid #059669' : '1px solid transparent'
                                                            }}
                                                        >
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); handleToggleComplete(module.id, item.id); }}
                                                                style={{ marginRight: '12px', color: item.isDone ? '#10b981' : '#fbbf24', cursor: 'pointer', padding: '4px' }}
                                                            >
                                                                {item.isDone ? <FiCheckCircle size={18} /> : getTypeIcon(item.type)}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ color: '#e4e4e7', fontSize: '0.9rem', textDecoration: item.isDone ? 'line-through' : 'none' }}>
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

                                                    {/* Add Item Trigger/Form - Only if unlocked (or forced unlocked) */}
                                                    {!isLocked && (
                                                        addingContentToChapter === module.id ? (
                                                            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#18181b', borderRadius: '8px', border: '1px dashed #3f3f46' }}>
                                                                <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '8px' }}>새 컨텐츠 추가</div>
                                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexDirection: 'column' }}>
                                                                    <input
                                                                        placeholder="제목 (예: React Hooks)"
                                                                        value={newContentTitle} onChange={e => setNewContentTitle(e.target.value)}
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}
                                                                    />
                                                                    <textarea
                                                                        placeholder="상세 내용을 입력하세요 (선택 사항)"
                                                                        value={newContentDesc} onChange={e => setNewContentDesc(e.target.value)}
                                                                        rows={3}
                                                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff', resize: 'vertical' }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                                                    {(['EASY', 'NORMAL', 'HARD'] as Difficulty[]).map(diff => (
                                                                        <button
                                                                            key={diff}
                                                                            onClick={() => setNewContentDifficulty(diff)}
                                                                            style={{
                                                                                padding: '6px 10px', borderRadius: '4px',
                                                                                border: newContentDifficulty === diff ? `1px solid ${getDifficultyColor(diff)}` : '1px solid #3f3f46',
                                                                                background: newContentDifficulty === diff ? `${getDifficultyColor(diff)}20` : 'transparent',
                                                                                color: newContentDifficulty === diff ? getDifficultyColor(diff) : '#71717a',
                                                                                fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                                                                            }}
                                                                        >
                                                                            {diff}
                                                                        </button>
                                                                    ))}
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                    <button onClick={() => setAddingContentToChapter(null)} style={{ padding: '6px 12px', background: 'transparent', color: '#71717a', border: 'none', cursor: 'pointer' }}>취소</button>
                                                                    <button onClick={() => handleAddContent(module.id)} style={{ padding: '6px 12px', background: '#fbbf24', color: '#000', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>추가</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setAddingContentToChapter(module.id); }}
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

                    {!isCreatingChapter ? (
                        <button
                            onClick={() => setIsCreatingChapter(true)}
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
                                    value={newChapterWeek} onChange={e => setNewChapterWeek(e.target.value)}
                                    style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff' }}
                                />
                                <input
                                    type="text" placeholder="챕터 제목을 입력하세요 (예: 백엔드 기초)"
                                    value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button onClick={() => setIsCreatingChapter(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: '#a1a1aa', border: 'none', cursor: 'pointer' }}>취소</button>
                                <button onClick={handleCreateChapter} style={{ padding: '8px 16px', borderRadius: '8px', background: '#fbbf24', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>챕터 생성</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- PERSONAL TAB --- */}
            {activeTab === 'PERSONAL' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Reuse existing Personal Tab UI logic (omitted complex rework for brevity as focus was curriculum) */}
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
                                <div>
                                    <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '4px' }}>목표 제목</label>
                                    <input
                                        type="text" placeholder="무엇을 달성하고 싶으신가요?"
                                        value={newPersonalTitle} onChange={e => setNewPersonalTitle(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', outline: 'none' }}
                                    />
                                </div>
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

            {/* --- DETAIL MODAL (Curriculum Content) --- */}
            {selectedContent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedContent(null)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '90%', maxWidth: '600px', backgroundColor: '#18181b',
                            borderRadius: '16px', border: '1px solid #3f3f46',
                            padding: '24px', position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Content Menu */}
                            {(selectedContent as any).chapterId && (
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenContentMenu(!openContentMenu);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: openContentMenu ? '#e4e4e7' : '#71717a',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            padding: '4px', borderRadius: '4px', transition: 'color 0.2s',
                                        }}
                                        onMouseOver={e => e.currentTarget.style.color = '#e4e4e7'}
                                        onMouseOut={e => e.currentTarget.style.color = openContentMenu ? '#e4e4e7' : '#71717a'}
                                        title="설정"
                                    >
                                        <FiMoreHorizontal size={22} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openContentMenu && (
                                        <div style={{
                                            position: 'absolute', top: '100%', right: '0',
                                            marginTop: '8px',
                                            backgroundColor: '#18181b',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '8px',
                                            padding: '4px',
                                            zIndex: 10,
                                            minWidth: '120px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                        }}>
                                            <button
                                                onClick={() => {
                                                    setEditingContent({
                                                        id: selectedContent.id,
                                                        title: selectedContent.title,
                                                        desc: selectedContent.description || '',
                                                        difficulty: selectedContent.difficulty as Difficulty
                                                    });
                                                    setOpenContentMenu(false);
                                                }}
                                                style={{
                                                    width: '100%', padding: '8px 12px',
                                                    background: 'transparent', border: 'none',
                                                    color: '#fbbf24', fontSize: '0.85rem',
                                                    textAlign: 'left', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    borderRadius: '4px'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FiEdit2 size={14} /> 수정하기
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await handleDeleteContent((selectedContent as any).chapterId, selectedContent.id);
                                                    setSelectedContent(null);
                                                    setOpenContentMenu(false);
                                                }}
                                                style={{
                                                    width: '100%', padding: '8px 12px',
                                                    background: 'transparent', border: 'none',
                                                    color: '#ef4444', fontSize: '0.85rem',
                                                    textAlign: 'left', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    borderRadius: '4px'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <FiTrash2 size={14} /> 삭제하기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedContent(null)}
                                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <span style={{
                                padding: '4px 10px', borderRadius: '6px',
                                backgroundColor: `${getDifficultyColor(selectedContent.difficulty)}20`,
                                color: getDifficultyColor(selectedContent.difficulty),
                                fontSize: '0.8rem', fontWeight: 700
                            }}>
                                {selectedContent.difficulty}
                            </span>
                        </div>

                        <h2 style={{ fontSize: '1.5rem', color: '#f4f4f5', marginBottom: '16px', lineHeight: 1.3 }}>
                            {selectedContent.title}
                        </h2>

                        <div style={{
                            backgroundColor: '#27272a', borderRadius: '8px', padding: '16px',
                            color: '#d4d4d8', fontSize: '1rem', lineHeight: 1.6,
                            minHeight: '120px', whiteSpace: 'pre-wrap', marginBottom: '24px'
                        }}>
                            {selectedContent.description || "상세 설명이 없습니다."}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setSelectedContent(null)}
                                style={{
                                    padding: '12px 20px', borderRadius: '8px',
                                    backgroundColor: '#27272a', color: '#e4e4e7',
                                    border: 'none', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                닫기
                            </button>
                            {/* Complete Button */}
                            {(selectedContent as any).chapterId && (
                                <button
                                    onClick={() => {
                                        handleToggleComplete((selectedContent as any).chapterId, selectedContent.id);
                                        // Update local state of selectedContent to reflect change visually if we keep modal open
                                        setSelectedContent(prev => prev ? { ...prev, isDone: !prev.isDone } : null);
                                    }}
                                    style={{
                                        padding: '12px 24px', borderRadius: '8px',
                                        backgroundColor: selectedContent.isDone ? '#3f3f46' : '#fbbf24',
                                        color: selectedContent.isDone ? '#a1a1aa' : '#000',
                                        border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    {selectedContent.isDone ? (
                                        <>
                                            <FiRotateCcw /> 완료 취소
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle /> 학습 완료
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- DETAIL MODAL (Personal Post) --- */}
            {
                selectedPost && (
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
                                    <button // Keep disabled if personal for now as API not fully ready
                                        disabled
                                        style={{
                                            padding: '10px 20px', backgroundColor: selectedPost.isDone ? '#27272a' : '#3b82f6',
                                            color: selectedPost.isDone ? '#71717a' : '#fff',
                                            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: selectedPost.isDone ? 'default' : 'not-allowed',
                                            opacity: 0.5
                                        }}
                                    >
                                        {selectedPost.isDone ? '이미 완료됨' : '완료 처리 (Coming Soon)'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* --- EDIT MODAL (Chapter) --- */}
            {editingChapter && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setEditingChapter(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '400px', backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46'
                    }}>
                        <h3 style={{ color: '#fff', marginBottom: '16px' }}>챕터 수정</h3>
                        <input
                            value={editingChapter.week}
                            onChange={e => setEditingChapter({ ...editingChapter, week: e.target.value })}
                            placeholder="Week (예: Week 1)"
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}
                        />
                        <input
                            value={editingChapter.title}
                            onChange={e => setEditingChapter({ ...editingChapter, title: e.target.value })}
                            placeholder="Chapter Title"
                            style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setEditingChapter(null)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#3f3f46', color: '#fff', border: 'none', cursor: 'pointer' }}>취소</button>
                            <button onClick={handleUpdateChapter} style={{ padding: '8px 16px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>수정 완료</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL (Content) --- */}
            {editingContent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setEditingContent(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '500px', backgroundColor: '#18181b', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46'
                    }}>
                        <h3 style={{ color: '#fff', marginBottom: '16px' }}>컨텐츠 수정</h3>
                        <input
                            value={editingContent.title}
                            onChange={e => setEditingContent({ ...editingContent, title: e.target.value })}
                            placeholder="Content Title"
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}
                        />
                        <textarea
                            value={editingContent.desc}
                            onChange={e => setEditingContent({ ...editingContent, desc: e.target.value })}
                            placeholder="Description"
                            rows={4}
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff', resize: 'vertical' }}
                        />
                        <select
                            value={editingContent.difficulty}
                            onChange={e => setEditingContent({ ...editingContent, difficulty: e.target.value as Difficulty })}
                            style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', background: '#27272a', border: '1px solid #3f3f46', color: '#fff' }}
                        >
                            <option value="EASY">EASY (10~150 XP)</option>
                            <option value="NORMAL">NORMAL (150~450 XP)</option>
                            <option value="HARD">HARD (450~1000 XP)</option>
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setEditingContent(null)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#3f3f46', color: '#fff', border: 'none', cursor: 'pointer' }}>취소</button>
                            <button onClick={handleUpdateContent} style={{ padding: '8px 16px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>수정 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </section >
    );
}
