// Centralized Auth Constants
// Prevents hardcoded secrets and ensures environment variables are set.

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: JWT_SECRET is not defined in environment variables.');
    } else {
        console.warn('WARNING: JWT_SECRET is missing. Using dev-only fallback. DO NOT USE IN PRODUCTION.');
    }
}

export const JWT_SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dev-fallback-secret-do-not-use-in-prod'
);
