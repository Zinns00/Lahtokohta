"use client";

import { useState } from 'react';
import styles from './page.module.css';
import { FiSearch, FiMenu, FiArrowRight } from "react-icons/fi";
import { FaInstagram, FaTwitter, FaFacebookF, FaYoutube } from "react-icons/fa";
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('Featured');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>Lahtokohta</div>
          <nav className={styles.nav}>
            <a href="#" className={styles.navLink}>Workspaces</a>
            <a href="#" className={styles.navLink}>Challenges</a>
            <a href="#" className={styles.navLink}>Community</a>
            <a href="#" className={styles.navLink}>About</a>
          </nav>
          <div className={styles.headerActions}>
            <button className={styles.searchBtn} aria-label="Search">
              <FiSearch />
            </button>
            <button
              className={styles.signInBtn}
              onClick={() => setIsAuthOpen(true)}
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Unlock Your<br />True Potential<br />Together
            </h1>
            <p className={styles.heroText}>
              Turn your goals into an immersive game. Track progress, collaborate with friends, and visualize your growth in a platform designed for deep focus and achievement.
            </p>
            <button
              className={styles.ctaButton}
              onClick={() => setIsAuthOpen(true)}
            >
              Start Your Journey
            </button>
          </div>
          <div className={styles.heroImages}>
            <div className={styles.heroImageCard}>
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
                alt="Collaboration"
                className={styles.heroImage}
              />
            </div>
            <div className={styles.heroImageCard}>
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop"
                alt="Focus"
                className={styles.heroImage}
              />
            </div>
          </div>
        </section>

        {/* Workspaces Section (Originally Top Destinations) */}
        <section className={styles.section}>
          <div className={styles.destinationsHeader}>
            <h2 className={styles.sectionTitle}>Popular Goal Templates</h2>
            <button className={styles.navLink}>Browse all templates</button>
          </div>

          <div className={styles.filters}>
            {['Featured', 'Study', 'Health', 'Creative', 'Business'].map((filter) => (
              <button
                key={filter}
                className={`${styles.filterChip} ${activeFilter === filter ? styles.active : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className={styles.grid} style={{ marginTop: '2rem' }}>
            {[
              { title: 'Morning Miracle', desc: 'Build a powerful morning routine', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800' },
              { title: 'Deep Work Sprite', desc: '4 Hours of focused coding', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800' },
              { title: 'Reading Challenge', desc: 'Read 50 books this year', img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800' },
              { title: 'Fitness Streak', desc: '30 Days of movement', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800' }
            ].map((item, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardImageWrapper}>
                  <img src={item.img} alt={item.title} className={styles.cardImage} />
                </div>
                <div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardSubtitle}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Success Stories (Originally Stories) */}
        <section className={styles.section}>
          <div className={styles.destinationsHeader}>
            <h2 className={styles.sectionTitle}>Success Stories</h2>
            <button className={styles.navLink}>Read more</button>
          </div>

          <div className={styles.storiesGrid}>
            <div className={styles.featuredStory}>
              <div className={styles.storyImageWrapper} style={{ aspectRatio: '4/3' }}>
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200"
                  alt="Team Success"
                  className={styles.cardImage}
                />
              </div>
              <div>
                <span className={styles.cardSubtitle}>Community</span>
                <h3 className={styles.storyTitle} style={{ marginTop: '0.5rem' }}>
                  How a group of 5 developers shipped their dream product in 30 days using Lahtokohta
                </h3>
              </div>
            </div>

            <div className={styles.storyList}>
              {[
                { title: 'The Science of Gamification: Why it works for goals', cat: 'Methodology', img: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=200' },
                { title: 'From Procrastination to Flow: A User Journey', cat: 'Productivity', img: 'https://images.unsplash.com/photo-1456406111435-d0cfe4755f9e?q=80&w=200' },
                { title: 'Understanding the XP System and Rewards', cat: 'Guide', img: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?q=80&w=200' }
              ].map((story, i) => (
                <div key={i} className={styles.storyItem}>
                  <img src={story.img} alt={story.title} className={styles.storyItemImage} />
                  <div>
                    <span className={styles.cardSubtitle} style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{story.cat}</span>
                    <h4 className={styles.cardTitle} style={{ fontSize: '1rem', lineHeight: '1.4' }}>{story.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className={styles.newsletter}>
          <div className={styles.container}>
            <h2 className={styles.newsletterTitle}>Join Our Community Digest</h2>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" className={styles.input} />
              <button className={styles.submitBtn}>Subscribe</button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerGrid}>
              <div className={styles.footerCol}>
                <div className={styles.logo} style={{ marginBottom: '1.5rem' }}>Lahtokohta</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <FaFacebookF /> <FaInstagram /> <FaTwitter /> <FaYoutube />
                </div>
              </div>
              <div className={styles.footerCol}>
                <h4>Platform</h4>
                <a href="#" className={styles.footerLink}>Features</a>
                <a href="#" className={styles.footerLink}>Pricing</a>
                <a href="#" className={styles.footerLink}>Enterprise</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Resources</h4>
                <a href="#" className={styles.footerLink}>Blog</a>
                <a href="#" className={styles.footerLink}>Community</a>
                <a href="#" className={styles.footerLink}>Help Center</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Company</h4>
                <a href="#" className={styles.footerLink}>About</a>
                <a href="#" className={styles.footerLink}>Careers</a>
                <a href="#" className={styles.footerLink}>Contact</a>
              </div>
              <div className={styles.footerCol}>
                <h4>Legal</h4>
                <a href="#" className={styles.footerLink}>Privacy</a>
                <a href="#" className={styles.footerLink}>Terms</a>
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
