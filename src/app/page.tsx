"use client";

import { useState } from 'react';
import styles from './page.module.css';
import { FiSearch, FiMenu, FiArrowRight } from "react-icons/fi";
import { FaInstagram, FaTwitter, FaFacebookF, FaYoutube } from "react-icons/fa";
import AuthModal from '@/components/AuthModal';
import { motion, Variants } from 'framer-motion';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const imageVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
};

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('Featured');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <motion.header
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/latokohta_logo.png" alt="Logo" style={{ width: '54px', height: '54px', mixBlendMode: 'multiply' }} />
            Lahtokohta
          </div>
          <nav className={styles.nav}>
            <a href="#" className={styles.navLink}>워크스페이스</a>
            <a href="#" className={styles.navLink}>챌린지</a>
            <a href="#" className={styles.navLink}>커뮤니티</a>
            <a href="#" className={styles.navLink}>소개</a>
          </nav>
          <div className={styles.headerActions}>
            <button className={styles.searchBtn} aria-label="검색">
              <FiSearch />
            </button>
            <motion.button
              className={styles.signInBtn}
              onClick={() => setIsAuthOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              로그인
            </motion.button>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className={styles.hero}>
          <motion.div
            className={styles.heroContent}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 className={styles.heroTitle} variants={fadeInUp}>
              함께 당신의<br />진정한 잠재력을<br />깨우세요
            </motion.h1>
            <motion.p className={styles.heroText} variants={fadeInUp}>
              목표 달성을 몰입감 넘치는 게임으로 만들어보세요. 친구들과 협력하고, 성장을 기록하며, 몰입을 위해 설계된 플랫폼에서 당신의 발전을 시각화하세요.
            </motion.p>
            <motion.button
              className={styles.ctaButton}
              onClick={() => setIsAuthOpen(true)}
              variants={fadeInUp}
              whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(255, 68, 68, 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              여정 시작하기
            </motion.button>
          </motion.div>
          <div className={styles.heroImages}>
            <motion.div
              className={styles.heroImageCard}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
                alt="협업"
                className={styles.heroImage}
              />
            </motion.div>
            <motion.div
              className={styles.heroImageCard}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop"
                alt="몰입"
                className={styles.heroImage}
              />
            </motion.div>
          </div>
        </section>

        {/* Workspaces Section (Originally Top Destinations) */}
        <section className={styles.section}>
          <div className={styles.destinationsHeader}>
            <h2 className={styles.sectionTitle}>인기 목표 템플릿</h2>
            <button className={styles.navLink}>전체 보기</button>
          </div>

          <motion.div
            className={styles.filters}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {['추천', '학습', '건강', '창작', '비즈니스'].map((filter) => (
              <motion.button
                key={filter}
                className={`${styles.filterChip} ${activeFilter === filter ? styles.active : ''}`}
                onClick={() => setActiveFilter(filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter}
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            className={styles.grid}
            style={{ marginTop: '2rem' }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              { title: '미라클 모닝', desc: '강력한 아침 루틴 만들기', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800' },
              { title: '딥워크 스프린트', desc: '4시간 집중 코딩', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800' },
              { title: '독서 챌린지', desc: '올해 책 50권 읽기', img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800' },
              { title: '운동 스트릭', desc: '30일 연속 움직이기', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800' }
            ].map((item, i) => (
              <motion.div
                key={i}
                className={styles.card}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className={styles.cardImageWrapper}>
                  <motion.img
                    src={item.img}
                    alt={item.title}
                    className={styles.cardImage}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardSubtitle}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Success Stories (Originally Stories) */}
        <section className={styles.section}>
          <div className={styles.destinationsHeader}>
            <h2 className={styles.sectionTitle}>성공 사례</h2>
            <button className={styles.navLink}>더 읽어보기</button>
          </div>

          <div className={styles.storiesGrid}>
            <motion.div
              className={styles.featuredStory}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.storyImageWrapper} style={{ aspectRatio: '4/3' }}>
                <motion.img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200"
                  alt="팀 성공"
                  className={styles.cardImage}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div>
                <span className={styles.cardSubtitle}>커뮤니티</span>
                <h3 className={styles.storyTitle} style={{ marginTop: '0.5rem' }}>
                  개발자 5명이 Lahtokohta를 통해 30일 만에 꿈의 제품을 출시한 방법
                </h3>
              </div>
            </motion.div>

            <motion.div
              className={styles.storyList}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {[
                { title: '게이미피케이션의 과학: 왜 목표 달성에 효과적인가?', cat: '방법론', img: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=200' },
                { title: '미루는 습관에서 몰입의 경지까지: 사용자 여정', cat: '생산성', img: 'https://images.unsplash.com/photo-1456406111435-d0cfe4755f9e?q=80&w=200' },
                { title: 'XP 시스템과 보상 이해하기', cat: '가이드', img: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=200' }
              ].map((story, i) => (
                <motion.div
                  key={i}
                  className={styles.storyItem}
                  variants={fadeInUp}
                  whileHover={{ x: 5 }}
                >
                  <img src={story.img} alt={story.title} className={styles.storyItemImage} />
                  <div>
                    <span className={styles.cardSubtitle} style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{story.cat}</span>
                    <h4 className={styles.cardTitle} style={{ fontSize: '1rem', lineHeight: '1.4' }}>{story.title}</h4>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Newsletter */}
        <section className={styles.newsletter}>
          <motion.div
            className={styles.container}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.newsletterTitle}>커뮤니티 소식 받아보기</h2>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="이메일 주소를 입력하세요" className={styles.input} />
              <button className={styles.submitBtn}>구독하기</button>
            </form>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerGrid}>
              <div className={styles.footerCol}>
                <div className={styles.logo} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/latokohta_logo.png" alt="Logo" style={{ width: '54px', height: '54px', mixBlendMode: 'multiply' }} />
                  Lahtokohta
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <FaFacebookF /> <FaInstagram /> <FaTwitter /> <FaYoutube />
                </div>
              </div>
              <div className={styles.footerCol}>
                <h4>플랫폼</h4>
                <a href="#" className={styles.footerLink}>기능</a>
                <a href="#" className={styles.footerLink}>요금제</a>
                <a href="#" className={styles.footerLink}>엔터프라이즈</a>
              </div>
              <div className={styles.footerCol}>
                <h4>리소스</h4>
                <a href="#" className={styles.footerLink}>블로그</a>
                <a href="#" className={styles.footerLink}>커뮤니티</a>
                <a href="#" className={styles.footerLink}>고객센터</a>
              </div>
              <div className={styles.footerCol}>
                <h4>회사</h4>
                <a href="#" className={styles.footerLink}>소개</a>
                <a href="#" className={styles.footerLink}>채용</a>
                <a href="#" className={styles.footerLink}>문의하기</a>
              </div>
              <div className={styles.footerCol}>
                <h4>법적 고지</h4>
                <a href="#" className={styles.footerLink}>개인정보처리방침</a>
                <a href="#" className={styles.footerLink}>이용약관</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Authentication */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      </div>
    </main>
  );
}
