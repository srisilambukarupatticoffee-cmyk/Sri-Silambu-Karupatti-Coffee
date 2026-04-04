import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      setLoading(false);
      if (result.success) {
        navigate(result.user.role === 'admin' ? '/dashboard' : '/billing');
      } else {
        setError(result.error);
      }
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-circle c1" />
        <div className="login-circle c2" />
        <div className="login-circle c3" />
      </div>
      <div className="login-card">
        <div className="login-logo">🧁</div>
        <h1 className="login-title">Hotel Bakery Shop</h1>
        <p className="login-subtitle">Point of Sale System</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="login-demo">
          <p>Demo Credentials</p>
          <div className="demo-creds">
            <div className="demo-card" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>
              <span className="demo-role">👑 Admin</span>
              <span className="demo-user">admin / admin123</span>
            </div>
            <div className="demo-card" onClick={() => { setUsername('billing'); setPassword('billing123'); }}>
              <span className="demo-role">🧾 Billing</span>
              <span className="demo-user">billing / billing123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
