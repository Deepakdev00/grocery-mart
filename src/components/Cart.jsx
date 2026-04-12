import React from 'react';

const Cart = ({ cart, onClose, updateQty, onOpenPayment }) => {
  const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = itemTotal > 100 ? 0 : 25;
  const handlingFee = 2;
  const grandTotal = itemTotal + deliveryFee + handlingFee;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>My Cart</h3><button onClick={onClose}>×</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}><p>Your cart is empty</p></div>
          ) : (
            cart.map(item => (
              <div className="cart-row" key={item.id}>
                <div className="cart-img-container">
                  <img src={item.img} alt={item.name} className="cart-item-img" onError={(e) => e.target.src = 'https://placehold.co/50?text=Item'} />
                </div>
                <div className="cart-item-details">
                  <div className="c-name">{item.name}</div>
                  <div className="c-weight">{item.weight}</div>
                  <div className="c-price">₹{item.price}</div>
                </div>
                <div className="qty-btn">
                  <button onClick={() => updateQty(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
              </div>
            ))
          )}

          {cart.length > 0 && (
            <div className="bill-box">
              <div className="bill-header">Bill Details</div>
              <div className="bill-row"><span>Item Total</span><span>₹{itemTotal}</span></div>
              <div className="bill-row"><span>Delivery Charge</span><span style={{ color: deliveryFee === 0 ? 'green' : 'black' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
              <div className="bill-row"><span>Handling Charge</span><span>₹{handlingFee}</span></div>
              <div className="bill-row total"><span>Grand Total</span><span>₹{grandTotal}</span></div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer-action">
            <button className="checkout-btn" onClick={() => { onClose(); onOpenPayment(); }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '15px' }}>₹{grandTotal}</span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>TOTAL</span>
              </div>
              <span>Payment Options &gt;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;