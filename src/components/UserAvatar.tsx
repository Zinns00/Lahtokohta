"use client";

import React from 'react';
import styles from './UserAvatar.module.css';

interface UserAvatarProps {
    src?: string | null;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    width?: number; // Custom override
    height?: number;
    frameId?: string; // e.g., 'Explorer', 'Default'
    className?: string;
    onClick?: () => void;
}

export default function UserAvatar({
    src,
    alt,
    size = 'md',
    width,
    height,
    frameId = 'Default',
    className = '',
    onClick
}: UserAvatarProps) {
    // 1. Resolve Style Class for Frame
    const getFrameOverlayClass = (id: string) => {
        switch (id) {
            case 'Explorer': return styles.frameExplorer;
            case 'Pioneer': return styles.framePioneer;
            case 'Navigator': return styles.frameNavigator;
            case 'Conqueror': return styles.frameConqueror;
            case 'Master': return styles.frameMaster;
            case 'Transcendent': return styles.frameTranscendent;
            case 'Absolute': return styles.frameAbsolute;
            default: return ''; // Default handles itself or no overlay
        }
    };

    // 2. Custom dimensions if provided
    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    const frameOverlayClass = getFrameOverlayClass(frameId);
    const isDefault = frameId === 'Default' || !frameId;

    return (
        <div
            className={`${styles.container} ${styles[size]} ${isDefault ? styles.frameDefault : ''} ${className}`}
            style={style}
            onClick={onClick}
        >
            {/* Avatar Image */}
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className={styles.avatarImage}
                    style={{ width: '100%', height: '100%' }} // Ensure img fills container
                />
            ) : (
                <div
                    className={styles.avatarImage}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: '#3f3f46',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a1a1aa'
                    }}
                >
                    {alt.substring(0, 1).toUpperCase()}
                </div>
            )}

            {/* Frame Overlay (Only if not default/basic) */}
            {frameOverlayClass && (
                <div className={`${styles.frameOverlay} ${frameOverlayClass}`} />
            )}
        </div>
    );
}
