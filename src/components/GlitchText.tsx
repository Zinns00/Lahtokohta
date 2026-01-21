"use client";

import React from 'react';
import styles from './GlitchText.module.css';

interface GlitchTextProps {
    text: string;
    className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "" }) => {
    return (
        <div className={`${styles.container} ${className}`}>
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
