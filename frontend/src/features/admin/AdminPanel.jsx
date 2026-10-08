import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';
import AdminUserManagement from './AdminUserManagement';
import { useAdmin, useToast } from '../../context';
import { adminApiRequest } from '../../services/api';
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
  const [sessions, setSessions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Support Reply
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const { adminUser } = useAdmin();
  const { addToast } = useToast();

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
          fetchDailyOrders(),
        ]);
      } else if (activeTab === 'orders') {
        await fetchOrders();
      } else if (activeTab === 'sessions') {
        await fetchSessions();
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
    const data = await adminApiRequest('/admin/dashboard/stats');
    setStats(data.stats);
  };

  const fetchDailyOrders = async () => {
    const data = await adminApiRequest('/admin/dashboard/daily-orders');

    const formattedData = data.dailyOrders.map((day) => ({
      date: day.date,
      orders: day.orders,
      revenue: day.revenue,
      day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      formattedDate: new Date(day.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));

    setDailyOrders(formattedData);
  };

  const fetchOrders = async () => {
    const data = await adminApiRequest('/admin/dashboard/orders');
    setOrders(data.orders);
  };

  const fetchSessions = async () => {
    const data = await adminApiRequest('/admin/dashboard/sessions');
    setSessions(data.sessions);
  };

  const fetchTickets = async () => {
    const data = await adminApiRequest('/support/dashboard');
    setTickets(data.tickets);
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await adminApiRequest(`/support/tickets/${encodeURIComponent(ticketId)}/status`, {
        method: 'PUT',
        body: { status }
      });
      await fetchTickets();
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      addToast(error.message || 'Failed to update ticket', 'error');
    }
  };

  const sendAdminReply = async (ticketId) => {
    if (!adminReply.trim()) return;

    try {
      await adminApiRequest(`/support/tickets/${encodeURIComponent(ticketId)}/admin-reply`, {
        method: 'POST',
        body: { message: adminReply }
      });

      setAdminReply('');
      await fetchTickets();
      addToast('Reply sent successfully', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to send reply', 'error');
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
    return Math.max(...dailyOrders.map((d) => d.orders), 1);
  };

  const maxOrders = getMaxOrders();

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <header
        className="admin-welcome-banner"
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
          event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
        }}
      >
        <div>
          <span className="admin-welcome-eyebrow">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <h1>Good to see you, {adminUser?.username || 'Admin'}</h1>
          <p>Your store overview, based on the latest saved order and account data.</p>
        </div>
        <button onClick={() => setActiveTab('orders')}>
          View orders <span aria-hidden="true">→</span>
        </button>
      </header>
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
          <div className="chart-heading">
            <div>
              <span>ORDER ACTIVITY</span>
              <h2>Daily orders <small>Last 30 days</small></h2>
            </div>
            <span className="chart-live-badge"><i /> Live data</span>
          </div>
          {loading ? (
            <p className="admin-loading-message">Loading chart data...</p>
          ) : dailyOrders.length === 0 ? (
            <div className="admin-empty-chart">
              <span>▥</span>
              <strong>No order activity yet</strong>
              <p>Daily orders will appear here when customers place orders.</p>
            </div>
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

        <aside className="dashboard-summary-card">
          <div className="summary-card-heading">
            <span className="summary-card-icon">✦</span>
            <span>Store snapshot</span>
          </div>
          <p className="summary-card-intro">A quick look at today, from your live store data.</p>
          <div className="summary-highlight">
            <span>Orders today</span>
            <strong>{stats.todayOrders.toLocaleString()}</strong>
            <small>Recorded for today</small>
          </div>
          <div className="summary-detail">
            <span>Average order value</span>
            <strong>₹{stats.avgOrderValue.toLocaleString()}</strong>
          </div>
          <div className="summary-detail">
            <span>Customers</span>
            <strong>{stats.totalUsers.toLocaleString()}</strong>
          </div>
          <button className="summary-link" onClick={() => setActiveTab('orders')}>
            View orders <span aria-hidden="true">→</span>
          </button>
        </aside>

        {dayDetails && (
          <div className="details-panel selected-day-details">
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
                    <td>{ticket.user?.username || 'User'}</td>
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
                  <p><strong>User:</strong> {selectedTicket.user?.username || 'User'} ({selectedTicket.user?.email || 'N/A'})</p>
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
                  <td>{order.user?.username || 'User'}</td>
                  <td>{order.itemCount}</td>
                  <td>₹{order.grandTotal}</td>
                  <td>{order.paymentMethod?.toUpperCase()}</td>
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
                  <td>{session.admin?.username || 'Admin'}</td>
                  <td>{session.admin?.email || 'N/A'}</td>
                  <td className="ip">{session.ipAddress || 'N/A'}</td>
                  <td>{new Date(session.loginAt).toLocaleString()}</td>
                  <td>{new Date(session.lastSeenAt || session.lastActiveAt).toLocaleString()}</td>
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
      case 'auth_management':
        return <AdminUserManagement />;
      case 'orders':
        return renderOrders();
      case 'users':
        return <AdminUserManagement />;
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
