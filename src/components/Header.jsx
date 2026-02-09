import { useState, useEffect } from 'react';
import { Brain, Clock, AlertTriangle, Moon, BarChart3, RefreshCw } from 'lucide-react';
import { GUARD_RAILS } from '../utils/constants';

export default function Header({ onToggleStats, showStats }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alerts, setAlerts] = useState({ emergency: false, hardStop: false });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            const hour = now.getHours();
            setAlerts({
                emergency: hour >= GUARD_RAILS.EMERGENCY_HOUR && hour < GUARD_RAILS.HARD_STOP_HOUR,
                hardStop: hour >= GUARD_RAILS.HARD_STOP_HOUR
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <header className="glass-strong rounded-2xl p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-creative to-purple-600 flex items-center justify-center">
                        <Brain className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Kaizen Flow
                        </h1>
                        <p className="text-sm text-gray-400">Energy Sprints System</p>
                    </div>
                </div>

                {/* Time & Alerts */}
                <div className="flex items-center gap-4">
                    {/* Current Time */}
                    <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-xl font-mono font-semibold">{formatTime(currentTime)}</span>
                    </div>

                    {/* Emergency Alert (4PM) */}
                    {alerts.emergency && !alerts.hardStop && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-urgent/20 border border-urgent rounded-xl animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-urgent" />
                            <span className="text-sm font-medium text-urgent">Emergency Mode!</span>
                        </div>
                    )}

                    {/* Hard Stop Alert (9PM) */}
                    {alerts.hardStop && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-xl">
                            <Moon className="w-5 h-5 text-purple-400" />
                            <span className="text-sm font-medium text-purple-400">พักผ่อนได้แล้ว 🌙</span>
                        </div>
                    )}

                    {/* Stats Toggle */}
                    <button
                        onClick={onToggleStats}
                        className={`p-3 rounded-xl transition-all ${showStats
                                ? 'bg-creative text-white'
                                : 'glass hover:bg-white/10 text-gray-400'
                            }`}
                        title="ดู Kaizen Stats"
                    >
                        <BarChart3 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
