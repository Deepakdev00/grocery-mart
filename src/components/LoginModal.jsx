import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ onClose, onLoginSuccess }) => {

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, signup } = useAuth();

  const handleContinue = async () => {
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (isSignUp && username.trim().length < 2) {
      setError("Please enter a username with at least 2 characters");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(username, email, password);
        alert(`Account Created Successfully for ${username}!`);
      } else {
        await login(email, password);
        alert(`Login Successful!`);
      }
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay modal-center">
      <div className="modal-box">
        <span className="close-icon" onClick={onClose}>×</span>
        
        {/* Dynamic Header */}
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
            <h3 style={{margin: '0 0 10px 0'}}>
                {isSignUp ? "Sign Up" : "Login"}
            </h3>
            <p style={{color: '#666', fontSize: '14px', margin: 0}}>
                {isSignUp ? "Create a new account" : "Log in to continue"}
            </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee', 
            color: '#c00', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '15px',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        {/* Sign Up: Username Input */}
        {isSignUp && (
            <div className="input-group" style={{marginBottom:'15px'}}>
                <input 
                    type="text" 
              placeholder="Enter username" 
                    className="card-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
                    style={{width:'100%', padding:'12px', border:'1px solid #0c0b0b', borderRadius:'8px', outline:'none'}}
                />
            </div>
        )}

        {/* Email Input */}
        <div style={{marginBottom: '15px'}}>
            <input 
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width:'100%',
              padding:'12px',
              border:'1px solid #ddd',
              borderRadius:'8px',
              outline:'none',
              fontSize: '14px'
            }}
            />
        </div>

        {/* Password Input */}
        <div style={{marginTop: '15px'}}>
            <input 
                type="password" 
                placeholder="Enter password (min 6 characters)" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                style={{
                  width:'100%', 
                  padding:'12px', 
                  border:'1px solid #ddd', 
                  borderRadius:'8px', 
                  outline:'none',
                  fontSize: '14px'
                }}
            />
        </div>

        {/* Continue Button */}
        <button 
          className="green-btn" 
          onClick={handleContinue}
          disabled={loading}
          style={{opacity: loading ? 0.7 : 1, marginTop: '15px'}}
        >
            {loading ? 'Please wait...' : (isSignUp ? "Create Account" : "Login")}
        </button>
        
        {/* Toggle between Login and Signup */}
        <p style={{fontSize: '12px', color: '#666', marginTop: '20px', textAlign: 'center'}}>
            {isSignUp ? "Already have an account? " : "New to GroceryMart? "}
            <span 
                style={{color: '#3d17bb', fontWeight: 'bold', cursor: 'pointer', textDecoration:'underline'}}
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }} 
            >
                {isSignUp ? "Log in" : "Sign up"}
            </span>
        </p>

        <p style={{fontSize: '10px', color: '#aaa', marginTop: '15px', textAlign: 'center'}}>
            By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginModal;