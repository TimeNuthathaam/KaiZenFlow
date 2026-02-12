import { useState } from 'react';
import { Plus, Zap, Clock, ChevronDown } from 'lucide-react';
import { DURATION_OPTIONS, ENERGY_LEVELS, formatMinutes } from '../utils/constants';

export default function BrainDumpZone({ onAddTask, disabled }) {
    const [inputValue, setInputValue] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [selectedEnergy, setSelectedEnergy] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() && !disabled) {
            onAddTask(inputValue.trim(), {
                estimated_duration: selectedDuration,
                energy_level: selectedEnergy,
            });
            setInputValue('');
            setSelectedDuration(null);
            setSelectedEnergy(null);
            setShowOptions(false);
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
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">Brain Dump Zone</h2>
                    <p className="text-sm text-gray-400">เททุกอย่างออกจากหัว - พิมพ์แล้วกด Enter</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="มีอะไรต้องทำ? พิมพ์เลย..."
                        disabled={disabled}
                        className={`flex-1 px-4 py-4 rounded-xl bg-white/5 border border-white/10 
                        text-white placeholder-gray-500 outline-none transition-all
                        focus:border-creative focus:ring-2 focus:ring-creative/20
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => setShowOptions(!showOptions)}
                        className={`px-3 py-2 rounded-xl border transition-all ${showOptions
                            ? 'bg-creative/20 border-creative text-creative'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                            }`}
                        title="ตั้งค่าเพิ่มเติม"
                    >
                        <ChevronDown className={`w-5 h-5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || disabled}
                        className={`px-4 py-2 rounded-xl flex items-center justify-center
                        transition-all ${inputValue.trim() && !disabled
                                ? 'bg-creative text-white hover:bg-creative-dark'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Options Panel */}
                {showOptions && (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 animate-slide-up">
                        {/* Duration Quick Picks */}
                        <div className="mb-3">
                            <label className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> ใช้เวลาประมาณ
                            </label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {DURATION_OPTIONS.map(min => (
                                    <button
                                        key={min}
                                        type="button"
                                        onClick={() => setSelectedDuration(selectedDuration === min ? null : min)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${selectedDuration === min
                                            ? 'bg-creative text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {formatMinutes(min)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Energy Level */}
                        <div>
                            <label className="text-xs text-gray-400 mb-2 block">⚡ พลังงานที่ต้องใช้</label>
                            <div className="flex gap-2 mt-1">
                                {Object.values(ENERGY_LEVELS).map(level => (
                                    <button
                                        key={level.id}
                                        type="button"
                                        onClick={() => setSelectedEnergy(selectedEnergy === level.id ? null : level.id)}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${selectedEnergy === level.id
                                            ? 'bg-creative text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {level.icon} {level.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary of selections */}
                        {(selectedDuration || selectedEnergy) && (
                            <div className="mt-3 pt-2 border-t border-white/5 text-xs text-gray-400">
                                {selectedDuration && <span className="mr-3">⏱️ ~{formatMinutes(selectedDuration)}</span>}
                                {selectedEnergy && <span>{ENERGY_LEVELS[selectedEnergy].icon} {ENERGY_LEVELS[selectedEnergy].label}</span>}
                            </div>
                        )}
                    </div>
                )}
            </form>

            {disabled && (
                <p className="mt-3 text-sm text-yellow-500 flex items-center gap-2">
                    <span>⏸️</span> Sprint กำลังทำงาน - หยุด Sprint ก่อนถึงจะเพิ่ม task ได้
                </p>
            )}
        </div>
    );
}
