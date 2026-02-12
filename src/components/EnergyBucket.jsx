import { Play, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import TaskCard from './TaskCard';
import { getBucketConfig } from '../utils/constants';

export default function EnergyBucket({
    bucketId,
    tasks,
    onStartSprint,
    onToggleHighlight,
    onToggleComplete,
    onDelete,
    onUpdateTask,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    isDraggedOver,
    isSprintActive,
    draggingTask
}) {
    const bucket = getBucketConfig(bucketId);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const taskCount = tasks.length;
    const completedCount = tasks.filter(t => t.is_completed).length;

    return (
        <div
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, bucketId)}
            className={`glass rounded-2xl overflow-hidden transition-all duration-300
        ${isDraggedOver ? 'ring-2 ring-white/30 scale-[1.02] bg-white/10' : ''}
        ${isSprintActive ? 'opacity-50 pointer-events-none' : ''}`}
        >
            {/* Header */}
            <div
                className={`p-4 border-b border-white/10 cursor-pointer
          bg-gradient-to-r ${bucket.bgClass}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{bucket.emoji}</span>
                        <div>
                            <h3 className="font-semibold text-white">{bucket.name}</h3>
                            <p className="text-xs text-gray-400">{bucket.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Task Count */}
                        <div className="flex items-center gap-1 text-sm">
                            <span className={bucket.textClass}>{completedCount}/{taskCount}</span>
                        </div>

                        {/* Start Sprint Button */}
                        {bucketId !== 'unsorted' && taskCount > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartSprint(bucketId);
                                }}
                                disabled={isSprintActive}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg 
                  font-medium text-sm transition-all ripple
                  bg-gradient-to-r ${bucketId === 'urgent' ? 'from-urgent to-red-600' :
                                        bucketId === 'deadline' ? 'from-deadline to-amber-600' :
                                            bucketId === 'admin' ? 'from-admin to-blue-600' :
                                                'from-creative to-purple-600'
                                    } text-white
                  hover:scale-110 hover:shadow-lg hover:shadow-${bucketId === 'urgent' ? 'urgent' :
                                        bucketId === 'deadline' ? 'deadline' : bucketId === 'admin' ? 'admin' : 'creative'}/30
                  active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Play className="w-4 h-4" />
                                Sprint
                            </button>
                        )}

                        {/* Collapse Toggle */}
                        {isCollapsed ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                </div>
            </div>

            {/* Tasks List */}
            {!isCollapsed && (
                <div className={`p-3 space-y-2 min-h-[100px] transition-all
          ${taskCount === 0 ? 'flex items-center justify-center' : ''}`}
                >
                    {taskCount === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                            ลาก task มาวางที่นี่ 📥
                        </p>
                    ) : (
                        tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggleHighlight={onToggleHighlight}
                                onToggleComplete={onToggleComplete}
                                onDelete={onDelete}
                                onUpdateTask={onUpdateTask}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                                isDragging={draggingTask?.id === task.id}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
