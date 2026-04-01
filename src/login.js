import React, { useState } from 'react';
import { UserPlus, LogIn, ShieldCheck } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle state
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.email && (isSignUp ? formData.name : true)) {
      // In a real app, you'd save to a DB here. 
      // For your demo, we'll just pass the user object.
      onLoginSuccess({ name: formData.name || formData.email.split('@')[0], email: formData.email });
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert("SECURITY PROTOCOL:\n\nPassword reset requests must be verified by your healthcare provider for HIPAA compliance.");
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    margin: '10px 0',
    borderRadius: '12px',
    border: '1px solid #eee',
    boxSizing: 'border-box',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.3s'
  };

  const buttonStyle = {
    width: '100%',
    padding: '15px',
    background: '#6b8e6b',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    marginTop: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: '#fdfcfb',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '30px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)', 
        width: '400px',
        position: 'relative'
      }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ 
            background: '#f0f4f0', 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 15px' 
          }}>
            <ShieldCheck color="#6b8e6b" size={32} />
          </div>
          <h2 style={{ color: '#2f3e33', margin: '0' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '5px' }}>
            {isSignUp ? 'Join MedSmart Health Portal' : 'Login to your health dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <input 
              style={inputStyle} 
              placeholder="Full Name" 
              required
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          )}
          
          <input 
            style={inputStyle} 
            placeholder="Email Address" 
            type="email" 
            required
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />

          <input 
            style={inputStyle} 
            placeholder="Password" 
            type="password" 
            required
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />

          <button style={buttonStyle}>
            {isSignUp ? <UserPlus size={20}/> : <LogIn size={20}/>}
            {isSignUp ? 'SIGN UP' : 'LOGIN'}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          {!isSignUp && (
            <a href="#" onClick={handleForgotPassword} style={{ 
              color: '#6b8e6b', 
              fontSize: '0.85rem', 
              textDecoration: 'none', 
              fontWeight: '600',
              display: 'block',
              marginBottom: '15px'
            }}>
              Forgot Password?
            </a>
          )}

          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            {isSignUp ? "Already have an account?" : "New to MedSmart?"}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#6b8e6b', 
                fontWeight: 'bold', 
                cursor: 'pointer', 
                marginLeft: '5px',
                fontSize: '0.9rem'
              }}
            >
              {isSignUp ? 'Login here' : 'Sign up now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
