import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/**
 * Authentication Service
 */
export const authService = {
    /**
     * Sign up a new user
     */
    async signup(email, password, organizationName) {
        const response = await api.post('/api/auth/signup', {
            email,
            password,
            organizationName
        });
        return response.data;
    },

    /**
     * Log in an existing user
     */
    async login(email, password) {
        const response = await api.post('/api/auth/login', {
            email,
            password
        });

        const { session, user, organization } = response.data;

        // Store session data
        if (session) {
            localStorage.setItem('accessToken', session.accessToken);
            localStorage.setItem('user', JSON.stringify({ ...user, organization }));
        }

        return response.data;
    },

    /**
     * Log out current user
     */
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    /**
     * Get current user profile
     */
    async getCurrentUser() {
        const response = await api.get('/api/auth/me');
        return response.data;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },

    /**
     * Get stored user data
     */
    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};

/**
 * Project Service
 */
export const projectService = {
    /**
     * Get all projects for the organization
     */
    async getProjects() {
        const response = await api.get('/api/projects');
        return response.data;
    },

    /**
     * Get a single project by ID
     */
    async getProject(projectId) {
        const response = await api.get(`/api/projects/${projectId}`);
        return response.data;
    },

    /**
     * Create a new project
     */
    async createProject(name, description = '') {
        const response = await api.post('/api/projects', {
            name,
            description
        });
        return response.data;
    },

    /**
     * Update a project
     */
    async updateProject(projectId, updates) {
        const response = await api.put(`/api/projects/${projectId}`, updates);
        return response.data;
    },

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        const response = await api.delete(`/api/projects/${projectId}`);
        return response.data;
    },

    /**
     * Get project count
     */
    async getProjectCount() {
        const response = await api.get('/api/projects/count');
        return response.data;
    }
};

/**
 * Proxy Key Service
 */
export const proxyKeyService = {
    /**
     * Get all proxy keys for a project
     */
    async getProxyKeys(projectId) {
        const response = await api.get(`/api/proxy-keys/project/${projectId}`);
        return response.data;
    },

    /**
     * Get a single proxy key by ID
     */
    async getProxyKey(keyId) {
        const response = await api.get(`/api/proxy-keys/${keyId}`);
        return response.data;
    },

    /**
     * Create a new proxy key
     */
    async createProxyKey(projectId, name = '') {
        const response = await api.post('/api/proxy-keys', {
            projectId,
            name
        });
        return response.data;
    },

    /**
     * Revoke a proxy key
     */
    async revokeProxyKey(keyId) {
        const response = await api.post(`/api/proxy-keys/${keyId}/revoke`);
        return response.data;
    },

    /**
     * Get key count for a project
     */
    async getKeyCount(projectId) {
        const response = await api.get(`/api/proxy-keys/project/${projectId}/count`);
        return response.data;
    }
};

/**
 * Analytics Service
 */
export const analyticsService = {
    /**
     * Get spend summary
     */
    async getSummary() {
        const response = await api.get('/api/analytics/summary');
        return response.data;
    },

    /**
     * Get spend by project
     */
    async getProjectSpend() {
        const response = await api.get('/api/analytics/projects');
        return response.data;
    },

    /**
     * Get spend by model
     */
    async getModelSpend() {
        const response = await api.get('/api/analytics/models');
        return response.data;
    },

    /**
     * Get daily spend over time
     */
    async getDailySpend() {
        const response = await api.get('/api/analytics/daily');
        return response.data;
    }
};

/**
 * Budget Service
 */
export const budgetService = {
    /**
     * Get budget summary and MTD spend
     */
    async getSummary() {
        const response = await api.get('/api/budgets/summary');
        return response.data;
    },

    /**
     * Update organization budget
     */
    async updateOrgBudget(budget) {
        const response = await api.put('/api/budgets/org', { budget });
        return response.data;
    },

    /**
     * Update project budget
     */
    async updateProjectBudget(projectId, budget) {
        const response = await api.put(`/api/budgets/projects/${projectId}`, { budget });
        return response.data;
    },

    /**
     * Get triggered alerts
     */
    async getAlerts() {
        const response = await api.get('/api/budgets/alerts');
        return response.data;
    }
};

export default api;
