import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context';
import { supportAPI } from '../services/api';
import './SupportCenter.css';

const SupportCenter = ({ onBack }) => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // New Ticket Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('complaint');
  const [priority, setPriority] = useState('medium');

  // Reply Form
  const [replyMessage, setReplyMessage] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supportAPI.getTickets();
      setTickets(data.tickets);
    } catch (error) {
      console.error('Fetch tickets error:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await supportAPI.createTicket({ title, description, category, priority });
      addToast({ message: 'Support ticket created successfully', type: 'success' });
      setTitle('');
      setDescription('');
      setActiveTab('tickets');
      await fetchTickets();
    } catch (error) {
      addToast({ message: error.message || 'Failed to create ticket', type: 'error' });
    }
    setLoading(false);
  };

  const addReply = async (ticketId) => {
    if (!replyMessage.trim()) return;

    setLoading(true);
    try {
      await supportAPI.reply(ticketId, replyMessage);
      addToast({ message: 'Reply sent successfully', type: 'success' });
      setReplyMessage('');
      const ticketData = await supportAPI.getTicket(ticketId);
      setSelectedTicket(ticketData.ticket);
    } catch (error) {
      addToast({ message: error.message || 'Failed to add reply', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="support-center">
      <div className="support-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Support & Help Center</h1>
        <button
          className="create-btn"
          onClick={() => setActiveTab(activeTab === 'new' ? 'tickets' : 'new')}
        >
          {activeTab === 'new' ? 'View Tickets' : '+ New Ticket'}
        </button>
      </div>

      <div className="support-container">
        {activeTab === 'new' ? (
          <div className="new-ticket-card">
            <h2>Submit a Support Request</h2>
            <form onSubmit={createTicket}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="complaint">Complaint</option>
                  <option value="bug">Report a Bug</option>
                  <option value="suggestion">Feature Suggestion</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  rows="5"
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        ) : (
          <div className="tickets-layout">
            <div className="tickets-list">
              <h2>My Tickets ({tickets.length})</h2>
              {loading ? (
                <p>Loading tickets...</p>
              ) : tickets.length === 0 ? (
                <p className="empty-msg">No tickets submitted yet</p>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`ticket-item ${selectedTicket?.id === ticket.id ? 'active' : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="ticket-header">
                      <h3>{ticket.title}</h3>
                      <span className={`status-badge ${ticket.status}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="ticket-desc">{ticket.description.substring(0, 80)}...</p>
                    <div className="ticket-footer">
                      <span className="badge category">{ticket.category}</span>
                      <span className="badge priority">{ticket.priority}</span>
                      <span className="date">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedTicket && (
              <div className="ticket-detail">
                <div className="detail-header">
                  <h2>{selectedTicket.title}</h2>
                  <span className={`status-badge ${selectedTicket.status}`}>
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="detail-meta">
                  <p><strong>Category:</strong> {selectedTicket.category}</p>
                  <p><strong>Priority:</strong> {selectedTicket.priority}</p>
                  <p><strong>Created:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>

                <div className="detail-body">
                  <h3>Description</h3>
                  <p>{selectedTicket.description}</p>
                </div>

                {selectedTicket.replies?.length > 0 && (
                  <div className="replies-section">
                    <h3>Replies ({selectedTicket.replies.length})</h3>
                    {selectedTicket.replies.map((reply) => (
                      <div key={reply.id} className="reply-item">
                        <p className="reply-msg">{reply.message}</p>
                        <span className="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="reply-form">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows="3"
                  />
                  <button
                    onClick={() => addReply(selectedTicket.id)}
                    disabled={loading}
                    className="reply-btn"
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenter;
