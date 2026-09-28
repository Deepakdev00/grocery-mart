import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import './AdminPanel.css';

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dailyOrders, setDailyOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    todayOrders: 0,
    totalUsers: 0,
  });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New Product Form
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'vegetables',
    imageUrl: '',
    description: ''
  });
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Support Reply
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReply, setAdminReply] = useState('');

  const token = localStorage.getItem('adminToken');
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([
          fetchStats(),
          fetchDailyOrders()
        ]);
      } else if (activeTab === 'orders') {
        await fetchOrders();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'sessions') {
        await fetchSessions();
      } else if (activeTab === 'products') {
        await fetchProducts();
      } else if (activeTab === 'support') {
        await fetchTickets();
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const response = await fetch(`${API_BASE}/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    const data = await response.json();
    setStats(data.stats);
  };

  const fetchDailyOrders = async () => {
    const response = await fetch(`${API_BASE}/admin/dashboard/daily-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch daily orders');
    const data = await response.json();

    const formattedData = data.dailyOrders.map(day => ({
      date: day.date,
      orders: day.orders,
      revenue: day.revenue,
      day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      formattedDate: new Date(day.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
    }));

    setDailyOrders(formattedData);
  };

  const fetchOrders = async () => {
    const response = await fetch(`${API_BASE}/admin/dashboard/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    setOrders(data.orders);
  };

  const fetchUsers = async () => {
    const response = await fetch(`${API_BASE}/admin/dashboard/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    setUsers(data.users);
  };

  const fetchSessions = async () => {
    const response = await fetch(`${API_BASE}/admin/dashboard/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    const data = await response.json();
    setSessions(data.sessions);
  };

  const fetchProducts = async () => {
    const response = await fetch(`${API_BASE}/products/admin/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    setProducts(data.products);
  };

  const fetchTickets = async () => {
    const response = await fetch(`${API_BASE}/support/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch support tickets');
    const data = await response.json();
    setTickets(data.tickets);
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.imageUrl) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });

      if (response.ok) {
        alert('Product added successfully 🎉');
        setProductForm({
          name: '',
          price: '',
          category: 'vegetables',
          imageUrl: '',
          description: ''
        });
        setShowAddProduct(false);
        fetchProducts();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add product');
      }
    } catch (error) {
      alert('Network error adding product');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Product deleted successfully');
        fetchProducts();
      }
    } catch (error) {
      alert('Network error deleting product');
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const response = await fetch(`${API_BASE}/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket) {
          setSelectedTicket({ ...selectedTicket, status });
        }
      }
    } catch (error) {
      alert('Network error updating ticket');
    }
  };

  const sendAdminReply = async (ticketId) => {
    if (!adminReply.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/support/tickets/${ticketId}/admin-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: adminReply })
      });

      if (response.ok) {
        setAdminReply('');
        fetchTickets();
        alert('Reply sent successfully ✅');
      }
    } catch (error) {
      alert('Network error sending reply');
    }
  };

  const handleDayClick = (dayData) => {
    setSelectedDay(dayData);
    setDayDetails({
      date: dayData.formattedDate,
      orders: dayData.orders,
      revenue: dayData.revenue,
      avgOrder: dayData.orders > 0 ? Math.floor(dayData.revenue / dayData.orders) : 0,
    });
  };

  const getMaxOrders = () => {
    return Math.max(...dailyOrders.map(d => d.orders), 1);
  };

  const maxOrders = getMaxOrders();

  const renderDashboard = () => (
    <div className="admin-dashboard">
      {error && (
        <div style={{ background: '#fee', color: '#c00', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fcc' }}>
          ⚠️ {error}
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{stats.totalOrders.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">₹{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <p className="stat-label">Avg Order Value</p>
            <p className="stat-value">₹{stats.avgOrderValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Total Users</p>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <p className="stat-label">Today's Orders</p>
            <p className="stat-value">{stats.todayOrders}</p>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h2>Daily Orders (Last 30 Days)</h2>
          {loading ? (
            <p>Loading chart data...</p>
          ) : (
            <div className="bar-chart">
              {dailyOrders.map((day, index) => (
                <div
                  key={index}
                  className={`bar-item ${selectedDay?.date === day.date ? 'active' : ''}`}
                  onClick={() => handleDayClick(day)}
                  title={`${day.formattedDate}: ${day.orders} orders, ₹${day.revenue}`}
                >
                  <div className="bar-wrapper">
                    <div
                      className="bar"
                      style={{ height: `${(day.orders / maxOrders) * 100}%` }}
                    >
                      <span className="bar-value">{day.orders}</span>
                    </div>
                  </div>
                  <span className="bar-label">{day.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {dayDetails && (
          <div className="details-panel">
            <h2>📅 {dayDetails.date}</h2>
            <div className="details-stats">
              <div className="detail-stat">
                <span className="detail-label">Orders:</span>
                <span className="detail-value">{dayDetails.orders}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-label">Revenue:</span>
                <span className="detail-value">₹{dayDetails.revenue.toLocaleString()}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-label">Avg Order:</span>
                <span className="detail-value">₹{dayDetails.avgOrder.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="admin-content-section">
      <div className="section-header">
        <h2>🛍️ Products Management</h2>
        <button
          className="add-btn"
          onClick={() => setShowAddProduct(!showAddProduct)}
        >
          {showAddProduct ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showAddProduct && (
        <div className="add-product-form">
          <h3>Add New Product</h3>
          <form onSubmit={addProduct}>
            <div className="form-row">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Fresh Tomatoes"
                  required
                />
              </div>

              <div className="form-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="e.g. 40"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  <option value="vegetables">Vegetables & Fruits</option>
                  <option value="dairy">Dairy & Eggs</option>
                  <option value="bakery">Bakery & Snacks</option>
                  <option value="beverages">Beverages</option>
                  <option value="staples">Staples & Grains</option>
                </select>
              </div>

              <div className="form-group">
                <label>Product Image URL</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Product description..."
                rows="3"
              />
            </div>

            <button type="submit" className="save-btn">Save Product</button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products added yet</p>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.category}</td>
                  <td>₹{product.price}</td>
                  <td>
                    <span className={`status-badge ${product.inStock ? 'completed' : 'pending'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="delete-btn-sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSupport = () => (
    <div className="admin-content-section">
      <h2>🎫 Support Tickets & Complaints</h2>
      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No support tickets</p>
      ) : (
        <div className="support-layout">
          <div className="tickets-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.user.username}</td>
                    <td><strong>{ticket.title}</strong></td>
                    <td><span className="badge category">{ticket.category}</span></td>
                    <td><span className={`badge priority ${ticket.priority}`}>{ticket.priority}</span></td>
                    <td>
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                        className={`status-select ${ticket.status}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="view-btn-sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTicket && (
            <div className="ticket-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>{selectedTicket.title}</h3>
                  <button onClick={() => setSelectedTicket(null)}>×</button>
                </div>
                <div className="modal-body">
                  <p><strong>User:</strong> {selectedTicket.user.username} ({selectedTicket.user.email})</p>
                  <p><strong>Category:</strong> {selectedTicket.category}</p>
                  <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                  <p><strong>Description:</strong></p>
                  <p className="ticket-desc-box">{selectedTicket.description}</p>

                  <div className="admin-reply-box">
                    <h4>Add Reply</h4>
                    <textarea
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Type your response to the user..."
                      rows="3"
                    />
                    <button
                      className="save-btn"
                      onClick={() => sendAdminReply(selectedTicket.id)}
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="admin-content-section">
      <h2>📦 Recent Orders</h2>
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id.substring(0, 8)}</td>
                  <td>{order.user.username}</td>
                  <td>{order.itemCount}</td>
                  <td>₹{order.grandTotal}</td>
                  <td>{order.paymentMethod.toUpperCase()}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="admin-content-section">
      <h2>👥 Registered Users</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td className="center">{user.orderCount}</td>
                  <td className="amount">₹{user.totalSpent.toLocaleString()}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSessions = () => (
    <div className="admin-content-section">
      <h2>🔐 Active Admin Sessions</h2>
      {loading ? (
        <p>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p>No active sessions</p>
      ) : (
        <div className="sessions-table">
          <table>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Email</th>
                <th>IP Address</th>
                <th>Login Time</th>
                <th>Last Active</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.admin.username}</td>
                  <td>{session.admin.email}</td>
                  <td className="ip">{session.ipAddress || 'N/A'}</td>
                  <td>{new Date(session.loginAt).toLocaleString()}</td>
                  <td>{new Date(session.lastSeenAt).toLocaleString()}</td>
                  <td>{new Date(session.expiresAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'orders':
        return renderOrders();
      case 'products':
        return renderProducts();
      case 'users':
        return renderUsers();
      case 'support':
        return renderSupport();
      case 'sessions':
        return renderSessions();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-panel-layout">
      <AdminNavbar onLogout={onBack} />

      <div className="admin-main">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="admin-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
