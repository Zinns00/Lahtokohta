export type UserTitle =
    | '탐험가'
    | '개척자'
    | '항해사'
    | '정복자'
    | '초월자'
    | '마스터';

export interface LevelInfo {
    level: number;
    title: UserTitle;
    badge: string;
    nextLevelXP: number;
    progress: number; // 0 to 100
}

/**
 * Calculates current user level, title, and badge based on Total XP.
 * Formula: RequiredXP = 1000 * (1.2)^(Level-1)
 */
export function getUserLevelInfo(totalXP: number): LevelInfo {
    let level = 1;
    let requiredXP = 0;

    // Calculate level iteratively based on the geometric formula
    while (true) {
        // XP needed to complete current level
        const nextLevelReq = Math.floor(1000 * Math.pow(1.2, level - 1));

        if (totalXP < nextLevelReq) {
            requiredXP = nextLevelReq;
            break;
        }

        totalXP -= nextLevelReq;
        level++;

        if (level >= 100) {
            level = 100;
            requiredXP = 0; // Max level
            totalXP = 0;
            break;
        }
    }

    let title: UserTitle = '탐험가';
    let badge = '🔭'; // Telescope

    if (level >= 1 && level <= 19) {
        title = '탐험가';
        badge = '🔭';
    } else if (level >= 20 && level <= 39) {
        title = '개척자';
        badge = '🚩';
    } else if (level >= 40 && level <= 69) {
        title = '항해사';
        badge = '🧭';
    } else if (level >= 70 && level <= 79) {
        title = '정복자';
        badge = '👑';
    } else if (level >= 80 && level <= 99) {
        title = '초월자';
        badge = '💠';
    } else if (level >= 100) {
        title = '마스터';
        badge = '🪐';
    }

    const progress = requiredXP === 0 ? 100 : Math.min(100, Math.floor((totalXP / requiredXP) * 100));

    return {
        level,
        title,
        badge,
        nextLevelXP: requiredXP,
        progress
    };
}

/**
 * Calculates max XP for a specific workspace level based on difficulty.
 * Formula: 100 * Level * Multiplier
 */
export function getWorkspaceMaxXP(level: number, difficulty: 'Easy' | 'Normal' | 'Hard'): number {
    const multipliers = {
        'Easy': 1.0,
        'Normal': 1.5,
        'Hard': 2.0
    };

    return Math.floor(100 * level * multipliers[difficulty]);
}
