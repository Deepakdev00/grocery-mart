import React from 'react';
import { useAuth } from '../context';
import './AboutUs.css';

const AboutUs = ({ onNavigate, onOpenLogin }) => {
  const { isAuthenticated } = useAuth();

  const handleShopClick = () => {
    if (isAuthenticated) {
      onNavigate('home');
    } else if (onOpenLogin) {
      onOpenLogin(false);
    } else {
      onNavigate('about');
    }
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-badge">🌿 100% Farm Fresh & Pure</div>
        <h1 className="about-hero-title">
          Delivering Freshness to Your Doorstep in <span className="highlight-green">10 Minutes</span>
        </h1>
        <p className="about-hero-subtitle">
          Grocery Mart is your trusted neighborhood e-grocery supermarket. We connect local farmers directly with your kitchen to bring you the highest quality vegetables, fruits, dairy, and daily essentials at unbeatable prices.
        </p>
        <div className="about-hero-actions">
          <button className="about-btn-primary" onClick={handleShopClick}>
            🛒 Start Shopping Now
          </button>
          <button className="about-btn-secondary" onClick={() => onNavigate('contact')}>
            💬 Contact Us
          </button>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="about-stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">10 min</div>
            <div className="stat-label">Lightning Fast Delivery</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1M+</div>
            <div className="stat-label">Happy Families Served</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5,000+</div>
            <div className="stat-label">Fresh & Handpicked Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">99.8%</div>
            <div className="stat-label">On-Time Delivery Rate</div>
          </div>
        </div>
      </section>

      {/* Our Mission & Story */}
      <section className="about-story-section">
        <div className="story-container">
          <div className="story-image-card">
            <div className="story-emoji">🥬🍎🥦🥛</div>
            <div className="story-floating-badge">
              <span>🌟</span> Direct from Local Certified Farmers
            </div>
          </div>
          <div className="story-text">
            <h2>Our Story & Vision</h2>
            <p>
              Founded with a simple mission: <strong>Make healthy, premium quality groceries accessible and affordable for everyone.</strong> We realized that grocery shopping often involves standing in long billing queues, dealing with stale produce, or waiting days for delivery.
            </p>
            <p>
              With our state-of-the-art dark stores located right across your neighborhood, temperature-controlled delivery vans, and smart inventory management, we ensure your daily essentials arrive crisp, cool, and super fresh in under 10 minutes.
            </p>
            <div className="story-points">
              <div className="point-item">
                <span className="point-icon">🌱</span>
                <div>
                  <strong>Zero Preservatives & Chemical-Free</strong>
                  <p>Strict quality checks at farm gates before dispatch.</p>
                </div>
              </div>
              <div className="point-item">
                <span className="point-icon">⚡</span>
                <div>
                  <strong>Hyperlocal Instant Delivery</strong>
                  <p>Smart localized hubs for 10-minute order fulfillment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values / Why Choose Us */}
      <section className="about-values-section">
        <h2 className="section-heading">Why Millions Choose Grocery Mart</h2>
        <p className="section-subheading">We are committed to perfection in every single order.</p>

        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">⚡</div>
            <h3>10-Minute Delivery</h3>
            <p>From checkout to your doorbell in minutes. No more waiting, no more delays.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">🥦</div>
            <h3>Farm Fresh Quality</h3>
            <p>Handpicked daily fruits and vegetables sourced directly from verified organic farms.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">🏷️</div>
            <h3>Best Market Prices</h3>
            <p>Direct farmer sourcing eliminates middlemen so you get wholesale prices on top brands.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">🔄</div>
            <h3>Instant No-Questions Refund</h3>
            <p>Not satisfied with an item? Instant refund or replacement with just 1 tap.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">🛡️</div>
            <h3>100% Safe & Hygienic</h3>
            <p>Sanitized packaging, contactless drop-offs, and temperature-controlled storage.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">🎧</div>
            <h3>24/7 Dedicated Support</h3>
            <p>Our friendly customer care team is always here to resolve any questions or issues instantly.</p>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="about-reviews-section">
        <h2 className="section-heading">Loved by Over 1 Million Customers</h2>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-stars">⭐⭐⭐⭐⭐</div>
            <p className="review-comment">"The vegetables are always fresher than my local market and they literally arrive in 8 minutes flat! Grocery Mart has completely changed our weekly shopping routine."</p>
            <div className="review-author">
              <div className="author-avatar">👩</div>
              <div>
                <strong>Priya Sharma</strong>
                <small>Surat, Gujarat</small>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-stars">⭐⭐⭐⭐⭐</div>
            <p className="review-comment">"Super intuitive app, love the dark mode theme, and the delivery boys are very courteous. Highly recommended for daily milk, fruits, and snacks!"</p>
            <div className="review-author">
              <div className="author-avatar">👨</div>
              <div>
                <strong>Rahul Mehta</strong>
                <small>Ahmedabad, Gujarat</small>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-stars">⭐⭐⭐⭐⭐</div>
            <p className="review-comment">"Customer support resolved my wrong item complaint in under 2 minutes with instant wallet refund. Customer obsession at its finest."</p>
            <div className="review-author">
              <div className="author-avatar">👩</div>
              <div>
                <strong>Sneha Patel</strong>
                <small>Vadodara, Gujarat</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="about-cta-banner">
        <h2>Experience Superfast Grocery Shopping Today</h2>
        <p>Order fresh fruits, vegetables, dairy, snacks & household essentials right now.</p>
        <button className="cta-shop-btn" onClick={handleShopClick}>
          🚀 Explore Store & Order Now
        </button>
      </section>
    </div>
  );
};

export default AboutUs;
