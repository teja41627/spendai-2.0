import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { authService, analyticsService } from '../services/api';
import './Dashboard.css';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Analytics State
    const [summary, setSummary] = useState({ month_to_date: 0, last_7_days: 0, last_30_days: 0 });
    const [dailySpend, setDailySpend] = useState([]);
    const [projectSpend, setProjectSpend] = useState([]);
    const [modelSpend, setModelSpend] = useState([]);

    useEffect(() => {
        const init = async () => {
            if (!authService.isAuthenticated()) {
                navigate('/login');
                return;
            }

            try {
                // If we're coming from a social redirect, we might need to refresh the profile
                const { user: refreshedUser } = await authService.getCurrentUser();
                if (refreshedUser) {
                    localStorage.setItem('user', JSON.stringify({
                        id: refreshedUser.id,
                        email: refreshedUser.email,
                        role: refreshedUser.role,
                        organization: refreshedUser.organization
                    }));
                    setUser(refreshedUser);
                } else {
                    const userData = authService.getUser();
                    setUser(userData);
                }

                await fetchAnalytics();
            } catch (err) {
                console.error('Initialization Error:', err);
                // Fallback to local storage if API fails but user is still auth'd
                const userData = authService.getUser();
                if (userData) {
                    setUser(userData);
                } else {
                    navigate('/login');
                }
                setError('Failed to load profile or spend data.');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [navigate]);

    const fetchAnalytics = async () => {
        const [sumData, dailyData, projectData, modelData, budgetData] = await Promise.all([
            analyticsService.getSummary(),
            analyticsService.getDailySpend(),
            analyticsService.getProjectSpend(),
            analyticsService.getModelSpend(),
            budgetService.getSummary()
        ]);

        if (sumData.success) {
            const mergedSummary = { ...sumData.data };
            if (budgetData.success) {
                mergedSummary.budget = budgetData.data.organization.budget;
            }
            setSummary(mergedSummary);
        }
        if (dailyData.success) setDailySpend(dailyData.data);
        if (projectData.success) setProjectSpend(projectData.data);
        if (modelData.success) setModelSpend(modelData.data);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(val);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Analyzing spend data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <span className="logo-icon">🚀</span>
                        <span className="logo-text">SpendAI</span>
                    </div>

                    <div className="dashboard-user">
                        <div className="user-info">
                            <span className="user-name">{user?.email}</span>
                            <span className="user-org">{user?.organization?.name}</span>
                            <span className="user-role badge badge-secondary">{user?.role}</span>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="container">
                    <div className="dashboard-intro">
                        <h1>Executive Dashboard</h1>
                        <p>Real-time AI spend analytics for <strong>{user?.organization?.name}</strong></p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <div className="summary-card glass">
                            <span className="summary-label">Month to Date</span>
                            <div className="summary-main">
                                <h2 className="summary-value">{formatCurrency(summary.month_to_date)}</h2>
                                {summary.budget > 0 && (
                                    <div className="budget-progress-container">
                                        <div className="budget-progress-bar">
                                            <div
                                                className={`budget-progress-fill ${summary.month_to_date > summary.budget ? 'exceeded' : ''}`}
                                                style={{ width: `${Math.min(100, (summary.month_to_date / summary.budget) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="budget-progress-text">
                                            {((summary.month_to_date / summary.budget) * 100).toFixed(1)}% of ${summary.budget} budget
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="summary-card glass highlight" onClick={() => navigate('/budgets')}>
                            <span className="summary-label">Budget Settings</span>
                            <h2 className="summary-value">{summary.budget > 0 ? formatCurrency(summary.budget) : 'Set Limit'}</h2>
                            <span className="summary-link">Manage Budgets →</span>
                        </div>
                        <div className="summary-card glass highlight" onClick={() => navigate('/alerts')}>
                            <span className="summary-label">Recent Alerts</span>
                            <h2 className="summary-value">🛡️ View</h2>
                            <span className="summary-link">Check Status →</span>
                        </div>
                        <div className="summary-card glass highlight" onClick={() => navigate('/projects')}>
                            <span className="summary-label">Active Projects</span>
                            <h2 className="summary-value">{projectSpend.length}</h2>
                            <span className="summary-link">Manage Projects →</span>
                        </div>
                    </div>

                    {/* Charts Row 1: Daily Spend */}
                    <div className="chart-container glass fade-in">
                        <div className="chart-header">
                            <h3>Spend Over Time (Last 30 Days)</h3>
                            <p>Daily breakdown of combined project costs</p>
                        </div>
                        <div className="chart-body" style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailySpend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8' }}
                                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        itemStyle={{ color: '#6366f1' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total_spend"
                                        name="Daily Spend"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="charts-grid row">
                        {/* Spend by Model (Pie Chart) */}
                        <div className="chart-container glass fade-in">
                            <div className="chart-header">
                                <h3>Spend by Model</h3>
                                <p>Distribution across LLM providers</p>
                            </div>
                            <div className="chart-body" style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={modelSpend}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="total_spend"
                                            nameKey="model"
                                            label={({ model, percent }) => `${model} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {modelSpend.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Spend by Project (Bar Chart) */}
                        <div className="chart-container glass fade-in">
                            <div className="chart-header">
                                <h3>Spend by Project</h3>
                                <p>Top performing projects by cost</p>
                            </div>
                            <div className="chart-body" style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectSpend.slice(0, 5)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="project_name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                        <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                            cursor={{ fill: '#334155', opacity: 0.4 }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Bar dataKey="total_spend" name="Total Spend" radius={[4, 4, 0, 0]}>
                                            {projectSpend.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Spend by Project Table */}
                    <div className="table-container glass fade-in">
                        <div className="chart-header">
                            <h3>Project Spend Details</h3>
                            <p>Full breakdown of cost and request volume</p>
                        </div>
                        <div className="table-responsive">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Requests</th>
                                        <th>Total Spend</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectSpend.length > 0 ? (
                                        projectSpend.map((p) => (
                                            <tr key={p.project_id}>
                                                <td>{p.project_name}</td>
                                                <td>{p.request_count.toLocaleString()}</td>
                                                <td className="font-mono">{formatCurrency(p.total_spend)}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        onClick={() => navigate(`/projects/${p.project_id}`)}
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4">No spend logs recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
