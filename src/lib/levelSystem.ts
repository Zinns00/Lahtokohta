// ==========================================
// Types & Interfaces
// ==========================================

export type UserTitle =
    | '탐험가'
    | '개척자'
    | '항해사'
    | '정복자'
    | '마스터'
    | '초월자'
    | '절대자';

export interface LevelInfo {
    level: number;
    title: UserTitle;
    badge: string;
    nextLevelXP: number;
    progress: number; // 0 to 100
}

export type WorkspaceTier =
    | 'grandidierite'
    | 'painite'
    | 'red diamond'
    | 'diamond'
    | 'platinum'
    | 'gold'
    | 'silver'
    | 'bronze';

// ==========================================
// Configuration Constants
// ==========================================

const LEVEL_CONFIG = {
    MAX_LEVEL: 100,
    BASE_XP: 1000,
    GROWTH_FACTOR: 1.1,      // Exponential growth rate
    SOFT_CAP_LEVEL: 80,      // Level where growth switches to linear
    SOFT_CAP_INCREMENT: 1000 // Linear increment after soft cap
} as const;

const TITLE_THRESHOLDS: { minLevel: number; title: UserTitle; badge: string }[] = [
    { minLevel: 100, title: '절대자', badge: '🌌' },
    { minLevel: 90, title: '초월자', badge: '💠' },
    { minLevel: 80, title: '마스터', badge: '🪐' },
    { minLevel: 60, title: '정복자', badge: '👑' },
    { minLevel: 40, title: '항해사', badge: '🧭' },
    { minLevel: 20, title: '개척자', badge: '🚩' },
    { minLevel: 1, title: '탐험가', badge: '🔭' },
];

export const TIER_THRESHOLDS: { tier: WorkspaceTier; minLevel: number }[] = [
    { tier: 'grandidierite', minLevel: 120 },
    { tier: 'painite', minLevel: 100 },
    { tier: 'red diamond', minLevel: 90 },
    { tier: 'diamond', minLevel: 80 },
    { tier: 'platinum', minLevel: 50 },
    { tier: 'gold', minLevel: 30 },
    { tier: 'silver', minLevel: 10 },
    { tier: 'bronze', minLevel: 0 },
];

// ==========================================
// Core Logic
// ==========================================

/**
 * Calculates the XP required to move from currentLevel to currentLevel + 1.
 */
function getXPForNextLevel(level: number): number {
    if (level < LEVEL_CONFIG.SOFT_CAP_LEVEL) {
        // Exponential Phase (Extreme Difficulty)
        // Formula: Base * (Growth ^ (Level - 1))
        return Math.floor(LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.GROWTH_FACTOR, level - 1));
    } else {
        // Linear Phase (Sustainable Endgame)
        // Formula: Req(79) + (Level - 79) * Increment
        // We use the requirements of Lv.79 (the last exponential level) as the baseline anchor.
        const reqAt79 = Math.floor(LEVEL_CONFIG.BASE_XP * Math.pow(LEVEL_CONFIG.GROWTH_FACTOR, 79 - 1));
        return reqAt79 + ((level - 79) * LEVEL_CONFIG.SOFT_CAP_INCREMENT);
    }
}

/**
 * Calculates current user level, title, and badge based on Total XP.
 */
export function getUserLevelInfo(totalXP: number): LevelInfo {
    let level = 1;
    let requiredXP = 0; // The XP needed for the *current* level up (totalXP is consumed as we level up)

    // Iteratively deduce level from Total XP
    while (level < LEVEL_CONFIG.MAX_LEVEL) {
        const nextLevelReq = getXPForNextLevel(level);

        if (totalXP < nextLevelReq) {
            requiredXP = nextLevelReq;
            break;
        }

        totalXP -= nextLevelReq;
        level++;
    }

    // Handle Max Level Case
    if (level >= LEVEL_CONFIG.MAX_LEVEL) {
        level = LEVEL_CONFIG.MAX_LEVEL;
        requiredXP = 0;
        totalXP = 0;
    }

    // Determine Title & Badge
    const titleInfo = TITLE_THRESHOLDS.find((t) => level >= t.minLevel) || TITLE_THRESHOLDS[TITLE_THRESHOLDS.length - 1];

    const progress = requiredXP === 0 ? 100 : Math.min(100, Math.floor((totalXP / requiredXP) * 100));

    return {
        level,
        title: titleInfo.title,
        badge: titleInfo.badge,
        nextLevelXP: requiredXP,
        progress
    };
}

/**
 * Calculates max XP for a specific workspace level.
 * Formula: 100 * Level
 */
export function getWorkspaceMaxXP(level: number): number {
    return Math.floor(100 * level);
}

export function getDifficultyMultiplier(difficulty: 'Easy' | 'Normal' | 'Hard'): number {
    const multipliers = {
        'Easy': 1.0,
        'Normal': 1.5,
        'Hard': 2.0
    };
    return multipliers[difficulty] || 1.0;
}

/**
 * Returns the visual tier name based on workspace level.
 */
export function getWorkspaceTier(level: number): WorkspaceTier {
    for (const threshold of TIER_THRESHOLDS) {
        if (level >= threshold.minLevel) {
            return threshold.tier;
        }
    }
    return 'bronze';
}
