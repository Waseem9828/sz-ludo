
'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const Dice = ({ rotation, position, size = 60 }: { rotation: number[], position: { top: string, left: string }, size?: number }) => (
    <motion.div
        className="absolute"
        style={{ top: position.top, left: position.left }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
        <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: rotation }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
        >
            <Image
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhoK-LpU_pXajSUbNq9sYfO8jSln-vL8sB7y_8PnaQ9UvjGDF3-rR9d3jG8Y0y0nU-jP5_x_O3nC-ZJ3H1J6d2_A9J0b-Z0A_Z0C_Z0D_Z0E_Z0F_Z0G/s1600/dice.png"
                alt="Ludo Dice"
                width={size}
                height={size}
                className="drop-shadow-lg"
                data-ai-hint="ludo dice"
            />
        </motion.div>
    </motion.div>
);

const Particle = ({ i }: { i: number }) => (
    <motion.div
        className="absolute rounded-full bg-white/50"
        initial={{ opacity: 0, scale: 0, x: Math.random() * 100 + 'vw', y: Math.random() * 100 + 'vh' }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
        transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
        }}
        style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
        }}
    />
);


const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const letters = Array.from(text);
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: i * delay },
        }),
    };
    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <motion.h2
            className="text-lg md:text-xl font-semibold text-white/90 tracking-wider"
            variants={container}
            initial="hidden"
            animate="visible"
        >
            {letters.map((letter, index) => (
                <motion.span key={index} variants={child}>
                    {letter === ' ' ? '\u00A0' : letter}
                </motion.span>
            ))}
        </motion.h2>
    );
};


export const SplashScreen = () => {
    const dicePositions = [
        { top: '15%', left: '10%', rotation: [-10, 15, -5], size: 60 },
        { top: '70%', left: '20%', rotation: [10, -5, 15], size: 40 },
        { top: '25%', left: '80%', rotation: [5, -15, 10], size: 50 },
        { top: '80%', left: '75%', rotation: [-15, 5, -10], size: 60 },
    ];

    return (
        <div className="relative flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-800 via-red-600 to-red-900 overflow-hidden">
             <AnimatePresence>
                {[...Array(20)].map((_, i) => <Particle key={i} i={i} />)}
            </AnimatePresence>
            
            <div className="relative z-10 flex flex-col items-center justify-center">
                 {/* Dice Animations */}
                <AnimatePresence>
                    {dicePositions.map((dice, index) => (
                         <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                        >
                            <Dice position={{ top: dice.top, left: dice.left }} rotation={dice.rotation} size={dice.size} />
                         </motion.div>
                    ))}
                </AnimatePresence>
                
                <motion.div
                     initial={{ opacity: 0, scale: 0.5 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{
                         duration: 0.8,
                         delay: 0.2,
                         ease: [0, 0.71, 0.2, 1.01]
                     }}
                     className="animate-bounce-float"
                >
                    <Image
                        src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png"
                        alt="SZ LUDO Logo"
                        width={120}
                        height={120}
                        className="drop-shadow-2xl"
                        priority
                    />
                </motion.div>

                <motion.h1 
                    className="mt-4 text-4xl md:text-5xl font-black text-white drop-shadow-lg font-headline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    SZ LUDO
                </motion.h1>

                <div className="mt-2">
                     <TypewriterText text="Luck Meets Skill" delay={0.8} />
                </div>
                
                <motion.p 
                    className="mt-12 text-sm font-medium text-white/70 animate-glowPulse"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                >
                    Loading...
                </motion.p>
            </div>
        </div>
    );
};
