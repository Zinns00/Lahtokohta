"use client";

import { useState, useRef, useEffect } from 'react';
import styles from './ProfileSettingsModal.module.css';
import { FiX, FiCamera, FiLock, FiCheck, FiEdit2, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserLevelInfo, UserTitle } from '@/lib/levelSystem';
import UserAvatar from './UserAvatar';

interface UserData {
    username: string;
    bio?: string;
    image?: string;
    totalXP: number;
    equippedFrame?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: UserData;
    onSuccess: () => void;
}

const FRAMES = [
    { id: 'Default', label: '기본', minLevel: 0 },
    { id: 'Explorer', label: '탐험가', minLevel: 1 },
    { id: 'Pioneer', label: '개척자', minLevel: 20 },
    { id: 'Navigator', label: '항해사', minLevel: 40 },
    { id: 'Conqueror', label: '정복자', minLevel: 60 },
    { id: 'Master', label: '마스터', minLevel: 80 },
    { id: 'Transcendent', label: '초월자', minLevel: 90 },
    { id: 'Absolute', label: '절대자', minLevel: 100 },
];

export default function ProfileSettingsModal({ isOpen, onClose, user, onSuccess }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'THEME' | 'ACCOUNT'>('PROFILE');
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [nickname, setNickname] = useState(user.username);
    const [bio, setBio] = useState(user.bio || '');

    // Image State
    const [previewImage, setPreviewImage] = useState<string | null>(user.image || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Frame State
    const [selectedFrame, setSelectedFrame] = useState<string>(user.equippedFrame || 'Explorer');

    // Calculated Level
    const levelInfo = getUserLevelInfo(user.totalXP);
    const currentLevel = levelInfo.level;

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setNickname(user.username);
            setBio(user.bio || '');
            setPreviewImage(user.image || null);
            setSelectedFile(null);
            setSelectedFrame(user.equippedFrame || 'Explorer');
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalImageUrl = user.image;

            // 1. Upload Image if changed
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch('/api/user/upload-avatar', {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    finalImageUrl = data.url; // /uploads/avatars/filename.jpg
                } else {
                    console.error('Failed to upload image');
                }
            }

            // 2. Update Profile Data
            const updateRes = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: nickname,
                    bio: bio, // Still sending bio in case backend expects it, but empty is fine. Actually user said "remove bio" so maybe clear it? Keeping state but removing UI is safer for now.
                    image: finalImageUrl,
                    equippedFrame: selectedFrame
                })
            });

            if (updateRes.ok) {
                onSuccess();
                onClose();
            } else {
                alert('저장에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to get frame CSS class - No longer needed, UserAvatar handles it
    // const getFrameClass = (frameId: string) => { ... };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.title}>
                        <FiUser style={{ marginRight: 8 }} />
                        프로필 설정
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'PROFILE' ? styles.activeTab : ''} `}
                        onClick={() => setActiveTab('PROFILE')}
                    >
                        기본 정보
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'THEME' ? styles.activeTab : ''} `}
                        onClick={() => setActiveTab('THEME')}
                    >
                        테두리 꾸미기
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'ACCOUNT' ? styles.activeTab : ''} `}
                        onClick={() => setActiveTab('ACCOUNT')}
                    >
                        계정
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {activeTab === 'PROFILE' && (
                        <div className={styles.cardLayout}>
                            {/* Top Status Badges */}
                            <div className={styles.cardHeaderBadges}>
                                <div></div> {/* Empty for spacing */}
                                <div className={styles.rateBadge}>Lv.{currentLevel}</div>
                            </div>

                            {/* Avatar */}
                            <div className={styles.avatarSection}>
                                <div className={styles.avatarPreviewWrapper}>
                                    <div className={styles.previewFrame}>
                                        <UserAvatar
                                            src={previewImage}
                                            alt={nickname}
                                            frameId={selectedFrame}
                                            size="xl" /* 120px equivalent */
                                            width={120}
                                            height={120}
                                        />
                                        <label className={styles.uploadOverlay}>
                                            <FiCamera size={24} color="#fff" />
                                            <input
                                                type="file"
                                                hidden
                                                ref={fileInputRef}
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Identity Inputs */}
                            <div className={styles.identitySection}>
                                <div className={styles.nameInputWrapper}>
                                    <input
                                        className={styles.nameInput}
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        maxLength={20}
                                        placeholder="닉네임"
                                    />
                                    <FiEdit2 className={styles.editIcon} size={16} />
                                </div>
                                <div className={styles.titleTag}>{levelInfo.title}</div>
                            </div>

                            {/* Action Button */}
                            <button
                                className={`${styles.saveBtn} ${isSaving ? styles.saveLoading : ''} `}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? '저장 중...' : '확인'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'THEME' && (
                        <div className={styles.themeForm}>
                            <p className={styles.themeDesc}>
                                달성한 칭호에 따라 특별한 테두리가 해금됩니다.
                            </p>
                            <div className={styles.frameGrid}>
                                {FRAMES.map((frame) => {
                                    const isUnlocked = currentLevel >= frame.minLevel || user.username === 'test';
                                    const isSelected = selectedFrame === frame.id;

                                    return (
                                        <div
                                            key={frame.id}
                                            className={`
                                                ${styles.frameOption} 
                                                ${isUnlocked ? styles.unlockedFrame : ''}
                                                ${isSelected ? styles.selectedFrame : ''}
`}
                                            onClick={() => {
                                                if (isUnlocked) setSelectedFrame(frame.id);
                                            }}
                                        >
                                            <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <UserAvatar
                                                    src={user.image} /* Use current user image or maybe null for preview? Let's use user image for context */
                                                    alt={frame.label}
                                                    frameId={frame.id}
                                                    size="sm"
                                                    width={40}
                                                    height={40}
                                                />
                                            </div>
                                            <span className={styles.frameName}>{frame.label}</span>
                                            {!isUnlocked && <FiLock className={styles.lockIcon} size={12} />}
                                            {isSelected && isUnlocked && <FiCheck size={14} color="#000" style={{ position: 'absolute', top: 5, right: 5 }} />}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Theme Tab Save Button */}
                            <button
                                className={`${styles.saveBtn} ${styles.themeSaveBtn} `}
                                onClick={handleSave}
                            >
                                저장하기
                            </button>
                        </div>
                    )}

                    {activeTab === 'ACCOUNT' && (
                        <div className={styles.accountForm}>
                            <p className={styles.themeDesc}>
                                계정 관련 설정을 관리합니다.
                            </p>

                            <div style={{ marginTop: '2rem', width: '100%' }}>
                                <button
                                    className={styles.logoutBtn}
                                    onClick={async () => {
                                        if (confirm('정말 로그아웃 하시겠습니까?')) {
                                            try {
                                                await fetch('/api/logout', { method: 'POST' });
                                                window.location.href = '/'; // Redirect to home/login
                                            } catch (error) {
                                                console.error('Logout failed', error);
                                                window.location.href = '/'; // Failsafe
                                            }
                                        }
                                    }}
                                >
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
