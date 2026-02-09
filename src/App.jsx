import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BrainDumpZone from './components/BrainDumpZone';
import EnergyBucket from './components/EnergyBucket';
import SprintMode from './components/SprintMode';
import KaizenLogModal from './components/KaizenLogModal';
import LogReview from './components/LogReview';
import GuardRailAlert from './components/GuardRailAlert';
import Celebration, { StreakBadge } from './components/Celebration';
import api from './api';
import { BUCKETS, GUARD_RAILS } from './utils/constants';

export default function App() {
    // State
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sprint state
    const [activeSprint, setActiveSprint] = useState(null);
    const [sprintStartTime, setSprintStartTime] = useState(null);

    // UI state
    const [showKaizenLog, setShowKaizenLog] = useState(false);
    const [pendingKaizenData, setPendingKaizenData] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [draggingTask, setDraggingTask] = useState(null);
    const [draggedOverBucket, setDraggedOverBucket] = useState(null);

    // Guard rails
    const [guardRailAlert, setGuardRailAlert] = useState(null);
    const [alertDismissed, setAlertDismissed] = useState(false);

    // ADHD UX - Celebration & Streak
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationPos, setCelebrationPos] = useState(null);
    const [streak, setStreak] = useState(0);

    // Load data
    useEffect(() => {
        loadTasks();
        checkActiveSprint();
    }, []);

    // Guard rail checker
    useEffect(() => {
        const checkGuardRails = () => {
            if (alertDismissed) return;

            const hour = new Date().getHours();
            const dailyHighlight = tasks.find(t => t.is_daily_highlight && !t.is_completed);

            if (hour >= GUARD_RAILS.HARD_STOP_HOUR) {
                setGuardRailAlert('hardstop');
            } else if (hour >= GUARD_RAILS.EMERGENCY_HOUR && dailyHighlight) {
                setGuardRailAlert('emergency');
            } else {
                setGuardRailAlert(null);
            }
        };

        checkGuardRails();
        const interval = setInterval(checkGuardRails, 60000);
        return () => clearInterval(interval);
    }, [tasks, alertDismissed]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await api.getTasks();
            setTasks(data);
            setError(null);
        } catch (err) {
            setError('Failed to load tasks');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const checkActiveSprint = async () => {
        try {
            const sprint = await api.getActiveSprint();
            if (sprint) {
                setActiveSprint(sprint.bucket);
                setSprintStartTime(new Date(sprint.started_at).getTime());
            }
        } catch (err) {
            console.error('Error checking active sprint:', err);
        }
    };

    // Task handlers
    const handleAddTask = async (title) => {
        try {
            const newTask = await api.createTask(title);
            setTasks(prev => [newTask, ...prev]);
        } catch (err) {
            console.error('Error adding task:', err);
        }
    };

    const handleToggleHighlight = async (taskId) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            const newValue = !task.is_daily_highlight;

            // Update locally first for instant feedback
            setTasks(prev => prev.map(t => ({
                ...t,
                is_daily_highlight: t.id === taskId ? newValue : (newValue ? false : t.is_daily_highlight)
            })));

            await api.updateTask(taskId, { is_daily_highlight: newValue });
        } catch (err) {
            console.error('Error toggling highlight:', err);
            loadTasks(); // Refresh on error
        }
    };

    const handleToggleComplete = async (taskId, event) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            const newValue = !task.is_completed;

            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, is_completed: newValue } : t
            ));

            // Trigger celebration when completing (not uncompleting)
            if (newValue) {
                // Get click position for confetti origin
                const rect = event?.target?.getBoundingClientRect?.();
                if (rect) {
                    setCelebrationPos({ x: rect.left + rect.width / 2, y: rect.top });
                }
                setShowCelebration(true);
                setStreak(prev => prev + 1);
            }

            await api.updateTask(taskId, { is_completed: newValue });
        } catch (err) {
            console.error('Error toggling complete:', err);
            loadTasks();
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            await api.deleteTask(taskId);
        } catch (err) {
            console.error('Error deleting task:', err);
            loadTasks();
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e, task) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(task));
        e.dataTransfer.effectAllowed = 'move';
        // Use setTimeout to avoid state update during event
        setTimeout(() => setDraggingTask(task), 0);
    };

    const handleDragEnd = () => {
        setDraggingTask(null);
        setDraggedOverBucket(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetBucket) => {
        e.preventDefault();
        e.stopPropagation();

        const taskToMove = draggingTask;
        setDraggedOverBucket(null);
        setDraggingTask(null);

        if (!taskToMove || taskToMove.bucket === targetBucket) return;

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskToMove.id ? { ...t, bucket: targetBucket } : t
        ));

        try {
            await api.updateTask(taskToMove.id, { bucket: targetBucket });
        } catch (err) {
            console.error('Error moving task:', err);
            loadTasks(); // Revert on error
        }
    };

    const handleBucketDragOver = (bucketId) => {
        if (draggedOverBucket !== bucketId) {
            setDraggedOverBucket(bucketId);
        }
    };

    // Sprint handlers
    const handleStartSprint = async (bucket) => {
        try {
            const sprint = await api.startSprint(bucket);
            setActiveSprint(bucket);
            setSprintStartTime(new Date(sprint.started_at).getTime());
        } catch (err) {
            console.error('Error starting sprint:', err);
        }
    };

    const handleStopSprint = async (elapsedSeconds) => {
        try {
            await api.stopSprint();
            setPendingKaizenData({
                bucket: activeSprint,
                duration_seconds: elapsedSeconds
            });
            setShowKaizenLog(true);
            setActiveSprint(null);
            setSprintStartTime(null);
        } catch (err) {
            console.error('Error stopping sprint:', err);
        }
    };

    const handleSaveKaizenLog = async (logData) => {
        try {
            await api.createKaizenLog(logData);
            setShowKaizenLog(false);
            setPendingKaizenData(null);
        } catch (err) {
            console.error('Error saving kaizen log:', err);
        }
    };

    const handleCloseKaizenLog = () => {
        setShowKaizenLog(false);
        setPendingKaizenData(null);
    };

    // Group tasks by bucket
    const tasksByBucket = Object.keys(BUCKETS).reduce((acc, bucketId) => {
        acc[bucketId] = tasks.filter(t => t.bucket === bucketId);
        return acc;
    }, {});

    const dailyHighlight = tasks.find(t => t.is_daily_highlight && !t.is_completed);
    const sprintTasks = activeSprint ? tasksByBucket[activeSprint] : [];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-creative border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-strong rounded-2xl p-8 text-center max-w-md">
                    <p className="text-red-400 text-xl mb-4">❌ {error}</p>
                    <p className="text-gray-400 mb-4">ตรวจสอบว่า Backend server กำลังทำงานอยู่</p>
                    <button
                        onClick={loadTasks}
                        className="px-6 py-2 bg-creative rounded-lg text-white font-medium"
                    >
                        ลองใหม่
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <Header
                    onToggleStats={() => setShowStats(!showStats)}
                    showStats={showStats}
                />

                {/* Guard Rail Alerts */}
                {guardRailAlert && (
                    <GuardRailAlert
                        type={guardRailAlert}
                        dailyHighlight={dailyHighlight}
                        onDismiss={() => setAlertDismissed(true)}
                        onFocusHighlight={() => {
                            if (dailyHighlight) {
                                const bucket = dailyHighlight.bucket;
                                if (bucket && bucket !== 'unsorted') {
                                    handleStartSprint(bucket);
                                }
                            }
                        }}
                    />
                )}

                {/* Stats Panel */}
                {showStats && (
                    <div className="mb-6">
                        <LogReview onClose={() => setShowStats(false)} />
                    </div>
                )}

                {/* Brain Dump Zone */}
                <BrainDumpZone
                    onAddTask={handleAddTask}
                    disabled={!!activeSprint}
                />

                {/* Energy Buckets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Object.keys(BUCKETS).map(bucketId => (
                        <EnergyBucket
                            key={bucketId}
                            bucketId={bucketId}
                            tasks={tasksByBucket[bucketId]}
                            onStartSprint={handleStartSprint}
                            onToggleHighlight={handleToggleHighlight}
                            onToggleComplete={handleToggleComplete}
                            onDelete={handleDeleteTask}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => {
                                handleDragOver(e);
                                handleBucketDragOver(bucketId);
                            }}
                            onDrop={handleDrop}
                            isDraggedOver={draggedOverBucket === bucketId}
                            isSprintActive={!!activeSprint}
                            draggingTask={draggingTask}
                        />
                    ))}
                </div>

                {/* Footer */}
                <footer className="mt-8 text-center text-gray-600 text-sm">
                    <p>Kaizen Flow • Follow your energy, respect the guard rails 🧘</p>
                </footer>
            </div>

            {/* Sprint Mode Overlay */}
            {activeSprint && (
                <SprintMode
                    bucket={activeSprint}
                    tasks={sprintTasks}
                    onStopSprint={handleStopSprint}
                    onToggleComplete={handleToggleComplete}
                    onToggleHighlight={handleToggleHighlight}
                    startTime={sprintStartTime}
                />
            )}

            {/* Kaizen Log Modal */}
            {showKaizenLog && pendingKaizenData && (
                <KaizenLogModal
                    bucket={pendingKaizenData.bucket}
                    durationSeconds={pendingKaizenData.duration_seconds}
                    onSave={handleSaveKaizenLog}
                    onClose={handleCloseKaizenLog}
                />
            )}

            {/* Celebration Effects */}
            <Celebration
                show={showCelebration}
                position={celebrationPos}
                onComplete={() => setShowCelebration(false)}
            />

            {/* Streak Badge */}
            {streak >= 2 && (
                <div className="fixed bottom-6 right-6 z-50">
                    <StreakBadge count={streak} />
                </div>
            )}
        </div>
    );
}

