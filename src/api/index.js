// Use port 3001 for API in production (serve on port 80 doesn't proxy)
const API_BASE = window.location.port === '5173'
    ? '/api'  // Dev mode - vite proxy
    : `${window.location.protocol}//${window.location.hostname}:3001/api`;  // Production

class ApiClient {
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

    // Tasks
    async getTasks() {
        return this.request('/tasks');
    }

    async createTask(title, bucket = 'unsorted') {
        return this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify({ title, bucket }),
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
