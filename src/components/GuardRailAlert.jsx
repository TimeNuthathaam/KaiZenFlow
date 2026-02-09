import { AlertTriangle, Star, Moon, X } from 'lucide-react';

export default function GuardRailAlert({ type, dailyHighlight, onDismiss, onFocusHighlight }) {
    if (type === 'emergency') {
        return (
            <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 animate-slide-up">
                <div className="glass-strong rounded-2xl p-4 border-2 border-urgent bg-urgent/10 alert-shake">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-urgent/20 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-urgent" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-urgent">🚨 Emergency Mode!</h3>
                            <p className="text-sm text-gray-300 mt-1">
                                เลย 16:00 น. แล้ว!
                                {dailyHighlight
                                    ? ' Daily Highlight ยังไม่เสร็จ - ทิ้งงานอื่นมาทำอันนี้เดี๋ยวนี้!'
                                    : ' ยังไม่ได้ตั้ง Daily Highlight วันนี้!'}
                            </p>
                            {dailyHighlight && (
                                <div className="mt-3 p-2 bg-yellow-500/10 rounded-lg flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm text-yellow-300 truncate flex-1">
                                        {dailyHighlight.title}
                                    </span>
                                    <button
                                        onClick={onFocusHighlight}
                                        className="px-2 py-1 bg-yellow-500 text-black text-xs font-medium rounded"
                                    >
                                        ไปทำ!
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onDismiss}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'hardstop') {
        return (
            <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 animate-slide-up">
                <div className="glass-strong rounded-2xl p-4 border-2 border-purple-500 bg-purple-500/10">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Moon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-purple-400">🌙 Hard Stop - 21:00</h3>
                            <p className="text-sm text-gray-300 mt-1">
                                ถึงเวลาพักผ่อนแล้ว! หยุดทำงานเถอะ พักผ่อนให้เต็มที่
                                พรุ่งนี้ค่อยมาสู้ใหม่ 💪
                            </p>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
