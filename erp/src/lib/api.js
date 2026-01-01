import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Get current Supabase session token from manual localStorage
 * NOTE: We use manual session management because Supabase's built-in persistence was causing hangs
 */
const getAuthToken = async () => {
    try {
        // Read from manual session (check sessionStorage first, then legacy localStorage)
        let sessionData = sessionStorage.getItem('app_session');

        if (!sessionData) {
            sessionData = localStorage.getItem('app_session');
        }

        if (!sessionData) {
            return '';
        }

        const session = JSON.parse(sessionData);
        return session.access_token || '';
    } catch (error) {
        console.error('Error getting auth token:', error);
        return '';
    }
};

/**
 * Make authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
    const token = await getAuthToken();
    console.log(`[API DEBUG] Request to ${endpoint} with token: ${token ? token.substring(0, 10) + '...' : 'NONE'}`);

    // Default headers only set Content-Type if it's not being overridden/cleared
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    // If body is FormData, we MUST NOT set Content-Type (browser sets it with boundary)
    // We check if it was cleared or if body is FormData instance
    if (options.body instanceof FormData || (options.headers && options.headers['Content-Type'] === undefined)) {
        delete headers['Content-Type'];
    }

    const config = {
        ...options,
        headers
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    // For DELETE requests, return simple success
    if (options.method === 'DELETE') {
        return { success: true };
    }

    return response.json();
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),

    post: (endpoint, data) => {
        const isFormData = data instanceof FormData;
        const body = isFormData ? data : JSON.stringify(data);
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };

        return apiRequest(endpoint, {
            method: 'POST',
            body,
            headers
        });
    },

    put: (endpoint, data) => {
        const isFormData = data instanceof FormData;
        const body = isFormData ? data : JSON.stringify(data);
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };

        return apiRequest(endpoint, {
            method: 'PUT',
            body,
            headers
        });
    },

    patch: (endpoint, data) => {
        const isFormData = data instanceof FormData;
        const body = isFormData ? data : JSON.stringify(data);
        const headers = isFormData ? {} : { 'Content-Type': 'application/json' };

        return apiRequest(endpoint, {
            method: 'PATCH',
            body,
            headers
        });
    },

    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};
