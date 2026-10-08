import React from 'react';
import { useAuth } from '../context';
import './AboutUs.css';

const AboutUs = ({ onNavigate, onOpenLogin }) => {
  const { isAuthenticated } = useAuth();

  const handleShopClick = () => {
    if (isAuthenticated) {
      onNavigate('home');
    } else {
      onOpenLogin?.(false);
    }
  };

  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <div className="about-hero-badge"><span /> Everyday groceries, made easy</div>
          <h1 className="about-hero-title">
            A little fresher.<br />
            <span className="highlight-green">A lot more convenient.</span>
          </h1>
          <p className="about-hero-subtitle">
            Your neighborhood grocery list, all in one place. Find everyday essentials,
            build your basket, and keep your shopping simple.
          </p>
          <div className="about-hero-actions">
            <button className="about-btn-primary" onClick={handleShopClick}>
              Browse groceries <span aria-hidden="true">→</span>
            </button>
            <button className="about-btn-secondary" onClick={() => onNavigate('contact')}>
              Talk to our team
            </button>
          </div>
          <div className="about-hero-note">
            <span className="about-note-check">✓</span>
            Your cart, wishlist and orders stay with your account
          </div>
        </div>

        <div className="about-hero-art" aria-label="Fresh grocery selection illustration">
          <div className="hero-art-orbit hero-art-orbit-one" />
          <div className="hero-art-orbit hero-art-orbit-two" />
          <div className="hero-art-leaf hero-art-leaf-one">✦</div>
          <div className="hero-art-leaf hero-art-leaf-two">✦</div>
          <div className="hero-art-produce">
            <span className="produce produce-tomato">🍅</span>
            <span className="produce produce-avocado">🥑</span>
            <span className="produce produce-orange">🍊</span>
            <span className="produce produce-lettuce">🥬</span>
            <span className="produce produce-carrot">🥕</span>
            <span className="produce produce-berries">🫐</span>
          </div>
          <div className="hero-art-tag hero-art-tag-top">
            <span className="hero-tag-icon">✿</span>
            <span><strong>Fresh picks</strong><small>Everyday favourites</small></span>
          </div>
          <div className="hero-art-tag hero-art-tag-bottom">
            <span className="hero-tag-basket">▤</span>
            <span><strong>Your basket</strong><small>Ready when you are</small></span>
            <span className="hero-tag-arrow">↗</span>
          </div>
        </div>
      </section>

      <section className="about-category-strip" aria-label="Grocery categories">
        <p>Everything on your list</p>
        <div>
          <span>🥬 Fresh produce</span>
          <span>🥛 Dairy & eggs</span>
          <span>🥖 Bakery</span>
          <span>🍪 Snacks</span>
          <span>🧺 Daily essentials</span>
        </div>
      </section>

      <section className="about-values-section">
        <div className="about-section-eyebrow">A better everyday routine</div>
        <h2 className="section-heading">Shopping that feels simple.</h2>
        <p className="section-subheading">
          The essentials you need, with a smoother way to find and manage them.
        </p>

        <div className="values-grid">
          <article className="value-card">
            <div className="value-icon value-icon-mint">⌕</div>
            <h3>Find your favourites</h3>
            <p>Browse by category or search the catalog to quickly find what you need.</p>
          </article>
          <article className="value-card">
            <div className="value-icon value-icon-lilac">♡</div>
            <h3>Keep a wishlist</h3>
            <p>Save products to your account and come back to them any time.</p>
          </article>
          <article className="value-card">
            <div className="value-icon value-icon-peach">▣</div>
            <h3>Stay in the loop</h3>
            <p>Review your basket and find your previous orders from one place.</p>
          </article>
        </div>
      </section>

      <section className="about-cta-banner">
        <div>
          <span className="about-cta-eyebrow">Your next shop starts here</span>
          <h2>Make room for a simpler grocery run.</h2>
          <p>Sign in to browse the live catalog and build your basket.</p>
        </div>
        <button className="cta-shop-btn" onClick={handleShopClick}>
          Get started <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
};

export default AboutUs;
