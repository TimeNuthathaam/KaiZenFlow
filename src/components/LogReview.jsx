import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, X, Flame, Meh, Battery } from 'lucide-react';
import { formatDuration, BUCKETS, MOODS } from '../utils/constants';
import api from '../api';

export default function LogReview({ onClose }) {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [logsData, statsData] = await Promise.all([
                api.getKaizenLogs(30),
                api.getKaizenStats()
            ]);
            setLogs(logsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMoodIcon = (mood) => {
        switch (mood) {
            case 'flow': return <Flame className="w-4 h-4 text-orange-400" />;
            case 'okay': return <Meh className="w-4 h-4 text-gray-400" />;
            case 'drained': return <Battery className="w-4 h-4 text-purple-400" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="glass-strong rounded-2xl p-8 animate-pulse">
                <div className="text-center text-gray-400">กำลังโหลด...</div>
            </div>
        );
    }

    return (
        <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-creative" />
                    <h2 className="text-lg font-semibold">Kaizen Log Review</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-3 gap-3">
                        {/* Flow Sessions */}
                        <div className="glass rounded-xl p-4 text-center">
                            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">
                                {stats.moodStats.find(m => m.mood === 'flow')?.count || 0}
                            </p>
                            <p className="text-xs text-gray-400">Flow Sessions</p>
                        </div>

                        {/* Total Time */}
                        <div className="glass rounded-xl p-4 text-center">
                            <Clock className="w-6 h-6 text-creative mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">
                                {formatDuration(
                                    stats.moodStats.reduce((acc, m) => acc + (m.total_seconds || 0), 0)
                                )}
                            </p>
                            <p className="text-xs text-gray-400">Total Time</p>
                        </div>

                        {/* Sessions */}
                        <div className="glass rounded-xl p-4 text-center">
                            <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">
                                {stats.moodStats.reduce((acc, m) => acc + m.count, 0)}
                            </p>
                            <p className="text-xs text-gray-400">Total Sprints</p>
                        </div>
                    </div>
                )}

                {/* Bucket Performance */}
                {stats?.bucketStats && stats.bucketStats.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Bucket Performance</h3>
                        <div className="space-y-2">
                            {stats.bucketStats.map(bucket => {
                                const config = BUCKETS[bucket.bucket] || BUCKETS.unsorted;
                                const total = bucket.flow_count + bucket.okay_count + bucket.drained_count;
                                const flowPercent = total > 0 ? (bucket.flow_count / total) * 100 : 0;

                                return (
                                    <div key={bucket.bucket} className="glass rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span>{config.emoji}</span>
                                                <span className="text-sm font-medium">{config.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {bucket.sessions} sprints
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                                                style={{ width: `${flowPercent}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {flowPercent.toFixed(0)}% flow rate
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Recent Logs */}
                <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Sessions</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">ยังไม่มีข้อมูล</p>
                        ) : (
                            logs.slice(0, 10).map(log => {
                                const config = BUCKETS[log.bucket] || BUCKETS.unsorted;
                                return (
                                    <div key={log.id} className="glass rounded-lg p-3 flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <span>{config.emoji}</span>
                                            {getMoodIcon(log.mood)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">
                                                {log.notes || `${config.name} sprint`}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDuration(log.duration_seconds)} • {new Date(log.created_at).toLocaleDateString('th-TH')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
