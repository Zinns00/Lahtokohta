"use client";

import { useState } from 'react';
import styles from './page.module.css';
import AuthModal from '@/components/AuthModal';
import GlitchText from '@/components/GlitchText';
import { motion } from 'framer-motion';
import { FiStar } from "react-icons/fi";
import { BsLightningChargeFill } from "react-icons/bs";
import { TbCross } from "react-icons/tb";

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <main className={styles.main}>
      <div className={styles.drainPattern} />
      <div className={styles.noiseOverlay} />

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            Lähtökohta
          </div>
          <button
            className={styles.loginBtn}
            onClick={() => setIsAuthOpen(true)}
          >
            LOGIN
          </button>
        </header>

        {/* Hero Section */}
        <section className={styles.hero}>
          {/* Floating Icons */}
          <TbCross className={styles.floatingIcon} style={{ top: '20%', left: '10%', fontSize: '2rem' }} />
          <FiStar className={styles.floatingIcon} style={{ top: '30%', right: '15%', fontSize: '1.5rem', animationDelay: '1s' }} />
          <BsLightningChargeFill className={styles.floatingIcon} style={{ bottom: '20%', left: '20%', fontSize: '2rem', animationDelay: '2s' }} />

          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'circOut' }}
          >
            <h1 className={styles.heroTitle}>
              <GlitchText text="학습" />
              <span className={styles.separator}>//</span>
              <GlitchText text="몰입" />
              <span className={styles.separator}>//</span>
              <GlitchText text="창작" />
            </h1>

            <motion.button
              className={styles.startBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAuthOpen(true)}
            >
              시작하기
            </motion.button>
          </motion.div>
        </section>

        {/* Pipes (Cards) Section */}
        <section className={styles.pipesSection}>
          <motion.div
            className={styles.pipesGrid}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.2 }}
          >
            {[
              { title: 'MILESTONE_01', desc: 'Objective Setting Protocol', img: 'https://i.pinimg.com/736x/14/12/73/1412738f27d6e26554af9a9ab75a93f9.jpg' },
              { title: 'MILESTONE_02', desc: 'Deep Focus Chamber', img: 'https://i.pinimg.com/736x/4b/10/ae/4b10ae1b2a49596521d3303cd5f340d2.jpg' },
              { title: 'MILESTONE_03', desc: 'Creative Output Stream', img: 'https://i.pinimg.com/1200x/3c/c6/57/3cc657139d92dc4d0c5eb3da30a850ba.jpg' }
            ].map((item, i) => (
              <motion.div
                key={i}
                className={styles.chromeCard}
                whileHover={{ y: -5 }}
              >
                <div className={styles.cardImageWrapper}>
                  <img src={item.img} alt={item.title} className={styles.cardImage} />
                </div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </main>
  );
}
