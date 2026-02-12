import { useState } from 'react';
import { CircleParking, X, Plus, Send } from 'lucide-react';

/**
 * Distraction Parking Lot
 * 
 * Floating button — กดจดความคิดแทรกได้ทันทีโดยไม่หลุดโฟกัส
 * ไม่เปลี่ยนหน้า, ไม่ปิด sprint, เก็บเข้า unsorted bucket
 */
export default function ParkingLot({ onAddTask, items = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [recentItems, setRecentItems] = useState([]);

    const parkingItems = items.filter(t => t.source === 'parking_lot' && !t.is_completed);

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (inputValue.trim()) {
            onAddTask(inputValue.trim(), {
                source: 'parking_lot',
            });
            setRecentItems(prev => [inputValue.trim(), ...prev.slice(0, 4)]);
            setInputValue('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full 
                    flex items-center justify-center shadow-lg transition-all
                    ${isOpen
                        ? 'bg-red-500 hover:bg-red-600 rotate-45'
                        : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'
                    }
                    ${parkingItems.length > 0 ? 'animate-pulse-slow' : ''}
                `}
                title="🅿️ Distraction Parking Lot — จดความคิดแทรก"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <CircleParking className="w-6 h-6 text-white" />
                )}

                {/* Badge count */}
                {parkingItems.length > 0 && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 
                        rounded-full text-xs text-white flex items-center justify-center font-bold">
                        {parkingItems.length}
                    </span>
                )}
            </button>

            {/* Quick Note Panel */}
            {isOpen && (
                <div className="fixed bottom-24 left-6 z-50 w-80 glass-strong rounded-2xl p-4 
                    shadow-2xl animate-slide-up border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                        <CircleParking className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold text-sm">Parking Lot</h3>
                        <span className="text-xs text-gray-500 ml-auto">ไม่หลุดโฟกัส</span>
                    </div>

                    <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="คิดอะไรอยู่? จดไว้ก่อน..."
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 
                                text-white text-sm placeholder-gray-500 outline-none
                                focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className={`p-2 rounded-lg transition-all ${inputValue.trim()
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Recent items */}
                    {recentItems.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500 mb-1">เพิ่งจดไว้:</p>
                            {recentItems.map((item, i) => (
                                <div key={i} className="text-xs text-gray-400 flex items-center gap-2 
                                    px-2 py-1 rounded bg-white/5">
                                    <span className="text-blue-400">🅿️</span>
                                    <span className="truncate">{item}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Parking lot count */}
                    {parkingItems.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-white/5 text-xs text-gray-500">
                            📋 {parkingItems.length} items จอดอยู่ใน Brain Dump
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
