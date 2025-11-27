import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const penguinVariants = {
    idle: { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 },
    typing: { x: -75, y: 50, scale: 0.6, opacity: 0, rotate: -35 }
};

const penguinTransition = {
    type: 'spring',
    stiffness: 200,
    damping: 18
};

const holeVariants = {
    idle: { scale: 1, y: 0 },
    typing: { scale: 1.08, y: 3 }
};

const rippleAnimate = {
    idle: { scaleX: 1, scaleY: 1, opacity: 0.55 },
    typing: { scaleX: 1.12, scaleY: 0.92, opacity: 0.9 }
};

const splashVariants = {
    hidden: { opacity: 0, scale: 0.6 },
    visible: { opacity: 0.7, scale: 1.15 }
};

const textVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.9 },
    visible: { opacity: 1, y: -12, scale: 1 }
};

const periscopeVariants = {
    hidden: { y: 60, opacity: 0, scale: 0.8 },
    visible: { y: 0, opacity: 1, scale: 1 }
};

const waterGlowVariants = {
    idle: { scale: 1, opacity: 0.25 },
    typing: { scale: 1.3, opacity: 0.65 }
};

const sparkleVariants = {
    idle: { opacity: 0, scale: 0.5 },
    appear: {
        opacity: [0, 1, 0.2, 0],
        scale: [0.5, 1, 1.4, 0.4],
        transition: { duration: 2.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
    }
};

const sidePenguinVariants = {
    hidden: { x: -120, y: 50, opacity: 0 },
    walking: (i) => ({
        x: [-120, -80, -50, -80 + (i * 65)],
        y: [50, 48, 50, 48],
        opacity: [0, 0.3, 1, 1],
        transition: {
            x: { duration: 2.8, delay: i * 0.5, ease: 'easeOut' },
            y: { duration: 0.7, repeat: 4, delay: i * 0.5, ease: 'easeInOut' },
            opacity: { duration: 1.5, delay: i * 0.5, ease: 'easeIn' }
        }
    })
};

const PasswordPeekAnimation = ({ isTyping }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [eyePosition, setEyePosition] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if (!isTyping) {
            const calculateEyePosition = (eyeX, eyeY) => {
                const angle = Math.atan2(mousePosition.y - eyeY, mousePosition.x - eyeX);
                const distance = Math.min(3, Math.hypot(mousePosition.x - eyeX, mousePosition.y - eyeY) / 100);
                return {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance
                };
            };

            // Calculate positions for both eyes
            const svgElement = document.getElementById('tux-svg');
            if (svgElement) {
                const rect = svgElement.getBoundingClientRect();
                const scaleX = rect.width / 160;
                const scaleY = rect.height / 220;

                const leftEyePos = calculateEyePosition(
                    rect.left + (66 * scaleX),
                    rect.top + (56 * scaleY)
                );
                const rightEyePos = calculateEyePosition(
                    rect.left + (94 * scaleX),
                    rect.top + (56 * scaleY)
                );

                setEyePosition({ left: leftEyePos, right: rightEyePos });
            }
        }
    }, [mousePosition, isTyping]);

    return (
        <div className="flex justify-center mb-8" id="character-container">
            <div className="relative w-[500px] h-[320px] flex items-end justify-center">
                {/* Tux the Linux Penguin */}
                <motion.svg
                    id="tux-svg"
                    width="220"
                    height="280"
                    viewBox="0 0 160 220"
                    className="relative z-10 drop-shadow-2xl"
                    style={{ transformOrigin: 'center 40%' }}
                    variants={penguinVariants}
                    initial="idle"
                    animate={isTyping ? 'typing' : 'idle'}
                    transition={penguinTransition}
                >
                    <defs>
                        <radialGradient id="bellyGradient" cx="50%" cy="35%" r="65%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="60%" stopColor="#F8F9FA" />
                            <stop offset="100%" stopColor="#E3E6E8" />
                        </radialGradient>
                        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#2c3e50" />
                            <stop offset="50%" stopColor="#1a252f" />
                            <stop offset="100%" stopColor="#0a0e12" />
                        </linearGradient>
                        <radialGradient id="beakGradient" cx="50%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#FFF176" />
                            <stop offset="50%" stopColor="#FFA726" />
                            <stop offset="100%" stopColor="#FF6F00" />
                        </radialGradient>
                        <radialGradient id="footGradient" cx="40%" cy="30%" r="80%">
                            <stop offset="0%" stopColor="#FFF176" />
                            <stop offset="50%" stopColor="#FFA726" />
                            <stop offset="100%" stopColor="#FF6F00" />
                        </radialGradient>
                        <filter id="shadow">
                            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.35" />
                        </filter>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Ground shadow */}
                    <ellipse cx="80" cy="204" rx="46" ry="12" fill="rgba(0, 0, 0, 0.12)" />

                    {/* Wings/Flippers */}
                    <g>
                        <motion.path
                            d='M 46 85 C 32 88 22 102 20 118 C 20 130 28 142 40 146 C 48 148 56 144 58 136 L 54 95 Z'
                            fill="url(#bodyGradient)"
                            stroke="#000"
                            strokeWidth="1.2"
                            animate={{
                                d: isTyping
                                    ? 'M 46 85 C 32 88 22 102 20 118 C 20 130 28 142 40 146 C 48 148 56 144 58 136 L 54 95 Z'
                                    : [
                                        'M 46 85 C 32 88 22 102 20 118 C 20 130 28 142 40 146 C 48 148 56 144 58 136 L 54 95 Z',
                                        'M 46 85 C 26 86 16 104 16 122 C 18 136 28 148 42 150 C 50 150 58 144 60 136 L 54 95 Z',
                                        'M 46 85 C 32 88 22 102 20 118 C 20 130 28 142 40 146 C 48 148 56 144 58 136 L 54 95 Z'
                                    ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.path
                            d='M 114 85 C 128 88 138 102 140 118 C 140 130 132 142 120 146 C 112 148 104 144 102 136 L 106 95 Z'
                            fill="url(#bodyGradient)"
                            stroke="#000"
                            strokeWidth="1.2"
                            animate={{
                                d: isTyping
                                    ? 'M 114 85 C 128 88 138 102 140 118 C 140 130 132 142 120 146 C 112 148 104 144 102 136 L 106 95 Z'
                                    : [
                                        'M 114 85 C 128 88 138 102 140 118 C 140 130 132 142 120 146 C 112 148 104 144 102 136 L 106 95 Z',
                                        'M 114 85 C 134 86 144 104 144 122 C 142 136 132 148 118 150 C 110 150 102 144 100 136 L 106 95 Z',
                                        'M 114 85 C 128 88 138 102 140 118 C 140 130 132 142 120 146 C 112 148 104 144 102 136 L 106 95 Z'
                                    ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1
                            }}
                        />
                    </g>

                    <motion.g
                        animate={isTyping
                            ? { y: 0 }
                            : { y: [0, -2.5, 0], transition: { duration: 3.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } }}
                    >
                        {/* Main body */}
                        <path
                            d="M 80 25 C 60 25 40 45 36 70 C 32 90 34 110 40 130 C 46 150 54 168 64 182 C 70 190 75 196 80 200 C 85 196 90 190 96 182 C 106 168 114 150 120 130 C 126 110 128 90 124 70 C 120 45 100 25 80 25 Z"
                            fill="url(#bodyGradient)"
                            stroke="#1a252f"
                            strokeWidth="2"
                            filter="url(#shadow)"
                        />

                        {/* Belly */}
                        <path
                            d="M 80 42 C 68 42 58 58 54 78 C 52 92 52 108 56 124 C 60 140 68 156 80 170 C 92 156 100 140 104 124 C 108 108 108 92 106 78 C 102 58 92 42 80 42 Z"
                            fill="url(#bellyGradient)"
                            stroke="#E8EAED"
                            strokeWidth="1.5"
                        />

                        {/* Belly highlight */}
                        <path
                            d="M 68 52 C 62 58 58 70 56 86 C 56 102 60 120 68 136 C 72 144 76 152 80 158"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.8)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            filter="url(#glow)"
                        />
                    </motion.g>

                    {/* Face mask */}
                    <ellipse cx="80" cy="56" rx="26" ry="22" fill="#FFFFFF" />

                    {/* Beak */}
                    <g>
                        <path
                            d="M 80 68 L 68 74 Q 80 78 92 74 Z"
                            fill="url(#beakGradient)"
                            stroke="#E65100"
                            strokeWidth="1.2"
                        />
                        <path
                            d="M 80 68 L 72 72 Q 80 74 88 72 Z"
                            fill="rgba(255, 255, 255, 0.25)"
                            stroke="none"
                        />
                        <path
                            d="M 80 78 Q 74 80 80 84 Q 86 80 80 78 Z"
                            fill="#FFA726"
                            stroke="#E65100"
                            strokeWidth="1"
                        />
                    </g>

                    {/* Eyes */}
                    <motion.g
                        initial={{ opacity: 1 }}
                        animate={{ opacity: isTyping ? 0 : 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ellipse cx="68" cy="54" rx="8" ry="11" fill="#FFFFFF" stroke="#000" strokeWidth="0.8" />
                        <motion.g
                            animate={{
                                x: eyePosition.left.x,
                                y: eyePosition.left.y
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <circle cx="68" cy="56" r="4.5" fill="#000000" />
                            <circle cx="70" cy="54" r="2" fill="#FFFFFF" opacity="0.9" />
                            <circle cx="69" cy="57" r="0.8" fill="#FFFFFF" opacity="0.4" />
                        </motion.g>

                        <ellipse cx="92" cy="54" rx="8" ry="11" fill="#FFFFFF" stroke="#000" strokeWidth="0.8" />
                        <motion.g
                            animate={{
                                x: eyePosition.right.x,
                                y: eyePosition.right.y
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <circle cx="92" cy="56" r="4.5" fill="#000000" />
                            <circle cx="94" cy="54" r="2" fill="#FFFFFF" opacity="0.9" />
                            <circle cx="93" cy="57" r="0.8" fill="#FFFFFF" opacity="0.4" />
                        </motion.g>
                    </motion.g>

                    {/* Closed eyes when typing */}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isTyping ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <path
                            d="M 60 56 Q 68 58 76 56"
                            fill="none"
                            stroke="#000"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 84 56 Q 92 58 100 56"
                            fill="none"
                            stroke="#000"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </motion.g>

                    {/* Feet */}
                    <g>
                        {/* Left foot */}
                        <path
                            d="M 62 178 C 50 180 38 186 36 194 C 35 200 42 208 54 210 C 62 211 70 208 74 202 C 76 198 74 190 68 184 C 66 181 64 179 62 178 Z"
                            fill="url(#footGradient)"
                            stroke="#E65100"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                        {/* Left foot toes */}
                        <path d="M 40 200 L 38 206" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 48 202 L 46 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 56 202 L 56 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                        <path
                            d="M 58 182 C 52 184 46 188 44 192"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        
                        {/* Right foot */}
                        <path
                            d="M 98 178 C 110 180 122 186 124 194 C 125 200 118 208 106 210 C 98 211 90 208 86 202 C 84 198 86 190 92 184 C 94 181 96 179 98 178 Z"
                            fill="url(#footGradient)"
                            stroke="#E65100"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                        {/* Right foot toes */}
                        <path d="M 120 200 L 122 206" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 112 202 L 114 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 104 202 L 104 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                        <path
                            d="M 102 182 C 108 184 114 188 116 192"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </g>
                </motion.svg>

                {/* Ice hole with water */}
                <motion.svg
                    className="absolute bottom-2 -left-16 z-20 pointer-events-none"
                    width="200"
                    height="100"
                    viewBox="0 0 200 100"
                    variants={holeVariants}
                    initial="idle"
                    animate={isTyping ? 'typing' : 'idle'}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                    <defs>
                        <radialGradient id="iceGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="60%" stopColor="#E3F2FD" />
                            <stop offset="100%" stopColor="#BBDEFB" />
                        </radialGradient>
                        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4FC3F7" />
                            <stop offset="100%" stopColor="#0288D1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Ice surface */}
                    <ellipse cx="100" cy="58" rx="95" ry="32" fill="url(#iceGradient)" opacity="0.95" />
                    <ellipse cx="100" cy="56" rx="92" ry="30" fill="#F5FBFF" stroke="#B3E5FC" strokeWidth="2" />
                    
                    {/* Ice cracks and texture */}
                    <path d="M 30 50 Q 40 48 50 50" stroke="#B0BEC5" strokeWidth="1.5" fill="none" opacity="0.6" />
                    <path d="M 150 55 Q 160 53 170 56" stroke="#B0BEC5" strokeWidth="1.5" fill="none" opacity="0.6" />
                    <path d="M 45 62 Q 55 60 65 62" stroke="#90A4AE" strokeWidth="1" fill="none" opacity="0.5" />
                    <path d="M 135 65 Q 145 63 155 66" stroke="#90A4AE" strokeWidth="1" fill="none" opacity="0.5" />
                    
                    {/* Water hole opening */}
                    <ellipse cx="100" cy="58" rx="90" ry="28" fill="url(#waterGradient)" stroke="#0277BD" strokeWidth="2.5" />
                    <motion.ellipse
                        cx="100"
                        cy="62"
                        rx="75"
                        ry="20"
                        fill="#29B6F6"
                        opacity="0.85"
                        animate={isTyping ? rippleAnimate.typing : rippleAnimate.idle}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                    <AnimatePresence>
                        {isTyping && (
                            <motion.ellipse
                                key="splash"
                                cx="100"
                                cy="62"
                                rx="60"
                                ry="15"
                                fill="rgba(255, 255, 255, 0.45)"
                                stroke="rgba(255, 255, 255, 0.8)"
                                strokeWidth="2"
                                variants={splashVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            />
                        )}
                    </AnimatePresence>
                    <motion.ellipse
                        className="pointer-events-none"
                        cx="100"
                        cy="48"
                        rx="40"
                        ry="10"
                        fill="rgba(255, 255, 255, 0.6)"
                        variants={waterGlowVariants}
                        initial="idle"
                        animate={isTyping ? 'typing' : 'idle'}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                    />
                </motion.svg>

                {/* Periscope emerging from the ice hole */}
                <AnimatePresence>
                    {isTyping && (
                        <motion.svg
                            key="periscope"
                            className="absolute bottom-6 left-0 z-30"
                            width="60"
                            height="120"
                            viewBox="0 0 60 120"
                            variants={periscopeVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
                        >
                            {/* Periscope body */}
                            <defs>
                                <linearGradient id="periscopeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#546E7A" />
                                    <stop offset="50%" stopColor="#78909C" />
                                    <stop offset="100%" stopColor="#546E7A" />
                                </linearGradient>
                                <linearGradient id="periscopeWaterFade" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#78909C" stopOpacity="1" />
                                    <stop offset="60%" stopColor="#78909C" stopOpacity="1" />
                                    <stop offset="85%" stopColor="#78909C" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#78909C" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                            
                            {/* Vertical tube - lower part with transparency */}
                            <rect x="24" y="70" width="12" height="30" rx="6" fill="url(#periscopeWaterFade)" stroke="#37474F" strokeWidth="1.5" opacity="0.7" />
                            
                            {/* Vertical tube - upper part solid */}
                            <rect x="24" y="40" width="12" height="35" rx="6" fill="url(#periscopeGradient)" stroke="#37474F" strokeWidth="1.5" />
                            
                            {/* Horizontal top part */}
                            <rect x="26" y="20" width="28" height="10" rx="5" fill="url(#periscopeGradient)" stroke="#37474F" strokeWidth="1.5" />
                            
                            {/* Joint/Elbow */}
                            <circle cx="30" cy="40" r="8" fill="#607D8B" stroke="#37474F" strokeWidth="1.5" />
                            
                            {/* Lens/Eye piece */}
                            <ellipse cx="50" cy="25" rx="8" ry="6" fill="#1E88E5" stroke="#1565C0" strokeWidth="2" />
                            <ellipse cx="50" cy="25" rx="5" ry="4" fill="#64B5F6" />
                            <circle cx="51" cy="24" r="2" fill="#BBDEFB" />
                            
                            {/* Details on tube */}
                            <line x1="24" y1="50" x2="36" y2="50" stroke="#37474F" strokeWidth="1" />
                            <line x1="24" y1="60" x2="36" y2="60" stroke="#37474F" strokeWidth="1" />
                            <line x1="24" y1="80" x2="36" y2="80" stroke="#37474F" strokeWidth="0.8" opacity="0.5" />
                            <line x1="24" y1="90" x2="36" y2="90" stroke="#37474F" strokeWidth="0.6" opacity="0.3" />
                        </motion.svg>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isTyping && (
                        <>
                            <motion.div
                                key="sparkle1"
                                className="absolute bottom-12 left-12 h-2 w-2 rounded-full bg-white"
                                variants={sparkleVariants}
                                initial="idle"
                                animate="appear"
                                exit="idle"
                            />
                            <motion.div
                                key="sparkle2"
                                className="absolute bottom-16 left-20 h-2 w-2 rounded-full bg-sky-300"
                                variants={sparkleVariants}
                                initial="idle"
                                animate="appear"
                                exit="idle"
                            />
                        </>
                    )}
                </AnimatePresence>
                
                {/* Text bubble near periscope */}
                <AnimatePresence>
                    {isTyping && (
                        <motion.div
                            key="hole-text"
                            className="absolute bottom-28 left-12 z-30 rounded-full bg-white/90 px-4 py-2 shadow-lg border border-blue-200 whitespace-nowrap"
                            variants={textVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.5 }}
                        >
                            <span className="text-xs font-semibold text-sky-700">Just checking the ice temp!</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Spectator penguins walking from right */}
                <AnimatePresence>
                    {isTyping && (
                        <>
                            {[0, 1, 2].map((idx) => (
                                <motion.svg
                                    key={`side-penguin-${idx}`}
                                    className="absolute bottom-4 right-0 drop-shadow-2xl z-8"
                                    width="60"
                                    height="80"
                                    viewBox="0 0 160 220"
                                    style={{ transformOrigin: 'center 40%' }}
                                    custom={idx}
                                    variants={sidePenguinVariants}
                                    initial="hidden"
                                    animate="walking"
                                >
                                    <defs>
                                        <radialGradient id={`bellyGrad${idx}`} cx="50%" cy="35%" r="65%">
                                            <stop offset="0%" stopColor="#FFFFFF" />
                                            <stop offset="60%" stopColor="#F8F9FA" />
                                            <stop offset="100%" stopColor="#E3E6E8" />
                                        </radialGradient>
                                        <linearGradient id={`bodyGrad${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#2c3e50" />
                                            <stop offset="50%" stopColor="#1a252f" />
                                            <stop offset="100%" stopColor="#0a0e12" />
                                        </linearGradient>
                                        <radialGradient id={`beakGrad${idx}`} cx="50%" cy="30%" r="70%">
                                            <stop offset="0%" stopColor="#FFF176" />
                                            <stop offset="50%" stopColor="#FFA726" />
                                            <stop offset="100%" stopColor="#FF6F00" />
                                        </radialGradient>
                                        <radialGradient id={`footGrad${idx}`} cx="40%" cy="30%" r="80%">
                                            <stop offset="0%" stopColor="#FFF176" />
                                            <stop offset="50%" stopColor="#FFA726" />
                                            <stop offset="100%" stopColor="#FF6F00" />
                                        </radialGradient>
                                    </defs>

                                    {/* Main body */}
                                    <path
                                        d="M 80 25 C 60 25 40 45 36 70 C 32 90 34 110 40 130 C 46 150 54 168 64 182 C 70 190 75 196 80 200 C 85 196 90 190 96 182 C 106 168 114 150 120 130 C 126 110 128 90 124 70 C 120 45 100 25 80 25 Z"
                                        fill={`url(#bodyGrad${idx})`}
                                        stroke="#1a252f"
                                        strokeWidth="2"
                                    />

                                    {/* Belly */}
                                    <path
                                        d="M 80 42 C 68 42 58 58 54 78 C 52 92 52 108 56 124 C 60 140 68 156 80 170 C 92 156 100 140 104 124 C 108 108 108 92 106 78 C 102 58 92 42 80 42 Z"
                                        fill={`url(#bellyGrad${idx})`}
                                        stroke="#E8EAED"
                                        strokeWidth="1.5"
                                    />

                                    {/* Face mask */}
                                    <ellipse cx="80" cy="56" rx="26" ry="22" fill="#FFFFFF" />

                                    {/* Beak */}
                                    <path
                                        d="M 80 68 L 68 74 Q 80 78 92 74 Z"
                                        fill={`url(#beakGrad${idx})`}
                                        stroke="#E65100"
                                        strokeWidth="1.2"
                                    />
                                    <path
                                        d="M 80 78 Q 74 80 80 84 Q 86 80 80 78 Z"
                                        fill="#FFA726"
                                        stroke="#E65100"
                                        strokeWidth="1"
                                    />

                                    {/* Eyes */}
                                    <ellipse cx="68" cy="54" rx="8" ry="11" fill="#FFFFFF" stroke="#000" strokeWidth="0.8" />
                                    <circle cx="68" cy="56" r="4.5" fill="#000000" />
                                    <circle cx="70" cy="54" r="2" fill="#FFFFFF" opacity="0.9" />

                                    <ellipse cx="92" cy="54" rx="8" ry="11" fill="#FFFFFF" stroke="#000" strokeWidth="0.8" />
                                    <circle cx="92" cy="56" r="4.5" fill="#000000" />
                                    <circle cx="94" cy="54" r="2" fill="#FFFFFF" opacity="0.9" />

                                    {/* Feet */}
                                    <path
                                        d="M 62 178 C 50 180 38 186 36 194 C 35 200 42 208 54 210 C 62 211 70 208 74 202 C 76 198 74 190 68 184 C 66 181 64 179 62 178 Z"
                                        fill={`url(#footGrad${idx})`}
                                        stroke="#E65100"
                                        strokeWidth="1.5"
                                    />
                                    <path d="M 40 200 L 38 206" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M 48 202 L 46 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M 56 202 L 56 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />

                                    <path
                                        d="M 98 178 C 110 180 122 186 124 194 C 125 200 118 208 106 210 C 98 211 90 208 86 202 C 84 198 86 190 92 184 C 94 181 96 179 98 178 Z"
                                        fill={`url(#footGrad${idx})`}
                                        stroke="#E65100"
                                        strokeWidth="1.5"
                                    />
                                    <path d="M 120 200 L 122 206" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M 112 202 L 114 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M 104 202 L 104 210" stroke="#E65100" strokeWidth="2" strokeLinecap="round" />
                                </motion.svg>
                            ))}
                            
                            {/* Text bubble appears above penguins */}
                            <motion.div
                                className="absolute bottom-35 left-300 rounded-xl bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 border-2 border-sky-300 shadow-xl max-w-[200px] z-40"
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 3.8, duration: 0.5, ease: 'backOut' }}
                            >
                                Whoa, he's typing the password! Let's watch!
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PasswordPeekAnimation;
