
'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Dice = ({ rotation, position, size = 60, src }: { rotation: number[], position: { top: string, left: string }, size?: number, src: string }) => (
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
                src={src}
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
                    {letter === ' ' ? ' ' : letter}
                </motion.span>
            ))}
        </motion.h2>
    );
};


export const SplashScreen = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    const dicePositions = [
        { src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEja_Ww-z0b9QKTD6qd0mrqCPmptjNeN8o0iaWMTE7tWY29oT5gT2Cxi_Kq_wEfzeydx-vUcBsNnBNGRiQBYnla13ll4BICq8Z8XHL19ByRa0FQ_TfVS6ko0MAaKWKUeCXWRG0MPK7bLXjx3jg-CEZJ5aSNb6_P4EMN6NWcYTwx5j0K2beLUpekvB3sAswk/s1600/84232.png', top: '15%', left: '10%', rotation: [-10, 15, -5], size: 60 },
        { src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjne4OyDxkaEhphfld5Hx79cX_4CsUMBHe6dxxxDmPgma0B2RrLXsuON0Z2HWDlZfn2Sa4tMQ0rGX4EOVG9I5CZl_t7mJoUQE_3VzWD_HfdPmkis2oNJd0ABwdhdOBQXXPZkjPgyMIq2BxtlZI8U54YlD5ljsM6zeUYYmAebH-jcg_FAjCl3bd_013TczA/s1600/84235.png', top: '70%', left: '20%', rotation: [10, -5, 15], size: 40 },
        { src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgelIA3i3cMKeco-tOTR0KjD6ETsiixo6tXgO7aLnXIOOiIwg5WAyG8HmX7eV7FuvDwOvc8q4hfqT3PsohZhzTsWqIn1xssieACQ30-l9IHY-vTsrGsvln5ofWNX0en6dBAa4l3Yh0QGw52bcofzD9GraNaGXojX-u64oiQRjOFeJCTUt9AAjmDSH8bxNA/s1600/84253.png', top: '25%', left: '80%', rotation: [5, -15, 10], size: 50 },
        { src: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhUsfa96yYBwO6uaWPed0sYeF3qBV93rANBKTuoHRKMFpNv-v1en3qWPyj9C6JTgBveNCSqiJSngPXB_7daB-PJtUQOyTWmMFoOpLSd9cO-m2Zq6mgEAUPLh0Z6YEVr8n0sewD1_UX_lOHoFnUpHP9UBoolTwY1d01vpgFnCNg8vMBg9oFN85ll-VO9isw/s1600/84252.png', top: '80%', left: '75%', rotation: [-15, 5, -10], size: 60 },
    ];

    return (
        <AnimatePresence>
            {isReady && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-800 via-red-600 to-red-900 overflow-hidden"
                >
                    <AnimatePresence>
                        {[...Array(20)].map((_, i) => <Particle key={i} i={i} />)}
                    </AnimatePresence>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="relative z-10 flex flex-col items-center justify-center"
                    >
                         {/* Dice Animations */}
                        <AnimatePresence>
                             <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                            >
                                {dicePositions.map((dice, index) => (
                                     <Dice key={index} position={{ top: dice.top, left: dice.left }} rotation={dice.rotation} size={dice.size} src={dice.src} />
                                ))}
                             </motion.div>
                        </AnimatePresence>
                        
                        <div className="animate-bounce-float">
                            <Image
                                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2oNx0s_EsUtQCxkYGCkEqHAcVCA4PAgVdyNX-mDF_KO228qsfmqMAOefbIFmb-yD98WpX7jVLor2AJzeDhfqG6wC8n7lWtxU9euuYIYhPWStqYgbGjkGp6gu1JrfKmXMwCn7I_KjLGu_GlGy3PMNmf9ljC8Yr__ZpsiGxHJRKbtH6MfTuG4ofViNRsAY/s1600/73555.png"
                                alt="SZ Ludo Logo"
                                width={120}
                                height={120}
                                className="drop-shadow-2xl"
                                priority
                            />
                        </div>

                        <h1 className="mt-4 text-4xl md:text-5xl font-black text-white drop-shadow-lg font-headline">
                            SZ Ludo
                        </h1>

                        <div className="mt-2">
                             <TypewriterText text="Luck Meets Skill" delay={0.3} />
                        </div>
                        
                        <div className="mt-12 w-48 text-center space-y-2">
                            <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="absolute top-0 left-0 h-full bg-white rounded-full"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatType: "loop",
                                    }}
                                />
                            </div>
                            <p className="text-sm font-medium text-white/70 animate-glowPulse">
                                Connecting...
                            </p>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
