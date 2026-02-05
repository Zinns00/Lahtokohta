import { format } from 'date-fns';

export function DashboardHeader() {
    const today = new Date();
    // Format: "THU, FEBRUARY 5 — 2026"
    const dateStr = format(today, 'EEE, MMMM d').toUpperCase();
    const yearStr = format(today, 'yyyy');

    return (
        <header className="flex justify-between items-center px-10 py-6 text-[#1a1a1a] text-xs font-medium tracking-widest uppercase z-50 absolute top-0 left-0 w-full select-none">
            {/* Brand */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl tracking-widest font-normal" style={{ fontFamily: 'var(--font-grenze)' }}>LÄHTÖKOHTA</h1>
                <span className="text-[10px] text-gray-500 font-sans tracking-[0.2em] font-bold">WORKSPACE V2.0</span>
            </div>

            {/* Center Date */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-gray-500">
                <span>{dateStr} — {yearStr}</span>
            </div>

            {/* Right Nav */}
            <nav className="flex items-center gap-8">
                <button className="hover:text-black transition-colors">Profile</button>
                <button className="hover:text-black transition-colors">Settings</button>
                <button className="hover:text-black transition-colors">Log Out</button>
                {/* Simple Circle Avatar Placeholder (Black) */}
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold">
                    D
                </div>
            </nav>
        </header>
    );
}
