import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import './Auth.css';

function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        organizationName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error on input change
    };

    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.organizationName) {
            setError('All fields are required');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        // Password validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        // Password match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        // Organization name validation
        if (formData.organizationName.trim().length < 2) {
            setError('Organization name must be at least 2 characters long');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const result = await authService.signup(
                formData.email,
                formData.password,
                formData.organizationName
            );

            setSuccess('Account created successfully! Redirecting to login...');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error('Signup error:', err);
            setError(err.response?.data?.error || 'Failed to create account. Please try again.');
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
                        <h1 className="auth-title">Create Your Account</h1>
                        <p className="auth-subtitle">
                            Start tracking and optimizing your AI spend
                        </p>
                    </div>

                    {/* Alert Messages */}
                    {error && (
                        <div className="auth-alert auth-alert-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="auth-alert auth-alert-success">
                            <span>✅</span>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Signup Form */}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="organizationName">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                id="organizationName"
                                name="organizationName"
                                className="form-input"
                                placeholder="Acme Corp"
                                value={formData.organizationName}
                                onChange={handleChange}
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Work Email
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

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
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
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <span>→</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <p className="text-center mt-3" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    By creating an account, you'll be set as the organization admin
                </p>
            </div>
        </div>
    );
}

export default Signup;
