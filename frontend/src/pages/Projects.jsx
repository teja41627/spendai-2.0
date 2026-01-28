import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, projectService } from '../services/api';
import './Projects.css';

function Projects() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (!authService.isAuthenticated()) {
                navigate('/login');
                return;
            }

            const userData = authService.getUser();
            setUser(userData);

            await loadProjects();
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadProjects = async () => {
        try {
            const result = await projectService.getProjects();
            setProjects(result.projects || []);
        } catch (error) {
            console.error('Error loading projects:', error);
            setError('Failed to load projects');
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Project name is required');
            return;
        }

        setSubmitting(true);

        try {
            await projectService.createProject(formData.name, formData.description);

            // Reset form and close modal
            setFormData({ name: '', description: '' });
            setShowCreateModal(false);

            // Reload projects
            await loadProjects();
        } catch (err) {
            console.error('Create project error:', err);
            setError(err.response?.data?.error || 'Failed to create project');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!selectedProject) return;

        setSubmitting(true);

        try {
            await projectService.deleteProject(selectedProject.id);

            // Close modal and reload projects
            setShowDeleteModal(false);
            setSelectedProject(null);
            await loadProjects();
        } catch (err) {
            console.error('Delete project error:', err);
            setError(err.response?.data?.error || 'Failed to delete project');
        } finally {
            setSubmitting(false);
        }
    };

    const openDeleteModal = (project) => {
        setSelectedProject(project);
        setShowDeleteModal(true);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleLogout = () => {
        authService.logout();
    };

    const goToDashboard = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="projects-loading">
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                <p>Loading projects...</p>
            </div>
        );
    }

    const isAdmin = user?.role === 'admin';

    return (
        <div className="projects-page">
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
                        <button className="btn btn-secondary" onClick={goToDashboard}>
                            Dashboard
                        </button>
                        <button className="btn btn-secondary" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Projects Section */}
            <div className="projects-header">
                <div className="projects-header-content">
                    <h1>Projects ({projects.length})</h1>
                    <div className="projects-header-actions">
                        {isAdmin && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <span>+ Create Project</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="projects-main">
                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {projects.length === 0 ? (
                    <div className="projects-empty">
                        <div className="projects-empty-icon">📁</div>
                        <p>No projects yet</p>
                        {isAdmin && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                Create Your First Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="project-card"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <div className="project-card-header">
                                    <h3 className="project-card-title">{project.name}</h3>
                                    {isAdmin && (
                                        <div className="project-card-actions">
                                            <button
                                                className="project-card-icon-btn delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteModal(project);
                                                }}
                                                title="Delete project"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p className="project-card-description">
                                    {project.description || 'No description'}
                                </p>

                                <div className="project-card-meta">
                                    <div className="project-card-created">
                                        <span className="project-card-created-label">Created</span>
                                        <span>{formatDate(project.created_at)}</span>
                                    </div>
                                    {project.creator && (
                                        <span>by {project.creator.email}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => !submitting && setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create New Project</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                                disabled={submitting}
                            >
                                ✕
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="projectName">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    id="projectName"
                                    className="form-input"
                                    placeholder="e.g., ChatBot API"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={submitting}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="projectDescription">
                                    Description (optional)
                                </label>
                                <textarea
                                    id="projectDescription"
                                    className="form-input"
                                    placeholder="Describe your project..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    disabled={submitting}
                                    rows="3"
                                    style={{ resize: 'vertical' }}
                                />
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
                                        'Create Project'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedProject && (
                <div className="modal-overlay" onClick={() => !submitting && setShowDeleteModal(false)}>
                    <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ color: '#f87171' }}>⚠️ Delete Project?</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={submitting}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="confirm-dialog-message">
                            This action is <strong>permanent</strong>. Deleting this project will revoke all associated proxy keys and stop all active traffic.
                        </p>

                        <div className="confirm-dialog-project" style={{ marginBottom: '1.5rem' }}>
                            {selectedProject.name}
                        </div>

                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>
                                To confirm, type the project name: <strong>{selectedProject.name}</strong>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Type name here..."
                                onChange={(e) => setFormData({ ...formData, deleteConfirm: e.target.value })}
                                style={{ borderColor: formData.deleteConfirm === selectedProject.name ? '#10b981' : '#ef4444' }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setFormData({ ...formData, deleteConfirm: '' });
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleDeleteProject}
                                disabled={submitting || formData.deleteConfirm !== selectedProject.name}
                                style={{ background: formData.deleteConfirm === selectedProject.name ? '#ef4444' : '#334155' }}
                            >
                                {submitting ? 'Processing...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Projects;
