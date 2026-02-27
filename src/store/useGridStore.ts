import { create } from 'zustand';

export interface Workspace3D {
    id: string;
    title: string;
    category: string;
    level: number;
    gridX: number;
    gridZ: number;
    stackIndex: number;
    color: string; // Hex color for the border
    progress: number;
}

interface GridState {
    workspaces: Workspace3D[];
    cameraView: 'ISOMETRIC' | 'TOP_DOWN';
    draggingId: string | null;

    // Actions
    setCameraView: (view: 'ISOMETRIC' | 'TOP_DOWN') => void;
    setDraggingId: (id: string | null) => void;
    updateWorkspacePosition: (id: string, x: number, z: number) => void;
}

// Mock Data Generator
const generateMockWorkspaces = (): Workspace3D[] => {
    return [
        {
            id: 'ws-1',
            title: '운동 루틴',
            category: 'Health',
            level: 12,
            gridX: 0,
            gridZ: 0,
            stackIndex: 0,
            color: '#ef4444', // Red-ish
            progress: 65,
        },
        {
            id: 'ws-2',
            title: '알고리즘 공부',
            category: 'Study',
            level: 5,
            gridX: 2,
            gridZ: 1,
            stackIndex: 0,
            color: '#3b82f6', // Blue-ish
            progress: 30,
        },
        {
            id: 'ws-3',
            title: '사이드 프로젝트',
            category: 'Project',
            level: 45,
            gridX: -2,
            gridZ: -1,
            stackIndex: 0,
            color: '#8b5cf6', // Purple-ish
            progress: 88,
        },
        {
            id: 'ws-4',
            title: '독서 기록',
            category: 'Hobby',
            level: 2,
            gridX: 2,
            gridZ: 1,
            stackIndex: 1, // Stacked on top of ws-2
            color: '#f59e0b', // Amber
            progress: 10,
        }
    ];
};

export const useGridStore = create<GridState>((set) => ({
    workspaces: generateMockWorkspaces(),
    cameraView: 'ISOMETRIC',
    draggingId: null,

    setCameraView: (view) => set({ cameraView: view }),
    setDraggingId: (id) => set({ draggingId: id }),
    updateWorkspacePosition: (id, x, z) =>
        set((state) => {
            // Simple update for now, stacking logic will be more complex later
            return {
                workspaces: state.workspaces.map((ws) =>
                    ws.id === id ? { ...ws, gridX: x, gridZ: z } : ws
                ),
            };
        }),
}));
