export const WORKSPACE_CATEGORIES = [
    { val: 'Study', label: '📚 Academic (학습)' },
    { val: 'Project', label: '🚀 Project (프로젝트)' },
    { val: 'Health', label: '🌿 Wellness (건강)' },
    { val: 'Hobby', label: '🎨 Hobby (취미)' }
] as const;

export type WorkspaceCategory = typeof WORKSPACE_CATEGORIES[number]['val'];

export const WORKSPACE_DIFFICULTIES = [
    { val: 'Easy', multiplier: 'x1.0', label: 'Easy' },
    { val: 'Normal', multiplier: 'x1.5', label: 'Normal' },
    { val: 'Hard', multiplier: 'x2.0', label: 'Hard' }
] as const;

export type WorkspaceDifficulty = typeof WORKSPACE_DIFFICULTIES[number]['val'];

export const WORKSPACE_DEFAULTS = {
    MIN_STUDY_HOURS: 1,
    MAX_STUDY_HOURS: 23,
    DEFAULT_DIFFICULTY: 'Normal' as WorkspaceDifficulty,
    DEFAULT_CATEGORY: 'Study' as WorkspaceCategory,
    DEFAULT_TASK_XP_REWARD: 10,
};

export const WORKSPACE_PRESET_DAYS = [
    { label: '1주', days: 7 },
    { label: '1개월', days: 30 },
    { label: '3개월', days: 90 },
    { label: '1년', days: 365 },
] as const;

export const WORKSPACE_CREATION_STEPS = [
    { step: 1, label: '기본 정보', icon: 'FiTarget' },
    { step: 2, label: '기간 설정', icon: 'FiCalendar' },
    { step: 3, label: '목표 설정', icon: 'FiClock' },
] as const;

export const CURRICULUM_CONTENT_TYPES = [
    { val: 'LESSON', label: 'Lesson (강의)' },
    { val: 'QUIZ', label: 'Quiz (퀴즈)' },
    { val: 'PROJECT', label: 'Project (프로젝트)' }
] as const;

export type CurriculumContentType = typeof CURRICULUM_CONTENT_TYPES[number]['val'];

export const CURRICULUM_STATUS = {
    LOCKED: 'LOCKED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
} as const;

export type CurriculumStatus = keyof typeof CURRICULUM_STATUS;
