import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import './Auth.css';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error on input change
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const result = await authService.login(
                formData.email,
                formData.password
            );

            // Navigate to dashboard (will create this later)
            navigate('/dashboard');

        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            {/* Animated Background Orbs */}
            <div className="floating-orb orb-1"></div>
            <div className="floating-orb orb-2"></div>

            <div className="auth-container">
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo">🚀</div>
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">
                            Sign in to your SpendAI account
                        </p>
                    </div>

                    {/* Alert Messages */}
                    {error && (
                        <div className="auth-alert auth-alert-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                placeholder="you@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <span>→</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/signup" className="auth-link">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <p className="text-center mt-3" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    🔒 Secure authentication powered by Supabase
                </p>
            </div>
        </div>
    );
}

export default Login;
