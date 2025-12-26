import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Video, Sparkles, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await signup(name, email, password);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-page-wrapper">
      {/* Cinematic Background */}
      <div className="cinematic-bg">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>

      <div className="auth-container">
        <div className="auth-box glass-card entry-anim">
          <div className="auth-header staggered-item">
            <div className="logo-spark-wrapper">
              <div className="logo-container">
                <Video size={42} className="logo-icon" />
                <Sparkles size={28} className="logo-sparkle" />
              </div>
            </div>
            <h1 className="staggered-item">Join Clueso Studio</h1>
            <p className="subtitle staggered-item">Start creating incredible videos with AI</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group staggered-item" style={{ '--delay': '0.1s' }}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                className="premium-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group staggered-item" style={{ '--delay': '0.2s' }}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="premium-input"
                placeholder="name@clueso.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group staggered-item" style={{ '--delay': '0.3s' }}>
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="premium-input"
                  placeholder="Must be at least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-premium-auth staggered-item"
              style={{ '--delay': '0.4s' }}
              disabled={loading}
            >
              {loading ? (
                <div className="loader-wrapper">
                  <span className="premium-spinner"></span>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer staggered-item" style={{ '--delay': '0.5s' }}>
            <p>
              Already have an account?{' '}
              <Link to="/login" className="premium-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
                .auth-page-wrapper {
                    min-height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    position: relative;
                    background: #05070a;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .cinematic-bg {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 0;
                    overflow: hidden;
                }

                .gradient-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.15;
                    animation: float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
                }

                .blob-1 {
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, #6366f1 0%, transparent 70%);
                    top: -100px;
                    left: -100px;
                }

                .blob-2 {
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, #a855f7 0%, transparent 70%);
                    bottom: -50px;
                    right: -50px;
                    animation-delay: -5s;
                }

                .blob-3 {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
                    bottom: 20%;
                    left: 20%;
                    animation-delay: -10s;
                }

                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(50px, 50px) scale(1.1); }
                }

                .auth-container {
                    position: relative;
                    z-index: 10;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--spacing-lg);
                }

                .glass-card {
                    width: 100%;
                    max-width: 440px;
                    background: rgba(15, 18, 25, 0.6);
                    backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 48px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    position: relative;
                }

                .entry-anim {
                    animation: cardEntry 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }

                @keyframes cardEntry {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .logo-spark-wrapper {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .logo-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-icon {
                    color: white;
                    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
                }

                .logo-sparkle {
                    position: absolute;
                    top: -8px;
                    right: -12px;
                    color: #a855f7;
                    animation: spark 3s ease-in-out infinite;
                }

                @keyframes spark {
                    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
                    50% { transform: scale(1.2) rotate(10deg); opacity: 1; filter: brightness(1.2); }
                }

                .auth-header h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: white;
                    text-align: center;
                    margin-bottom: 8px;
                    letter-spacing: -0.02em;
                }

                .subtitle {
                    color: rgba(255, 255, 255, 0.5);
                    text-align: center;
                    font-size: 0.95rem;
                    margin-bottom: 40px;
                }

                .staggered-item {
                    opacity: 0;
                    animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    animation-delay: var(--delay, 0s);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 8px;
                    margin-left: 4px;
                }

                /* Password Input Wrapper */
                .password-input-wrapper {
                    position: relative;
                    width: 100%;
                }

                .password-toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.4);
                    cursor: pointer;
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    border-radius: 6px;
                }

                .password-toggle-btn:hover {
                    color: rgba(255, 255, 255, 0.7);
                    background: rgba(255, 255, 255, 0.05);
                }

                .password-toggle-btn:active {
                    transform: translateY(-50%) scale(0.95);
                }

                .premium-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: white;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                }

                .password-input-wrapper .premium-input {
                    padding-right: 48px;
                }

                .premium-input:focus {
                    outline: none;
                    background: rgba(255, 255, 255, 0.05);
                    border-color: #6366f1;
                    box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
                }

                .btn-premium-auth {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: white;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.2, 0, 0.2, 1);
                    margin-top: 12px;
                    box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
                }

                .btn-premium-auth:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.5);
                    filter: brightness(1.1);
                }

                .auth-footer {
                    margin-top: 32px;
                    text-align: center;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.4);
                }

                .premium-link {
                    color: #8b5cf6;
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }

                .premium-link:hover {
                    color: #a855f7;
                    text-decoration: underline;
                }

                .loader-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }

                .premium-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  );
};

export default Signup;
