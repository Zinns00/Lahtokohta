"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { FiLogOut } from 'react-icons/fi';
import styles from './LogoutModal.module.css';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    if (!isOpen) return null;

    // Use portal to render at root level, ensuring it sits on top of everything
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.iconWrapper}>
                    <FiLogOut />
                </div>
                <h2 className={styles.title}>로그아웃 하시겠습니까?</h2>
                <p className={styles.description}>
                    언제든지 다시 돌아오실 수 있습니다.<br />
                    오늘의 여정을 여기서 마치시겠습니까?
                </p>

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        취소
                    </button>
                    <button className={styles.confirmBtn} onClick={onConfirm}>
                        로그아웃
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
