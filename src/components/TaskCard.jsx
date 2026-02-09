import { Star, Trash2, Check, GripVertical } from 'lucide-react';
import { getBucketConfig } from '../utils/constants';

export default function TaskCard({
    task,
    onToggleHighlight,
    onToggleComplete,
    onDelete,
    onDragStart,
    onDragEnd,
    isDragging
}) {
    const bucket = getBucketConfig(task.bucket);

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', task.id.toString());
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(e, task);
    };

    return (
        <div
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            className={`group glass rounded-xl p-3 cursor-grab active:cursor-grabbing
        transition-all duration-200 animate-slide-up select-none
        hover:bg-white/10 hover:scale-[1.02]
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${task.is_completed ? 'opacity-60' : ''}`}
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="mt-1 opacity-0 group-hover:opacity-50 transition-opacity">
                    <GripVertical className="w-4 h-4 text-gray-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`font-medium break-words ${task.is_completed ? 'line-through text-gray-500' : 'text-white'
                        }`}>
                        {task.title}
                    </p>

                    {task.is_daily_highlight && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-yellow-400">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            Daily Highlight
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Star / Daily Highlight */}
                    <button
                        onClick={() => onToggleHighlight(task.id)}
                        className={`p-2 rounded-lg transition-all ${task.is_daily_highlight
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'hover:bg-white/10 text-gray-500 hover:text-yellow-400'
                            }`}
                        title={task.is_daily_highlight ? 'เอาออกจาก Daily Highlight' : 'ตั้งเป็น Daily Highlight'}
                    >
                        <Star className={`w-4 h-4 ${task.is_daily_highlight ? 'fill-yellow-400' : ''}`} />
                    </button>

                    {/* Complete */}
                    <button
                        onClick={(e) => onToggleComplete(task.id, e)}
                        className={`p-2 rounded-lg transition-all ripple ${task.is_completed
                            ? 'bg-green-500/20 text-green-400 glow-success'
                            : 'hover:bg-white/10 text-gray-500 hover:text-green-400'
                            }`}
                        title={task.is_completed ? 'ยังไม่เสร็จ' : 'เสร็จแล้ว'}
                    >
                        <Check className={`w-4 h-4 ${task.is_completed ? 'stroke-[3]' : ''}`} />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                        title="ลบ"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
