
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedBanner = ({ text }: { text: string }) => {
  const messages = useMemo(() => text.split('\n').filter(line => line.trim() !== ''), [text]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000); // Change message every 4 seconds

    return () => clearInterval(timer);
  }, [messages.length]);

  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white text-center py-2 text-sm font-semibold overflow-hidden relative h-8 flex items-center justify-center">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute"
        >
          {messages[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedBanner;

    