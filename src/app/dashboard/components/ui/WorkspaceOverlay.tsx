import { Search, Plus } from 'lucide-react';

export function WorkspaceOverlay() {
    return (
        <div className="absolute top-8 left-0 w-full flex justify-center items-start z-10 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
                {/* Search Bar */}
                <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-[0_2px_20px_rgba(0,0,0,0.05)] border border-gray-100 min-w-[300px]">
                    <Search size={16} className="text-gray-400 mr-3" />
                    <input
                        type="text"
                        placeholder="Find workspace..."
                        className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full font-medium"
                    />
                </div>

                {/* Create Button */}
                <button className="bg-[#1a1a1a] text-white rounded-xl px-5 py-3 flex items-center gap-2 text-sm font-medium hover:bg-black transition-colors shadow-lg">
                    <Plus size={16} />
                    <span>Create Workspace</span>
                </button>
            </div>
        </div>
    );
}
