
'use client'

import React, { useEffect, useState } from 'react';

const ConfettiPiece = ({ style }: { style: React.CSSProperties }) => {
    return <div className="confetti-piece" style={style} />;
};

const Confetti = () => {
    const [pieces, setPieces] = useState<React.ReactElement[]>([]);

    useEffect(() => {
        const newPieces = Array.from({ length: 150 }).map((_, i) => {
            const style = {
                left: `${Math.random() * 100}%`,
                top: `${-20 - Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
            };
            return <ConfettiPiece key={i} style={style} />;
        });
        setPieces(newPieces);
    }, []);

    return <div className="confetti-container">{pieces}</div>;
};

export default Confetti;

    