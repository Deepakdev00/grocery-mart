import React, { useState } from 'react';
import { paymentAPI } from '../../services';
import { useAuth } from '../../context';

const PaymentModal = ({ onClose, onPaymentSuccess, cart, onOpenLogin }) => {
  const [isUpiSectionOpen, setIsUpiSectionOpen] = useState(false);
  const [isCardSectionOpen, setIsCardSectionOpen] = useState(false);
  const [isCodSectionOpen, setIsCodSectionOpen] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuth();

  const toggleUpi = () => {
    setIsUpiSectionOpen(!isUpiSectionOpen);
    if (!isUpiSectionOpen) {
      setIsCardSectionOpen(false);
      setIsCodSectionOpen(false);
    }
  };

  const toggleCard = () => {
    setIsCardSectionOpen(!isCardSectionOpen);
    if (!isCardSectionOpen) {
      setIsUpiSectionOpen(false);
      setIsCodSectionOpen(false);
    }
  };

  const toggleCod = () => {
    setIsCodSectionOpen(!isCodSectionOpen);
    if (!isCodSectionOpen) {
      setIsUpiSectionOpen(false);
      setIsCardSectionOpen(false);
    }
  };

  const processPayment = async (method, details) => {
    setError('');

    if (!isAuthenticated) {
      if (onOpenLogin) onOpenLogin();
      return;
    }

    setLoading(true);

    try {
      let resultData = null;
      if (isAuthenticated) {
        resultData = await paymentAPI.processPayment({
          paymentMethod: method,
          paymentDetails: details,
          items: cart,
        });
      }

      alert(`Payment Successful via ${method.toUpperCase()}!`);
      onPaymentSuccess(resultData?.payment || { id: Date.now().toString(), paymentMethod: method });
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiCheckout = () => {
    if (!upiId.includes('@')) {
      setError('Please enter a valid UPI ID');
      return;
    }
    processPayment('upi', { upiId });
  };

  const handleCardCheckout = () => {
    if (!cardDetails.number || cardDetails.number.length < 16) {
      setError('Please enter a valid card number');
      return;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      setError('Please enter a valid CVV');
      return;
    }
    processPayment('card', {
      cardLastFour: cardDetails.number.slice(-4),
      cardType: 'credit',
    });
  };

  const handleCodCheckout = () => {
    processPayment('cod', {});
  };

  return (
    <div className="overlay modal-center">
      <div className="modal-box" style={{ width: '500px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
        <span className="close-icon" onClick={onClose}>×</span>

        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Payment Options</h2>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: '#fee',
              color: '#c00',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '15px',
              fontSize: '13px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* UPI Section */}
        <div className="pay-section-header" onClick={toggleUpi}>
          <h3>Add new UPI ID</h3>
          <span>{isUpiSectionOpen ? '▲' : '▼'}</span>
        </div>
        {isUpiSectionOpen && (
          <div className="pay-container">
            <div className="pay-title-row">
              <span className="check-icon">✓</span>
              <span>Add new UPI</span>
            </div>
            <div className="pay-logos-row">
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="pay-logo" style={{ width: '40px' }} />
              <img src="https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png" alt="PhonePe" className="pay-logo" style={{ width: '40px' }} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png" alt="Paytm" className="pay-logo" style={{ width: '40px' }} />
            </div>
            <div className="upi-input-group">
              <input type="text" placeholder="example@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              <button className="pay-checkout-btn" onClick={handleUpiCheckout} disabled={loading}>
                {loading ? 'Processing...' : 'Checkout'}
              </button>
            </div>
            <p className="pay-helper-text">The UPI ID is in the format of name/phone number@bankname</p>
          </div>
        )}

        {/* Card Section */}
        <div className="pay-section-header" onClick={toggleCard}>
          <h3>Add credit or debit cards</h3>
          <span>{isCardSectionOpen ? '▲' : '▼'}</span>
        </div>
        {isCardSectionOpen && (
          <div className="pay-container">
            <div className="pay-title-row">
              <span className="check-icon">✓</span>
              <span>Add Debit / Credit / ATM Card</span>
            </div>
            <div className="pay-logos-row">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="pay-logo" style={{ width: '40px' }} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="pay-logo" style={{ width: '40px' }} />
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="Rupay" className="pay-logo" style={{ width: '40px' }} />
            </div>
            <input
              className="card-input"
              type="text"
              placeholder="Name on Card"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
            />
            <input
              className="card-input"
              type="text"
              placeholder="Card Number"
              maxLength="16"
              value={cardDetails.number}
              onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value.replace(/\D/g, '') })}
            />
            <div className="card-split-row">
              <input
                className="card-input"
                type="text"
                placeholder="Expiry Date (MM/YY)"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
              />
              <input
                className="card-input"
                type="password"
                placeholder="CVV"
                maxLength="4"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <button
              className="pay-checkout-btn full-width"
              onClick={handleCardCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        )}

        {/* Cash on Delivery Section */}
        <div className="pay-section-header" onClick={toggleCod}>
          <h3>Cash on Delivery</h3>
          <span style={{ fontSize: '12px', color: '#0c831f', fontWeight: 'bold' }}>AVAILABLE</span>
        </div>
        {isCodSectionOpen && (
          <div className="pay-container">
            <p style={{ color: '#666', marginBottom: '15px' }}>Pay when your order is delivered to your doorstep.</p>
            <button
              className="pay-checkout-btn full-width"
              onClick={handleCodCheckout}
              disabled={loading}
              style={{ background: '#0c831f' }}
            >
              {loading ? 'Processing...' : 'Place Order (COD)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
