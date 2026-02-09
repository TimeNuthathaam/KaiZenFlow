// Energy Bucket Configuration
export const BUCKETS = {
    unsorted: {
        id: 'unsorted',
        name: 'Brain Dump',
        emoji: '📥',
        color: 'gray',
        description: 'งานที่ยังไม่จัดหมวดหมู่',
        bgClass: 'bg-gray-500/20',
        borderClass: 'border-gray-500',
        textClass: 'text-gray-400'
    },
    urgent: {
        id: 'urgent',
        name: 'Urgent',
        emoji: '🔥',
        color: 'urgent',
        description: 'ไฟลนก้น - ต้องทำวันนี้!',
        bgClass: 'bg-urgent/20',
        borderClass: 'border-urgent',
        textClass: 'text-urgent'
    },
    deadline: {
        id: 'deadline',
        name: 'Deadline',
        emoji: '📅',
        color: 'deadline',
        description: 'กันไว้ก่อน - ใกล้ถึงกำหนด',
        bgClass: 'bg-deadline/20',
        borderClass: 'border-deadline',
        textClass: 'text-deadline'
    },
    admin: {
        id: 'admin',
        name: 'Admin',
        emoji: '📥',
        color: 'admin',
        description: 'น่าเบื่อ - งานบริหาร',
        bgClass: 'bg-admin/20',
        borderClass: 'border-admin',
        textClass: 'text-admin'
    },
    creative: {
        id: 'creative',
        name: 'Creative',
        emoji: '✨',
        color: 'creative',
        description: 'สนุก - งานใช้ไอเดีย',
        bgClass: 'bg-creative/20',
        borderClass: 'border-creative',
        textClass: 'text-creative'
    }
};

// Mood Configuration
export const MOODS = {
    flow: {
        id: 'flow',
        emoji: '🔥',
        label: 'Flow',
        description: 'ลื่นไหลมาก!',
        color: 'from-orange-500 to-red-500'
    },
    okay: {
        id: 'okay',
        emoji: '😐',
        label: 'Okay',
        description: 'ก็ได้อยู่',
        color: 'from-gray-400 to-gray-500'
    },
    drained: {
        id: 'drained',
        emoji: '😫',
        label: 'Drained',
        description: 'หมดแรง',
        color: 'from-indigo-500 to-purple-600'
    }
};

// Guard Rails Configuration
export const GUARD_RAILS = {
    EMERGENCY_HOUR: 16, // 4 PM
    HARD_STOP_HOUR: 21  // 9 PM
};

// Helper functions
export function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getBucketConfig(bucketId) {
    return BUCKETS[bucketId] || BUCKETS.unsorted;
}

export function getMoodConfig(moodId) {
    return MOODS[moodId] || MOODS.okay;
}
