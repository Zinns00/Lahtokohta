"use client";

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Canvas/WebGL
const Dashboard3D = dynamic(() => import('./components/Dashboard3D'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading 3D Environment...</div>
});

export default function DashboardPage() {
    return <Dashboard3D />;
}
