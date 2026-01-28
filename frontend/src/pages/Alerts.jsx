import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, budgetService } from '../services/api';
import './Alerts.css';

function Alerts() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const userData = authService.getUser();
        setUser(userData);
        loadAlerts();
    }, [navigate]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const response = await budgetService.getAlerts();
            if (response.success) {
                setAlerts(response.data);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(val);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Retrieving spend alerts...</p>
            </div>
        );
    }

    return (
        <div className="alerts-page">
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span className="logo-icon">🚀</span>
                        <span className="logo-text">SpendAI</span>
                    </div>
                    <div className="dashboard-user">
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>Dashboard</button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container narrow">
                    <div className="page-header">
                        <h1>Security & Spend Alerts</h1>
                        <p>History of triggered budget threshold notifications.</p>
                    </div>

                    <div className="alert-list">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`alert-item glass fade-in threshold-${alert.threshold_percent}`}>
                                <div className="alert-badge">
                                    {alert.threshold_percent}%
                                </div>
                                <div className="alert-content">
                                    <div className="alert-title">
                                        {alert.alert_level === 'organization' ? 'Organization' : 'Project'} Budget Threshold Crossed
                                    </div>
                                    <div className="alert-meta">
                                        {alert.alert_level === 'project' && (
                                            <span className="alert-project">Project: {alert.projects?.name || 'Deleted Project'}</span>
                                        )}
                                        <span className="alert-date">{formatDate(alert.created_at)}</span>
                                    </div>
                                    <div className="alert-details">
                                        MTD Spend reached <strong>{formatCurrency(alert.actual_spend)}</strong> of <strong>{formatCurrency(alert.budget_amount)}</strong> budget.
                                    </div>
                                </div>
                                <div className="alert-status">
                                    <span className="status-dot"></span>
                                    Logged
                                </div>
                            </div>
                        ))}

                        {alerts.length === 0 && (
                            <div className="empty-alerts glass fade-in">
                                <div className="empty-icon">🛡️</div>
                                <h3>No alerts triggered yet</h3>
                                <p>SpendAI is monitoring your usage in real-time. Alerts will appear here if budgets cross 50%, 75%, 90% or 100%.</p>
                                <button className="btn btn-outline btn-sm" onClick={() => navigate('/budgets')}>
                                    Configure Budgets
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Alerts;
