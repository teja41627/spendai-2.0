import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, budgetService, projectService } from '../services/api';
import './BudgetSettings.css';

function BudgetSettings() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [orgBudget, setOrgBudget] = useState('');
    const [projects, setProjects] = useState([]);
    const [projectBudgets, setProjectBudgets] = useState({});

    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/login');
            return;
        }

        const userData = authService.getUser();
        setUser(userData);
        loadBudgets();
    }, [navigate]);

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const [summary, projectsData] = await Promise.all([
                budgetService.getSummary(),
                projectService.getProjects()
            ]);

            if (summary.success) {
                setOrgBudget(summary.data.organization.budget || '');
            }

            if (projectsData.success) {
                setProjects(projectsData.data);
                const budgets = {};
                projectsData.data.forEach(p => {
                    budgets[p.id] = p.monthly_budget_usd || '';
                });
                setProjectBudgets(budgets);
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
            setMessage({ type: 'error', text: 'Failed to load budget settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleOrgBudgetSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const amount = orgBudget === '' ? 0 : parseFloat(orgBudget);
            const response = await budgetService.updateOrgBudget(amount);
            if (response.success) {
                setMessage({ type: 'success', text: 'Organization budget updated successfully.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update organization budget.' });
        } finally {
            setSaving(false);
        }
    };

    const handleProjectBudgetChange = (projectId, value) => {
        setProjectBudgets(prev => ({
            ...prev,
            [projectId]: value
        }));
    };

    const saveProjectBudget = async (projectId) => {
        setMessage(null);
        try {
            const amount = projectBudgets[projectId] === '' ? 0 : parseFloat(projectBudgets[projectId]);
            const response = await budgetService.updateProjectBudget(projectId, amount);
            if (response.success) {
                setMessage({ type: 'success', text: 'Project budget updated successfully.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update project budget.' });
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading budget settings...</p>
            </div>
        );
    }

    const isAdmin = user?.role === 'admin';

    return (
        <div className="budget-settings">
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
                        <h1>Budget & Alerts <span className="badge badge-secondary">Advisory</span></h1>
                        <p>Configure spend limits and threshold notifications.</p>
                    </div>

                    {message && (
                        <div className={`alert alert-${message.type} fade-in`}>
                            {message.text}
                        </div>
                    )}

                    <div className="info-box-large fade-in">
                        <span className="info-icon">💡</span>
                        <div className="info-content">
                            <h3>Soft Governance Mode</h3>
                            <p>Budgets in SpendAI are currently <strong>advisory</strong>. Exceeding a budget will trigger alerts but will <strong>not</strong> block your API requests or disable keys. This ensures business continuity while maintaining spend visibility.</p>
                        </div>
                    </div>

                    <section className="settings-section glass fade-in">
                        <div className="section-header">
                            <h2>Organization Budget</h2>
                            <p>Global monthly spend limit for all projects.</p>
                        </div>
                        <form onSubmit={handleOrgBudgetSubmit} className="budget-form">
                            <div className="form-group-inline">
                                <div className="input-prefix">$</div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="No limit"
                                    value={orgBudget}
                                    onChange={(e) => setOrgBudget(e.target.value)}
                                    disabled={!isAdmin || saving}
                                    className="input-large"
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!isAdmin || saving}
                                >
                                    {saving ? 'Saving...' : 'Save Global Budget'}
                                </button>
                            </div>
                            {!isAdmin && <p className="hint">Contact your administrator to change budgets.</p>}
                        </form>
                    </section>

                    <section className="settings-section glass fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="section-header">
                            <h2>Project Budgets</h2>
                            <p>Optional individual limits for specific projects.</p>
                        </div>
                        <div className="project-budget-list">
                            {projects.map(p => (
                                <div key={p.id} className="project-budget-item">
                                    <div className="pbi-info">
                                        <span className="pbi-name">{p.name}</span>
                                        <span className="pbi-id">ID: {p.id.substring(0, 8)}...</span>
                                    </div>
                                    <div className="pbi-action">
                                        <div className="input-prefix-sm">$</div>
                                        <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            placeholder="No limit"
                                            value={projectBudgets[p.id] || ''}
                                            onChange={(e) => handleProjectBudgetChange(p.id, e.target.value)}
                                            disabled={!isAdmin}
                                        />
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => saveProjectBudget(p.id)}
                                            disabled={!isAdmin}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="text-center py-4">No projects found.</p>}
                        </div>
                    </section>

                    <section className="settings-section glass fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="section-header">
                            <h2>Threshold Notifications</h2>
                            <p>SpendAI triggers internal alerts at these usage levels:</p>
                        </div>
                        <div className="threshold-grid">
                            <div className="threshold-item">50%</div>
                            <div className="threshold-item">75%</div>
                            <div className="threshold-item">90%</div>
                            <div className="threshold-item total">100%</div>
                        </div>
                        <div className="info-box">
                            <span className="info-icon">ℹ️</span>
                            <p>Alerts are logged once per month per threshold to prevent noise. Request traffic is never blocked even if budgets are exceeded.</p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default BudgetSettings;
