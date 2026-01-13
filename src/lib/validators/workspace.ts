import { z } from 'zod';

export const createWorkspaceSchema = z.object({
    title: z.string().min(1, 'Workspace name is required').max(50),
    color: z.string().default('bronze'),
    category: z.string().optional(),
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(), // ISO date string
    description: z.string().optional(), // Goal
    minStudyHours: z.number().min(0).default(0),
});
