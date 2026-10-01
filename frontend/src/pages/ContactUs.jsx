import React, { useState } from 'react';
import { useAuth, useToast } from '../context';
import './ContactUs.css';

const ContactUs = ({ onNavigate, onOpenLogin }) => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'order_inquiry',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleSupportClick = () => {
    if (isAuthenticated) {
      onNavigate('support');
    } else if (onOpenLogin) {
      onOpenLogin(false);
    } else {
      onNavigate('about');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast({
        message: 'Please fill in all required fields.',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast({
        message: 'Thank you! Your message has been received. Our team will contact you within 2 hours. ✅',
        type: 'success',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'order_inquiry',
        message: '',
      });
    }, 800);
  };

  const faqs = [
    {
      q: 'How fast is Grocery Mart delivery?',
      a: 'Our orders are delivered within 10 to 15 minutes! We achieve this through our dense network of neighborhood dark stores and real-time inventory routing.',
    },
    {
      q: 'What if I receive damaged or spoiled items?',
      a: 'We have a 100% Instant Refund policy. You can either use the Support Center in your account or contact our helpline, and we will issue an immediate refund or replacement.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We accept UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), Net Banking, and Cash on Delivery (COD).',
    },
    {
      q: 'Where do you source your vegetables and fruits?',
      a: 'Our fresh produce is harvested directly from certified local organic farms every morning and undergoes rigorous quality inspection before dispatch.',
    },
  ];

  return (
    <div className="contact-page">
      {/* Hero Header */}
      <div className="contact-hero">
        <div className="contact-badge">📞 We Are Here For You</div>
        <h1>Get in Touch With Us</h1>
        <p>Have questions about your order, products, or feedback? Our team is available 24/7 to assist you.</p>
      </div>

      <div className="contact-container">
        {/* Contact Info Cards */}
        <div className="contact-cards-grid">
          <div className="contact-card">
            <div className="contact-icon">📞</div>
            <h3>Call Us</h3>
            <p className="contact-detail">+91 98765 43210</p>
            <span className="contact-sub">Available 6:00 AM - 11:00 PM</span>
          </div>

          <div className="contact-card">
            <div className="contact-icon">✉️</div>
            <h3>Email Support</h3>
            <p className="contact-detail">support@grocerymart.com</p>
            <span className="contact-sub">Average response under 15 mins</span>
          </div>

          <div className="contact-card">
            <div className="contact-icon">📍</div>
            <h3>Headquarters</h3>
            <p className="contact-detail">Grocery Mart Logistics Hub</p>
            <span className="contact-sub">Ring Road, Surat, Gujarat - 395007</span>
          </div>

          <div className="contact-card highlight" onClick={handleSupportClick}>
            <div className="contact-icon">🎫</div>
            <h3>Need Support Ticket?</h3>
            <p className="contact-detail">Submit Complaint / Ticket →</p>
            <span className="contact-sub">Track real-time support discussion</span>
          </div>
        </div>

        {/* Form and FAQ Section */}
        <div className="contact-content-grid">
          {/* Contact Form */}
          <div className="contact-form-card">
            <h2>Send Us a Message</h2>
            <p className="form-subtext">Fill out the form below and our customer care team will get back to you promptly.</p>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-field">
                  <label>Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="order_inquiry">📦 Order Inquiry / Delay</option>
                    <option value="product_quality">🥬 Product Quality / Damage</option>
                    <option value="payment_issue">💳 Payment / Refund Issue</option>
                    <option value="feedback">⭐ Feedback & Suggestions</option>
                    <option value="partnership">🤝 Vendor / Business Partnership</option>
                    <option value="other">💬 Other Query</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Your Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please describe how we can assist you..."
                  rows="5"
                  required
                />
              </div>

              <button type="submit" className="contact-submit-btn" disabled={loading}>
                {loading ? 'Sending Message...' : '🚀 Send Message'}
              </button>
            </form>
          </div>

          {/* Quick FAQ Accordion */}
          <div className="contact-faq-card">
            <h2>Frequently Asked Questions</h2>
            <p className="faq-subtext">Quick answers to common questions about Grocery Mart.</p>

            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${activeFaq === index ? 'active' : ''}`}
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                >
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    <span className="faq-arrow">{activeFaq === index ? '▲' : '▼'}</span>
                  </div>
                  {activeFaq === index && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="support-cta-box">
              <h3>Have an ongoing active order problem?</h3>
              <p>Create a support ticket for instant resolution by our support staff.</p>
              <button className="support-link-btn" onClick={handleSupportClick}>
                Open Support Ticket 🎫
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
