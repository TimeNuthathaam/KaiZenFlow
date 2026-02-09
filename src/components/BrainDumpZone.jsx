import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';

export default function BrainDumpZone({ onAddTask, disabled }) {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && !disabled) {
            onAddTask(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
        }
    };

    return (
        <div className="glass-strong rounded-2xl p-4 md:p-6 mb-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">Brain Dump Zone</h2>
                    <p className="text-sm text-gray-400">เททุกอย่างออกจากหัว - พิมพ์แล้วกด Enter</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="มีอะไรต้องทำ? พิมพ์เลย..."
                    disabled={disabled}
                    className={`w-full px-4 py-4 pr-14 rounded-xl bg-white/5 border border-white/10 
            text-white placeholder-gray-500 outline-none transition-all
            focus:border-creative focus:ring-2 focus:ring-creative/20
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || disabled}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 
            w-10 h-10 rounded-lg flex items-center justify-center
            transition-all ${inputValue.trim() && !disabled
                            ? 'bg-creative text-white hover:bg-creative-dark'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            {disabled && (
                <p className="mt-3 text-sm text-yellow-500 flex items-center gap-2">
                    <span>⏸️</span> Sprint กำลังทำงาน - หยุด Sprint ก่อนถึงจะเพิ่ม task ได้
                </p>
            )}
        </div>
    );
}
