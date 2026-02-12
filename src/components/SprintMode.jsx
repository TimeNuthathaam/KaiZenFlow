import { useState, useEffect, useMemo } from 'react';
import { Square, Check, Star, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { getBucketConfig, formatDuration, formatMinutes, getPriorityConfig } from '../utils/constants';

// Encouragement messages for ADHD support
const SPRINT_ENCOURAGEMENTS = [
    '💪 ไปได้เลย! ทำได้!',
    '🎯 โฟกัสแค่ตรงนี้!',
    '⚡ พลังเต็มแม็กซ์!',
    '🚀 ลุยเลย!',
    '🌟 เก่งมากที่เริ่มแล้ว!',
    '🔥 ปังกว่านี้ไม่มีอีกแล้ว!',
];

const TIME_MILESTONES = [15, 25, 45, 60, 90]; // minutes

export default function SprintMode({
    bucket,
    tasks,
    onStopSprint,
    onToggleComplete,
    onToggleHighlight,
    startTime
}) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [encouragement, setEncouragement] = useState('');
    const [milestone, setMilestone] = useState(null);

    const bucketConfig = getBucketConfig(bucket);
    const hasHighlight = tasks.some(t => t.is_daily_highlight);
    const completedCount = tasks.filter(t => t.is_completed).length;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    // Calculate estimated total from tasks
    const estimatedTotal = useMemo(() => {
        return tasks.reduce((sum, t) => sum + (t.estimated_duration || 0), 0);
    }, [tasks]);

    const estimatedTotalSeconds = estimatedTotal * 60;

    // Random encouragement on mount
    useEffect(() => {
        setEncouragement(SPRINT_ENCOURAGEMENTS[Math.floor(Math.random() * SPRINT_ENCOURAGEMENTS.length)]);
    }, []);

    // Timer and milestone checker
    useEffect(() => {
        const start = startTime || Date.now();

        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - start) / 1000);
            setElapsedSeconds(elapsed);

            // Check for milestones
            const minutes = Math.floor(elapsed / 60);
            const hit = TIME_MILESTONES.find(m => m === minutes && milestone !== m);
            if (hit) {
                setMilestone(hit);
                setTimeout(() => setMilestone(null), 5000);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, milestone]);

    const handleStopClick = () => {
        if (elapsedSeconds < 60) {
            onStopSprint(elapsedSeconds);
        } else {
            setShowStopConfirm(true);
        }
    };

    const confirmStop = () => {
        setShowStopConfirm(false);
        onStopSprint(elapsedSeconds);
    };

    // Calculate estimation accuracy
    const getAccuracyInfo = () => {
        if (!estimatedTotal || elapsedSeconds < 10) return null;
        const ratio = elapsedSeconds / estimatedTotalSeconds;
        if (ratio < 0.8) return { label: 'เร็วกว่าที่คิด!', color: 'text-green-400', emoji: '🏎️' };
        if (ratio <= 1.2) return { label: 'ตรงเป๊ะ!', color: 'text-green-400', emoji: '🎯' };
        if (ratio <= 1.5) return { label: 'นานกว่าที่คิดนิดหน่อย', color: 'text-yellow-400', emoji: '⏰' };
        return { label: 'นานกว่าที่คิดมาก!', color: 'text-red-400', emoji: '🐢' };
    };

    const accuracy = getAccuracyInfo();

    return (
        <div className="fixed inset-0 bg-surface-dark/95 backdrop-blur-lg z-50 overflow-auto">
            {/* Breathing background */}
            <div className="absolute inset-0 bg-gradient-radial from-creative/10 to-transparent breathe-bg pointer-events-none" />

            <div className="min-h-screen flex flex-col p-4 md:p-8 relative">
                {/* Encouragement Banner */}
                <div className="text-center mb-4 animate-fade-in">
                    <span className="inline-block px-6 py-2 bg-gradient-to-r from-creative/20 to-admin/20 rounded-full text-lg font-medium text-white">
                        {encouragement}
                    </span>
                </div>

                {/* Milestone Alert */}
                {milestone && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 animate-bounce-subtle">
                        <div className="px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 
                            border border-green-500/30 rounded-2xl backdrop-blur-sm">
                            <span className="text-lg font-bold text-green-400">
                                🎉 {milestone} นาทีของการโฟกัส! สุดยอด!
                            </span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-4">
                        <span className="text-2xl">{bucketConfig.emoji}</span>
                        <span className={`font-semibold ${bucketConfig.textClass}`}>
                            {bucketConfig.name} Sprint
                        </span>
                    </div>

                    <p className="text-gray-400 text-sm">
                        โฟกัสแค่ bucket นี้ • ทำมาแล้ว {elapsedMinutes} นาที
                    </p>
                </div>

                {/* Timer Display */}
                <div className="text-center mb-4">
                    <div className="timer-pulse inline-block">
                        <div className={`text-6xl md:text-8xl font-mono font-bold 
              bg-gradient-to-r ${bucket === 'urgent' ? 'from-urgent to-red-400' :
                                bucket === 'deadline' ? 'from-deadline to-amber-400' :
                                    bucket === 'admin' ? 'from-admin to-blue-400' :
                                        'from-creative to-purple-400'
                            } bg-clip-text text-transparent`}>
                            {formatDuration(elapsedSeconds)}
                        </div>
                    </div>
                    <p className="text-gray-500 mt-2">Time Elapsed (นับขึ้น ไม่ใช่ countdown)</p>
                </div>

                {/* ⏱️ Estimated vs Actual (Reality Check) */}
                {estimatedTotal > 0 && (
                    <div className="max-w-md mx-auto w-full mb-6 animate-fade-in">
                        <div className="glass-strong rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-creative" />
                                <span className="text-sm font-medium text-gray-300">Reality Check</span>
                                {accuracy && (
                                    <span className={`text-xs ml-auto ${accuracy.color}`}>
                                        {accuracy.emoji} {accuracy.label}
                                    </span>
                                )}
                            </div>

                            {/* Visual comparison bars */}
                            <div className="space-y-2">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>📐 ประเมิน</span>
                                        <span>{formatMinutes(estimatedTotal)}</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full bg-blue-500/50" style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>⏱️ ใช้จริง</span>
                                        <span>{formatDuration(elapsedSeconds)}</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${elapsedSeconds > estimatedTotalSeconds
                                                ? 'bg-red-500/70' : 'bg-green-500/50'
                                                }`}
                                            style={{
                                                width: `${Math.min((elapsedSeconds / estimatedTotalSeconds) * 100, 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-4 px-6 py-3 glass-strong rounded-2xl">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-400">{completedCount}</p>
                            <p className="text-xs text-gray-400">เสร็จแล้ว</p>
                        </div>
                        <div className="w-px h-10 bg-white/20" />
                        <div className="text-center">
                            <p className="text-3xl font-bold text-gray-400">{tasks.length - completedCount}</p>
                            <p className="text-xs text-gray-400">เหลืออยู่</p>
                        </div>
                        {estimatedTotal > 0 && (
                            <>
                                <div className="w-px h-10 bg-white/20" />
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-blue-400">~{formatMinutes(estimatedTotal)}</p>
                                    <p className="text-xs text-gray-400">ประเมินรวม</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 max-w-2xl mx-auto w-full mb-8">
                    <div className="space-y-3">
                        {tasks.map(task => {
                            const priority = getPriorityConfig(task.priority_type);
                            return (
                                <div
                                    key={task.id}
                                    className={`glass-strong rounded-xl p-4 transition-all animate-card-enter
                                    ${task.is_completed ? 'opacity-60' : 'hover:bg-white/10 hover-lift'}
                                    ${task.is_daily_highlight ? 'ring-2 ring-yellow-500/50' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Complete Button */}
                                        <button
                                            onClick={(e) => onToggleComplete(task.id, e)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center
                                            transition-all ripple ${task.is_completed
                                                    ? 'bg-green-500 text-white glow-success scale-110'
                                                    : 'border-2 border-gray-500 hover:border-green-500 hover:scale-105'
                                                }`}
                                        >
                                            {task.is_completed && <Check className="w-6 h-6" />}
                                        </button>

                                        {/* Priority + Title */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {priority && <span>{priority.icon}</span>}
                                                <span className={`text-lg ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
                                                    {task.title}
                                                </span>
                                            </div>
                                            {task.estimated_duration && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <Clock className="w-3 h-3" /> ~{formatMinutes(task.estimated_duration)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Daily Highlight */}
                                        {task.is_daily_highlight && (
                                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Stop Button */}
                <div className="text-center">
                    <button
                        onClick={handleStopClick}
                        className="group inline-flex items-center gap-3 px-8 py-4 
              bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500
              rounded-2xl transition-all hover:scale-105 ripple"
                    >
                        <Square className="w-6 h-6 text-red-400 group-hover:text-red-300" />
                        <span className="text-lg font-medium text-white">Stop Sprint</span>
                    </button>
                </div>

                {/* Stop Confirmation Modal */}
                {showStopConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
                        <div className="glass-strong rounded-2xl p-6 max-w-md w-full animate-card-enter">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-8 h-8 text-yellow-400" />
                                <h3 className="text-xl font-bold text-white">หยุดจริงๆ เหรอ?</h3>
                            </div>

                            <p className="text-gray-300 mb-2">
                                คุณทำมาแล้ว <span className="text-creative font-bold">{formatDuration(elapsedSeconds)}</span>!
                            </p>

                            {/* Reality Check in confirmation */}
                            {estimatedTotal > 0 && (
                                <p className="text-gray-400 mb-2 text-sm">
                                    📐 ประเมินไว้ {formatMinutes(estimatedTotal)} → ⏱️ ใช้จริง {formatDuration(elapsedSeconds)}
                                    {accuracy && <span className={` ml-1 ${accuracy.color}`}>{accuracy.emoji}</span>}
                                </p>
                            )}

                            <p className="text-gray-400 mb-6 text-sm">
                                ถ้าหยุดตอนนี้ ก็ไม่เป็นไร แต่ลองคิดดูอีกทีนะ 💭
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowStopConfirm(false)}
                                    className="flex-1 px-4 py-3 bg-creative/20 hover:bg-creative/30 text-creative 
                                        rounded-xl font-medium transition-all"
                                >
                                    ไปต่อ! 💪
                                </button>
                                <button
                                    onClick={confirmStop}
                                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-red-500/20 text-gray-300 
                                        hover:text-red-400 rounded-xl font-medium transition-all"
                                >
                                    หยุดเลย
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
