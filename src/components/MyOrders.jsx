import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';

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
      <div className="content-area" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>My Orders</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Please login to view your order history.</p>
        <button className="green-btn" style={{ width: '200px' }} onClick={onOpenLogin}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="content-area">
      <h2 className="cat-title" style={{ marginBottom: '20px' }}>My Orders</h2>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#666' }}>Loading your orders...</div>
      ) : error ? (
        <div style={{ color: '#e24056', textAlign: 'center' }}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          You haven't placed any orders yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => {
            const isHighlighted = order.id === activeOrderId;

            return (
              <div
                key={order.id}
                style={{
                  background: 'white',
                  border: isHighlighted ? '2px solid #0c831f' : '1px solid #e8e8e8',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: isHighlighted ? '0 4px 15px rgba(12, 131, 31, 0.15)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {isHighlighted && (
                  <div style={{ color: '#0c831f', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>
                    ✨ Just Ordered
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Order #{order.id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#1c1c1c' }}>₹{order.grandTotal.toFixed(2)}</div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginTop: '4px',
                      color: order.status === 'pending' ? '#d97706' : '#2d7a4b',
                      background: order.status === 'pending' ? '#fef3c7' : '#eaf8ed',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'inline-block'
                    }}>
                      {order.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>{item.qty}x {item.name}</span>
                      <span style={{ color: '#555' }}>₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dotted #ccc', fontSize: '12px', color: '#555' }}>
                  Paid via: <strong style={{ textTransform: 'uppercase' }}>{order.paymentMethod}</strong>
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
