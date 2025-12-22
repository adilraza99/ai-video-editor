import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Video, Sparkles } from 'lucide-react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="auth-container">
            <div className="auth-box fade-in">
                <div className="auth-header">
                    <div className="logo">
                        <Video size={40} className="logo-icon" />
                        <Sparkles size={24} className="logo-sparkle" />
                    </div>
                    <h1>Create Account</h1>
                    <p className="subtitle">Start creating incredible videos with AI</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            className="input"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <small style={{ color: 'var(--text-muted)' }}>
                            Minimum 6 characters
                        </small>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        }

        .auth-box {
          width: 100%;
          max-width: 450px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: var(--spacing-2xl);
          box-shadow: var(--shadow-lg);
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--spacing-2xl);
        }

        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: var(--spacing-lg);
        }

        .logo-icon {
          color: var(--primary);
        }

        .logo-sparkle {
          position: absolute;
          top: -5px;
          right: -10px;
          color: var(--accent);
          animation: pulse 2s ease-in-out infinite;
        }

        .auth-header h1 {
          font-size: 2rem;
          margin-bottom: var(--spacing-sm);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: var(--text-secondary);
          margin-bottom: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .form-group label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .auth-footer {
          margin-top: var(--spacing-xl);
          text-align: center;
          color: var(--text-secondary);
        }

        .link {
          color: var(--primary);
          font-weight: 600;
        }

        .link:hover {
          color: var(--primary-hover);
        }
      `}</style>
        </div>
    );
};

export default Signup;
