
'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

export type FestivalType = 'None' | 'Generic' | 'Holi' | 'Diwali' | 'Eid' | 'Christmas' | 'IndependenceDay';

interface FestiveDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  type?: FestivalType;
  message?: string;
}

const festivalConfig = {
  Holi: {
    bg: 'bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400',
    textColor: 'text-white',
    animation: 'holi',
  },
  Diwali: {
    bg: 'bg-gradient-to-br from-yellow-800 via-gray-900 to-black',
    textColor: 'text-yellow-300',
    animation: 'diwali',
  },
  Eid: {
    bg: 'bg-gradient-to-br from-teal-800 via-gray-900 to-green-800',
    textColor: 'text-white',
    animation: 'eid',
  },
  Christmas: {
    bg: 'bg-gradient-to-br from-red-800 via-green-900 to-red-900',
    textColor: 'text-white',
    animation: 'christmas',
  },
  IndependenceDay: {
    bg: 'bg-gradient-to-b from-orange-500/50 via-white/50 to-green-600/50',
    textColor: 'text-blue-900',
    animation: 'independence',
  },
  Generic: {
    bg: 'bg-gradient-to-br from-blue-500 to-purple-600',
    textColor: 'text-white',
    animation: 'generic',
  },
  None: {
    bg: 'bg-gradient-to-br from-gray-700 to-gray-900',
    textColor: 'text-white',
    animation: 'none',
  },
};

const HoliAnimation = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1.5, 0],
          x: `${Math.random() * 100}vw`,
          y: `${Math.random() * 100}vh`,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: 'easeInOut',
        }}
        style={{
          width: `${20 + Math.random() * 60}px`,
          height: `${20 + Math.random() * 60}px`,
          background: `radial-gradient(circle, hsla(${Math.random() * 360}, 100%, 70%, 0.8), transparent 70%)`,
        }}
      />
    ))}
  </div>
);

const DiwaliAnimation = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-yellow-400"
        initial={{ y: '110%', opacity: 0 }}
        animate={{ y: '-10%', opacity: [0, 1, 0] }}
        transition={{
          duration: 3 + Math.random() * 3,
          repeat: Infinity,
          delay: i * 0.3,
        }}
        style={{
          left: `${Math.random() * 100}%`,
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          boxShadow: '0 0 10px 2px #fef08a',
        }}
      />
    ))}
    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
  </div>
);

const EidAnimation = () => (
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      className="absolute text-yellow-300 opacity-20"
      initial={{ y: 50, x: '-50%', opacity: 0 }}
      animate={{ y: 0, opacity: 0.2 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{ top: '10%', left: '50%', fontSize: '10rem' }}
    >
      🌙
    </motion.div>
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{
          duration: 2 + Math.random() * 4,
          repeat: Infinity,
          delay: i * 0.2,
        }}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${1 + Math.random() * 2}px`,
          height: `${1 + Math.random() * 2}px`,
        }}
      />
    ))}
  </div>
);

const ChristmasAnimation = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        initial={{ y: '-10%', opacity: 0 }}
        animate={{ y: '110%', opacity: [0, 1, 0] }}
        transition={{
          duration: 4 + Math.random() * 6,
          repeat: Infinity,
          delay: i * 0.1,
          ease: 'linear',
        }}
        style={{
          left: `${Math.random() * 100}%`,
          width: `${2 + Math.random() * 4}px`,
          height: `${2 + Math.random() * 4}px`,
        }}
      />
    ))}
  </div>
);

const Balloon = ({ id, color, onBlast }: { id: any; color: string; onBlast: (id: any) => void; }) => {
    const [isBlasted, setIsBlasted] = useState(false);
    const initialX = Math.random() * 100;
    const duration = 8 + Math.random() * 8;
    const delay = Math.random() * 5;
    const sway = (Math.random() - 0.5) * 200;

    const handleBlast = () => {
        if (isBlasted) return;
        setIsBlasted(true);
        setTimeout(() => onBlast(id), 300); // Allow blast animation to play
    };

    return (
        <motion.div
            className="absolute bottom-[-100px] cursor-pointer"
            style={{
                width: `${40 + Math.random() * 20}px`,
                height: `${50 + Math.random() * 25}px`,
                background: color,
                clipPath: 'ellipse(35% 50% at 50% 50%)',
                left: `${initialX}%`,
            }}
            initial={{ y: 0, x: 0 }}
            animate={isBlasted ? { scale: 1.5, opacity: 0 } : { y: '-120vh', x: sway }}
            transition={isBlasted ? 
                { duration: 0.3, ease: 'easeOut' } : 
                { duration: duration, delay: delay, ease: 'linear' }
            }
            onClick={handleBlast}
        />
    );
};

const IndependenceDayAnimation = () => {
    const [balloons, setBalloons] = useState<any[]>([]);
    const balloonColors = ['#FF9933', '#FFFFFF', '#138808'];

    useEffect(() => {
        const createBalloon = () => ({ id: Date.now() + Math.random(), color: balloonColors[Math.floor(Math.random() * balloonColors.length)] });
        const initialBalloons = Array.from({ length: 20 }, createBalloon);
        setBalloons(initialBalloons);
    }, []);

    const handleBlast = (id: any) => {
        setBalloons(prev => prev.filter(b => b.id !== id));
        // Add a new balloon to replace the blasted one
        const newBalloon = { id: Date.now() + Math.random(), color: balloonColors[Math.floor(Math.random() * balloonColors.length)] };
        setTimeout(() => {
            setBalloons(prev => [...prev, newBalloon]);
        }, 500);
    };

    return (
        <div className="absolute inset-0 overflow-hidden">
            {balloons.map((b) => (
                <Balloon
                    key={b.id}
                    id={b.id}
                    color={b.color}
                    onBlast={handleBlast}
                />
            ))}
        </div>
    );
};


const AnimationComponent = ({ type }: { type: FestivalType }) => {
  switch (type) {
    case 'Holi': return <HoliAnimation />;
    case 'Diwali': return <DiwaliAnimation />;
    case 'Eid': return <EidAnimation />;
    case 'Christmas': return <ChristmasAnimation />;
    case 'IndependenceDay': return <IndependenceDayAnimation />;
    default: return null;
  }
};


export function FestiveDialog({
  isOpen,
  setIsOpen,
  type = 'Generic',
  message,
}: FestiveDialogProps) {

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, setIsOpen]);

  const config = festivalConfig[type] || festivalConfig.Generic;

  return (
    <AnimatePresence>
        {isOpen && (
             <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md text-center p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-transparent">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.5, ease: 'backOut' }}
                        className={`relative w-full aspect-square md:aspect-video flex items-center justify-center p-8 ${config.bg}`}
                    >
                        <AnimationComponent type={type} />
                        <div className="relative z-10 space-y-4">
                            <h2 className={`text-4xl md:text-6xl font-bold drop-shadow-lg font-headline ${config.textColor}`}>
                                {message || `Happy ${type}!`}
                            </h2>
                        </div>
                    </motion.div>
                </DialogContent>
            </Dialog>
        )}
    </AnimatePresence>
  );
}


export function FestiveBackground({ type }: { type: FestivalType }) {
    if (!type || type === 'None') return null;
    const config = festivalConfig[type] || festivalConfig.Generic;

    return (
        <div className={`fixed inset-0 w-full h-full z-0 pointer-events-auto ${config.bg}`}>
            <AnimationComponent type={type} />
        </div>
    )
}
