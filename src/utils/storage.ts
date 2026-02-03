/**
 * Generate a consistent storage key for workspace-related data
 */
export const getWorkspaceStorageKey = (workspaceId: string | number, key: string): string => {
    return `workspace_${workspaceId}_${key}`;
};
