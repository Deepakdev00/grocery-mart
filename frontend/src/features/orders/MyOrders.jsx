import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context';
import { paymentAPI } from '../../services';

const MyOrders = ({ activeOrderId, onOpenLogin }) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await paymentAPI.getHistory();
        setOrders(data.orders || []);
      } catch (err) {
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="content-area" style={{ textAlign: 'center', marginTop: '60px' }}>
        <h2 className="cat-title" style={{ justifyContent: 'center' }}>My Orders</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please login to view your order history.</p>
        <button className="green-btn" style={{ width: '220px', margin: '0 auto' }} onClick={onOpenLogin}>
          Login to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="content-area">
      <h2 className="cat-title" style={{ marginBottom: '24px' }}>My Orders 📦</h2>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 0' }}>
          Loading your orders...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', textAlign: 'center', padding: '30px 0' }}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '50px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🛍️</div>
          <h3 style={{ color: 'var(--text-heading)' }}>You haven't placed any orders yet.</h3>
          <p>Browse our catalog and enjoy instant delivery at your doorstep!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px' }}>
          {orders.map((order) => {
            const isHighlighted = order.id === activeOrderId;

            return (
              <div
                key={order.id}
                className="glass-panel"
                style={{
                  borderRadius: '18px',
                  padding: '24px',
                  boxShadow: isHighlighted ? 'var(--shadow-lg), var(--shadow-glow)' : 'var(--shadow-sm)',
                  borderColor: isHighlighted ? 'var(--color-primary)' : 'var(--border-glass)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
              >
                {isHighlighted && (
                  <div style={{
                    color: 'var(--color-primary)',
                    fontWeight: '800',
                    fontSize: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>✨</span> Just Placed - Thank you!
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-glass-subtle)',
                  paddingBottom: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-heading)' }}>
                      Order #{order.id.slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', fontSize: '16px', color: 'var(--text-heading)' }}>
                      ₹{order.grandTotal.toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        marginTop: '5px',
                        color: order.status === 'pending' ? '#b45309' : 'var(--color-primary)',
                        background: order.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-primary-light)',
                        border: `1px solid ${order.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(var(--color-primary-rgb), 0.3)'}`,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        display: 'inline-block',
                      }}
                    >
                      {order.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        {item.qty}x {item.name}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>
                        ₹{(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-glass-subtle)',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Paid via: <strong style={{ textTransform: 'uppercase', color: 'var(--text-heading)' }}>{order.paymentMethod}</strong></span>
                  {order.deliveryAddress && <span>Delivery to: <strong style={{ color: 'var(--text-heading)' }}>{order.deliveryAddress}</strong></span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
