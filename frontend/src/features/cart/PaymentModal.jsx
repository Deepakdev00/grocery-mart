import React, { useState } from 'react';
import { paymentAPI } from '../../services';
import { useAuth, useToast } from '../../context';

const PaymentModal = ({ onClose, onPaymentSuccess, cart, onOpenLogin }) => {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const { success } = useToast();

  const itemTotal = cart.reduce((total, item) => total + item.price * item.qty, 0);
  const deliveryFee = itemTotal > 100 ? 0 : 25;
  const grandTotal = itemTotal + deliveryFee + 2;

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    if (!isAuthenticated) {
      onOpenLogin?.();
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Enter a delivery address to place your order.');
      return;
    }

    setLoading(true);
    try {
      const result = await paymentAPI.processPayment({
        paymentMethod: 'cod',
        deliveryAddress: deliveryAddress.trim()
      });
      if (!result.payment?.id) {
        throw new Error('The order was not saved. Please try again.');
      }
      success('Your order has been placed.');
      onPaymentSuccess(result.payment);
    } catch (requestError) {
      setError(requestError.message || 'Could not place your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay modal-center">
      <div className="modal-box" style={{ width: '500px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="close-icon" onClick={onClose} aria-label="Close payment options">×</button>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Review your order</h2>

        <div className="bill-box">
          <div className="bill-row"><span>Items</span><span>₹{itemTotal.toFixed(2)}</span></div>
          <div className="bill-row"><span>Delivery</span><span>{deliveryFee ? `₹${deliveryFee}` : 'FREE'}</span></div>
          <div className="bill-row"><span>Handling</span><span>₹2.00</span></div>
          <div className="bill-row total"><span>Total due on delivery</span><span>₹{grandTotal.toFixed(2)}</span></div>
        </div>

        <form onSubmit={placeOrder} style={{ marginTop: '16px' }}>
          <label htmlFor="delivery-address" style={{ fontWeight: '750', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Delivery address
          </label>
          <textarea
            id="delivery-address"
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            maxLength={500}
            rows={3}
            required
            placeholder="House/flat, street, area, city, PIN code"
            style={{
              boxSizing: 'border-box',
              width: '100%',
              margin: '8px 0 16px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          />

          {error && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600' }}>{error}</p>}

          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', margin: '4px 0 16px' }}>
            💵 Cash on Delivery is currently the supported payment method.
          </p>
          <button className="pay-checkout-btn full-width" type="submit" disabled={loading || cart.length === 0}>
            {loading ? 'Placing order...' : 'Place order · COD'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
