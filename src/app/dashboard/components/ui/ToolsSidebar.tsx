import { Box, Layers, Move, Image as ImageIcon } from 'lucide-react';
import { useGridStore } from '@/store/useGridStore';

export function ToolsSidebar() {
    const cameraView = useGridStore((state) => state.cameraView);
    const setCameraView = useGridStore((state) => state.setCameraView);

    return (
        <aside className="absolute left-10 top-1/2 transform -translate-y-1/2 flex flex-col gap-8 z-50 select-none">
            <div className="text-[10px] font-bold text-gray-400 tracking-[0.2em] mb-2 uppercase">
                Tools
            </div>

            <ToolItem icon={<Box size={20} />} label="Render" />

            {/* Rotation Tool - Toggles View */}
            <ToolItem
                icon={<Move size={20} />}
                label="Rotation"
                active={cameraView === 'ISOMETRIC'}
                onClick={() => setCameraView(cameraView === 'ISOMETRIC' ? 'TOP_DOWN' : 'ISOMETRIC')}
            />

            <ToolItem icon={<ImageIcon size={20} />} label="Texture" />
            <ToolItem icon={<Layers size={20} />} label="Polygons" />

            {/* Bottom Label (from design) */}
            <div className="absolute -bottom-40 left-0 border border-black/80 px-3 py-4 w-12 h-12 flex items-center justify-center">
                <span className="text-[10px] font-bold leading-tight">END<br />IS<br />UI.</span>
            </div>
        </aside>
    );
}

function ToolItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`group flex items-center gap-4 transition-all ${active ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
        >
            <div className={`p-1 ${active ? 'bg-black text-white' : 'text-black'}`}>
                {icon}
            </div>
            {active && (
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                    {label}
                </span>
            )}
            {!active && (
                <span className="hidden group-hover:block text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">
                    {label}
                </span>
            )}
        </button>
    );
}
