export function LightingSidebar() {
    return (
        <aside className="absolute right-10 top-1/2 transform -translate-y-1/2 z-50 select-none">
            {/* Card Container */}
            <div className="bg-[#D1D5DB] p-6 shadow-xl w-64 h-72 flex flex-col justify-between">

                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[11px] font-bold text-black uppercase tracking-[0.1em]">Lightning</span>
                    <button className="text-black hover:text-gray-600 font-sans text-xs font-bold">— X</button>
                </div>

                {/* Spot / Area Toggle */}
                <div className="flex gap-4 mb-4">
                    {/* Spot Button: Black bg, Glowing dot */}
                    <button className="relative bg-black text-white w-24 h-24 flex flex-col items-center justify-center gap-3 shadow-lg hover:bg-neutral-900 transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_15px_4px_rgba(255,255,255,0.9)] blur-[0.5px]"></div>
                        <span className="text-[10px] font-medium tracking-wide">Spot</span>
                    </button>

                    {/* Area Button: Transparent, Grey Border */}
                    <button className="bg-transparent border border-[#9CA3AF] text-[#6B7280] w-24 h-24 flex flex-col items-center justify-center gap-3 hover:border-black transition-colors">
                        <span className="text-[10px] font-medium tracking-wide">Area</span>
                    </button>
                </div>

                {/* Brightness Slider */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-medium text-black uppercase tracking-widest">Brightness</span>
                    </div>
                    {/* Custom Range Input Appearance */}
                    <input
                        type="range"
                        className="w-full h-0.5 bg-black appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
                    />
                </div>

            </div>
        </aside>
    );
}
