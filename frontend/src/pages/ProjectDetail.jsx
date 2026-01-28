import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService, projectService, proxyKeyService } from '../services/api';
import './ProjectDetail.css';

function ProjectDetail() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [project, setProject] = useState(null);
    const [proxyKeys, setProxyKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal & form states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [newKeyData, setNewKeyData] = useState(null);

    const [formData, setFormData] = useState({ name: '' });
    const [submitting, setSubmitting] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        try {
            if (!authService.isAuthenticated()) {
                navigate('/login');
                return;
            }

            const userData = authService.getUser();
            setUser(userData);

            await Promise.all([
                loadProject(),
                loadProxyKeys()
            ]);

        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load project data');
        } finally {
            setLoading(false);
        }
    };

    const loadProject = async () => {
        try {
            const result = await projectService.getProject(projectId);
            setProject(result.project);
        } catch (error) {
            console.error('Error loading project:', error);
            if (error.response?.status === 404) {
                setError('Project not found');
            } else {
                setError('Failed to load project');
            }
        }
    };

    const loadProxyKeys = async () => {
        try {
            const result = await proxyKeyService.getProxyKeys(projectId);
            setProxyKeys(result.keys || []);
        } catch (error) {
            console.error('Error loading proxy keys:', error);
            // Non-critical, don't show error
        }
    };

    const handleCreateKey = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const result = await proxyKeyService.createProxyKey(projectId, formData.name);

            // Show new key data (only time it's visible)
            setNewKeyData(result.key);

            // Reset form and close modal
            setFormData({ name: '' });
            setShowCreateModal(false);

            // Reload keys list
            await loadProxyKeys();
        } catch (err) {
            console.error('Create key error:', err);
            setError(err.response?.data?.error || 'Failed to create proxy key');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevokeKey = async () => {
        if (!selectedKey) return;

        setSubmitting(true);

        try {
            await proxyKeyService.revokeProxyKey(selectedKey.id);

            // Close modal and reload keys
            setShowRevokeModal(false);
            setSelectedKey(null);
            await loadProxyKeys();
        } catch (err) {
            console.error('Revoke key error:', err);
            setError(err.response?.data?.error || 'Failed to revoke key');
        } finally {
            setSubmitting(false);
        }
    };

    const openRevokeModal = (key) => {
        setSelectedKey(key);
        setShowRevokeModal(true);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const dismissNewKey = () => {
        setNewKeyData(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleLogout = () => {
        authService.logout();
    };

    if (loading) {
        return (
            <div className="projects-loading">
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                <p>Loading project...</p>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="projects-loading">
                <p style={{ color: 'var(--error)' }}>{error}</p>
                <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
                    Back to Projects
                </button>
            </div>
        );
    }

    const isAdmin = user?.role === 'admin';
    const activeKeys = proxyKeys.filter(k => k.is_active);
    const revokedKeys = proxyKeys.filter(k => !k.is_active);

    return (
        <div className="project-detail-page">
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo">
                        <span className="logo-icon">🚀</span>
                        <span className="logo-text">SpendAI</span>
                    </div>

                    <div className="dashboard-user">
                        <div className="user-info">
                            <span className="user-name">{user?.email}</span>
                            <span className="user-org">{user?.organization?.name}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                        <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
                            Projects
                        </button>
                        <button className="btn btn-secondary" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Project Detail Header */}
            <div className="project-detail-header">
                <div className="project-detail-header-content">
                    <div className="project-detail-breadcrumb">
                        <span className="breadcrumb-link" onClick={() => navigate('/projects')}>
                            Projects
                        </span>
                        <span>›</span>
                        <span>{project?.name}</span>
                    </div>
                    <div className="project-detail-title-section">
                        <h1 className="project-detail-title">{project?.name}</h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="project-detail-main">
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
                        {error}
                    </div>
                )}

                {/* Project Info Card */}
                <div className="project-info-card">
                    <div className="project-info-grid">
                        <div className="project-info-item">
                            <span className="project-info-label">Description</span>
                            <span className="project-info-value">
                                {project?.description || 'No description'}
                            </span>
                        </div>
                        <div className="project-info-item">
                            <span className="project-info-label">Created</span>
                            <span className="project-info-value">{formatDate(project?.created_at)}</span>
                        </div>
                        <div className="project-info-item">
                            <span className="project-info-label">Created By</span>
                            <span className="project-info-value">{project?.creator?.email}</span>
                        </div>
                        <div className="project-info-item">
                            <span className="project-info-label">Project ID</span>
                            <span className="project-info-value code">{project?.id}</span>
                        </div>
                        {project?.monthly_budget_usd > 0 && (
                            <div className="project-info-item budget-span">
                                <span className="project-info-label">Monthly Budget Utilization</span>
                                <div className="budget-progress-container" style={{ marginTop: '0.25rem' }}>
                                    <div className="budget-progress-bar">
                                        <div
                                            className={`budget-progress-fill ${project.mtd_spend > project.monthly_budget_usd ? 'exceeded' : ''}`}
                                            style={{ width: `${Math.min(100, (project.mtd_spend / project.monthly_budget_usd) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="budget-progress-text">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.mtd_spend || 0)}
                                        {' '} of ${project.monthly_budget_usd} ({((project.mtd_spend / project.monthly_budget_usd) * 100).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* New Key Display (if just created) */}
                {newKeyData && (
                    <div className="new-key-display">
                        <div className="new-key-warning">
                            <span>⚠️</span>
                            <span>Save this key now! It will only be shown once.</span>
                        </div>
                        <div className="new-key-value-display">
                            <div className="new-key-value-text">{newKeyData.keyValue}</div>
                            <button
                                className={`copy-key-btn ${copiedKey ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(newKeyData.keyValue)}
                            >
                                {copiedKey ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                        <p className="new-key-note">
                            This is your proxy API key. Store it securely. You won't be able to see the full key again.
                        </p>
                        <button className="btn btn-secondary" onClick={dismissNewKey}>
                            I've saved it
                        </button>
                    </div>
                )}

                {/* Proxy Keys Section */}
                <div className="proxy-keys-section">
                    <div className="proxy-keys-header">
                        <div>
                            <h2 className="proxy-keys-title">Proxy API Keys</h2>
                            <div className="proxy-keys-stats">
                                <div className="stat-item">
                                    <span>Active:</span>
                                    <span className="stat-value" style={{ color: 'var(--success)' }}>
                                        {activeKeys.length}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span>Revoked:</span>
                                    <span className="stat-value" style={{ color: 'var(--error)' }}>
                                        {revokedKeys.length}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span>Total:</span>
                                    <span className="stat-value">{proxyKeys.length}</span>
                                </div>
                            </div>
                        </div>
                        {isAdmin && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                + Create Key
                            </button>
                        )}
                    </div>

                    {/* Keys List */}
                    {proxyKeys.length === 0 ? (
                        <div className="proxy-keys-empty">
                            <div className="proxy-keys-empty-icon">🔑</div>
                            <p>No proxy keys yet</p>
                            {isAdmin && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowCreateModal(true)}
                                    style={{ marginTop: 'var(--spacing-md)' }}
                                >
                                    Create Your First Key
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="proxy-keys-list">
                            {proxyKeys.map((key) => (
                                <div
                                    key={key.id}
                                    className={`proxy-key-item ${!key.is_active ? 'revoked' : ''}`}
                                >
                                    <div className="proxy-key-info">
                                        <div className="proxy-key-name">
                                            <span>{key.name}</span>
                                            <span className={`key-status-badge ${key.is_active ? 'active' : 'revoked'}`}>
                                                {key.is_active ? 'Active' : 'Revoked'}
                                            </span>
                                        </div>
                                        <div className="proxy-key-value">
                                            {key.masked}
                                        </div>
                                        <div className="proxy-key-meta">
                                            Created {formatDate(key.created_at)}
                                            {!key.is_active && key.revoked_at &&
                                                ` • Revoked ${formatDate(key.revoked_at)}`
                                            }
                                        </div>
                                    </div>
                                    <div className="proxy-key-actions">
                                        {isAdmin && key.is_active && (
                                            <button
                                                className="key-action-btn revoke"
                                                onClick={() => openRevokeModal(key)}
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Key Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => !submitting && setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Proxy API Key</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                                disabled={submitting}
                            >
                                ✕
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleCreateKey}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="keyName">
                                    Key Name (optional)
                                </label>
                                <input
                                    type="text"
                                    id="keyName"
                                    className="form-input"
                                    placeholder="e.g., Production Key"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    disabled={submitting}
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    If not provided, a masked version will be used as the name
                                </small>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="spinner"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        'Generate Key'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Revoke Key Modal */}
            {showRevokeModal && selectedKey && (
                <div className="modal-overlay" onClick={() => !submitting && setShowRevokeModal(false)}>
                    <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ color: '#f87171' }}>⚠️ Revoke Proxy Key?</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowRevokeModal(false)}
                                disabled={submitting}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="confirm-dialog-message">
                            This will <strong>immediately</strong> stop all requests using this key. Any applications relying on this key will lose access to SpendAI.
                        </p>

                        <div className="confirm-dialog-project">
                            {selectedKey.name}
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowRevokeModal(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleRevokeKey}
                                disabled={submitting}
                                style={{ background: '#ef4444' }}
                            >
                                {submitting ? 'Revoking...' : 'Confirm Revocation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectDetail;
