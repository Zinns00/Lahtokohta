"use client";

import React from 'react';
import styles from './GlitchText.module.css';

interface GlitchTextProps {
    text: string;
    className?: string;
    speed?: number; // Duration in seconds
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "", speed = 0.35 }) => {
    return (
        <div
            className={`${styles.container} ${className}`}
            style={{ '--glitch-duration': `${speed}s`, '--glitch-duration-offset': `${speed + 0.1}s` } as React.CSSProperties}
        >
            <span className="relative z-10">{text}</span>
            <span className={`${styles.layer} ${styles.red}`} aria-hidden="true">
                {text}
            </span>
            <span className={`${styles.layer} ${styles.blue}`} aria-hidden="true">
                {text}
            </span>
        </div>
    );
};

export default GlitchText;
