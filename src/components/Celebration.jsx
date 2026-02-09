import { useEffect, useState } from 'react';

const CONFETTI_COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#95E1D3', // Mint
    '#F38181', // Coral
    '#AA96DA', // Purple
    '#A8E6CF', // Green
    '#FF8B94', // Pink
];

const ENCOURAGEMENTS = [
    '🎉 เก่งมาก!',
    '🔥 ไฟแรง!',
    '⚡ ปังปุริเย่!',
    '💪 สุดยอด!',
    '🌟 น่าทึ่ง!',
    '🚀 ไปต่อ!',
    '✨ ว้าว!',
    '💫 เยี่ยม!',
];

function Confetti({ x, y }) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: x || window.innerWidth / 2,
            y: y || window.innerHeight / 2,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            size: Math.random() * 10 + 5,
            angle: (Math.random() * 360) * (Math.PI / 180),
            velocity: Math.random() * 15 + 10,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 20,
        }));
        setParticles(newParticles);
    }, [x, y]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute animate-confetti"
                    style={{
                        left: p.x,
                        top: p.y,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        '--tx': `${Math.cos(p.angle) * p.velocity * 20}px`,
                        '--ty': `${Math.sin(p.angle) * p.velocity * 20 - 100}px`,
                        '--r': `${p.rotation + p.rotationSpeed * 20}deg`,
                    }}
                />
            ))}
        </div>
    );
}

function FloatingText({ text, x, y }) {
    return (
        <div
            className="fixed pointer-events-none z-[101] animate-float-up text-2xl font-bold"
            style={{ left: x || '50%', top: y || '50%', transform: 'translate(-50%, -50%)' }}
        >
            {text}
        </div>
    );
}

export default function Celebration({ show, position, onComplete }) {
    const [encouragement, setEncouragement] = useState('');

    useEffect(() => {
        if (show) {
            setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
            const timer = setTimeout(() => {
                onComplete?.();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show) return null;

    return (
        <>
            <Confetti x={position?.x} y={position?.y} />
            <FloatingText text={encouragement} x={position?.x} y={position?.y} />
        </>
    );
}

// Streak component
export function StreakBadge({ count }) {
    if (count < 2) return null;

    const getStreakEmoji = () => {
        if (count >= 10) return '🏆';
        if (count >= 7) return '💎';
        if (count >= 5) return '⚡';
        if (count >= 3) return '🔥';
        return '✨';
    };

    return (
        <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-full
            bg-gradient-to-r from-orange-500/20 to-red-500/20
            border border-orange-500/30
            animate-bounce-subtle
        `}>
            <span className="text-lg">{getStreakEmoji()}</span>
            <span className="font-bold text-orange-400">{count} streak!</span>
        </div>
    );
}
