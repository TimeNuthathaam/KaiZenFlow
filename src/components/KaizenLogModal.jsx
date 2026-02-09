import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { MOODS, getBucketConfig, formatDuration } from '../utils/constants';

export default function KaizenLogModal({
    bucket,
    durationSeconds,
    onSave,
    onClose
}) {
    const [selectedMood, setSelectedMood] = useState(null);
    const [notes, setNotes] = useState('');
    const bucketConfig = getBucketConfig(bucket);

    const handleSubmit = () => {
        if (!selectedMood) return;

        onSave({
            bucket,
            duration_seconds: durationSeconds,
            mood: selectedMood,
            notes: notes.trim() || null
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl w-full max-w-md animate-slide-up overflow-hidden">
                {/* Header */}
                <div className={`p-6 ${bucketConfig.bgClass} border-b border-white/10`}>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-white">Kaizen Log 📝</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <p className="text-gray-300">
                        Sprint เสร็จแล้ว! บันทึกความรู้สึกเพื่อเรียนรู้ pattern
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Duration */}
                    <div className="text-center">
                        <p className="text-gray-400 text-sm mb-1">ระยะเวลา Sprint</p>
                        <p className="text-3xl font-mono font-bold text-white">
                            {formatDuration(durationSeconds)}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-xl">{bucketConfig.emoji}</span>
                            <span className={bucketConfig.textClass}>{bucketConfig.name}</span>
                        </div>
                    </div>

                    {/* Mood Selector */}
                    <div>
                        <p className="text-gray-300 text-sm mb-3">รู้สึกยังไง?</p>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.values(MOODS).map(mood => (
                                <button
                                    key={mood.id}
                                    onClick={() => setSelectedMood(mood.id)}
                                    className={`p-4 rounded-xl transition-all 
                    ${selectedMood === mood.id
                                            ? `bg-gradient-to-br ${mood.color} scale-105 shadow-lg`
                                            : 'glass hover:bg-white/10'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">{mood.emoji}</div>
                                    <div className={`text-sm font-medium ${selectedMood === mood.id ? 'text-white' : 'text-gray-300'
                                        }`}>
                                        {mood.label}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        {mood.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <p className="text-gray-300 text-sm mb-3">ทำอะไรไปบ้าง? (optional)</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="จดสั้นๆ เช่น 'ตอบอีเมล 5 ฉบับ' หรือ 'ออกแบบ mockup เสร็จ'"
                            className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10
                text-white placeholder-gray-500 outline-none resize-none
                focus:border-creative focus:ring-2 focus:ring-creative/20"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl glass hover:bg-white/10 
              text-gray-300 font-medium transition-all"
                    >
                        ข้าม
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedMood}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2
              font-medium transition-all ${selectedMood
                                ? 'bg-gradient-to-r from-creative to-purple-600 text-white hover:scale-105'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Send className="w-4 h-4" />
                        บันทึก
                    </button>
                </div>
            </div>
        </div>
    );
}
