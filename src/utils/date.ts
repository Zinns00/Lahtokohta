/**
 * Format a Date object to YYYY. MM. DD. string
 */
export const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}. ${m}. ${d}.`;
};

/**
 * Parse a date string (YYYY. M. D.) back to Date object
 */
export const parseDateString = (str: string): Date | null => {
    const parts = str.split('.').map(p => p.trim()).filter(p => p);
    if (parts.length < 3) return null;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date;
};

/**
 * Format a Date object to YYYY-MM-DD(Day) string
 */
export const formatDateWithDay = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = days[date.getDay()];
    return `${yyyy}-${mm}-${dd}(${dayName})`;
};

/**
 * Auto-format numeric string to YYYY. MM. DD.
 */
export const autoFormatDateInput = (input: string): string => {
    let nums = input.replace(/\D/g, '');
    if (nums.length > 8) nums = nums.slice(0, 8);

    let formatted = nums;
    if (nums.length > 4) {
        formatted = `${nums.slice(0, 4)}. ${nums.slice(4)}`;
    }
    if (nums.length > 6) {
        formatted = `${nums.slice(0, 4)}. ${nums.slice(4, 6)}. ${nums.slice(6)}`;
    }
    return formatted;
};

/**
 * Remove the day part (e.g. '(Mon)') from the date string to get YYYY-MM-DD
 */
export const cleanDateString = (str: string): string => {
    if (!str) return '';
    return str.split('(')[0];
};
