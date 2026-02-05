import { DashboardHeader } from './ui/DashboardHeader';
import { ToolsSidebar } from './ui/ToolsSidebar';
import { LightingSidebar } from './ui/LightingSidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="relative w-screen h-screen bg-[#B0B5BA] overflow-hidden flex items-center justify-center bg-grid-pattern">
            {/* Global UI */}
            <DashboardHeader />
            <ToolsSidebar />
            <LightingSidebar />

            {/* Main Stage (White Card) */}
            <main className="relative w-[55vw] h-[75vh] bg-white shadow-2xl overflow-hidden rounded-sm z-40">
                {/* 3D Canvas sits here */}
                {children}
            </main>
        </div>
    );
}
