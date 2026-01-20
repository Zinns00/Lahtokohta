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
            <span style={{ position: 'relative', zIndex: 10 }}>{text}</span>
            <span className={`${styles.layer} ${styles.red}`}>
                {text}
            </span>
            <span className={`${styles.layer} ${styles.blue}`}>
                {text}
            </span>
        </div>
    );
};

export default GlitchText;
