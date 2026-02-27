"use client";

import dynamic from 'next/dynamic';
import { DashboardLayout } from './components/DashboardLayout';

// Dynamic import to avoid SSR issues with Canvas/WebGL
const Dashboard3D = dynamic(() => import('./components/Dashboard3D'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-400 text-sm tracking-widest">LOADING 3D ASSETS...</div>
});

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <Dashboard3D />
        </DashboardLayout>
    );
}
