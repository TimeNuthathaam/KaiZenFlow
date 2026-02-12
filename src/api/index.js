// Always use relative /api path - nginx proxy handles routing in production
const API_BASE = '/api';

class ApiClient {
    constructor() {
        this._eventSource = null;
        this._listeners = new Set();
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // ==========================================
    // SSE Real-time Events
    // ==========================================

    /**
     * Subscribe to real-time data changes
     * @param {function} callback - Called with { type, data, timestamp }
     * @returns {function} unsubscribe function
     */
    onDataChange(callback) {
        this._listeners.add(callback);

        // Start SSE connection if not already running
        if (!this._eventSource) {
            this._connectSSE();
        }

        return () => {
            this._listeners.delete(callback);
            if (this._listeners.size === 0 && this._eventSource) {
                this._eventSource.close();
                this._eventSource = null;
            }
        };
    }

    _connectSSE() {
        this._eventSource = new EventSource(`${API_BASE}/events`);

        this._eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                for (const listener of this._listeners) {
                    listener(data);
                }
            } catch (e) {
                console.error('SSE parse error:', e);
            }
        };

        this._eventSource.onerror = () => {
            console.warn('SSE connection lost, reconnecting in 3s...');
            this._eventSource?.close();
            this._eventSource = null;
            setTimeout(() => {
                if (this._listeners.size > 0) {
                    this._connectSSE();
                }
            }, 3000);
        };
    }

    // Tasks
    async getTasks() {
        return this.request('/tasks');
    }

    async createTask(title, options = {}) {
        return this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify({ title, bucket: options.bucket || 'unsorted', ...options }),
        });
    }

    async updateTask(id, updates) {
        return this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteTask(id) {
        return this.request(`/tasks/${id}`, {
            method: 'DELETE',
        });
    }

    async reorderTasks(tasks) {
        return this.request('/tasks/reorder', {
            method: 'POST',
            body: JSON.stringify({ tasks }),
        });
    }

    // Sprints
    async getActiveSprint() {
        return this.request('/sprints/active');
    }

    async startSprint(bucket) {
        return this.request('/sprints/start', {
            method: 'POST',
            body: JSON.stringify({ bucket }),
        });
    }

    async stopSprint() {
        return this.request('/sprints/stop', {
            method: 'POST',
        });
    }

    async getSprintHistory(limit = 20) {
        return this.request(`/sprints/history?limit=${limit}`);
    }

    // Kaizen Logs
    async getKaizenLogs(limit = 50) {
        return this.request(`/kaizen-logs?limit=${limit}`);
    }

    async getKaizenStats() {
        return this.request('/kaizen-logs/stats');
    }

    async createKaizenLog(data) {
        return this.request('/kaizen-logs', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

export const api = new ApiClient();
export default api;
