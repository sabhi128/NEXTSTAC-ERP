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
// Helper to refresh the session
const refreshSession = async () => {
    try {
        let sessionData = sessionStorage.getItem('app_session');
        if (!sessionData) sessionData = localStorage.getItem('app_session');

        if (!sessionData) return null;

        const session = JSON.parse(sessionData);
        if (!session.refresh_token) return null;

        console.log('[API] Attempting to refresh session...');
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: session.refresh_token
        });

        if (error || !data.user || !data.session) {
            console.error('Session refresh failed:', error);
            // Clear session to force login
            sessionStorage.removeItem('app_session');
            localStorage.removeItem('app_session');
            window.location.href = '/login';
            return null;
        }

        // Update session storage
        const newSessionData = {
            ...session,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expiresAt: Date.now() + (12 * 60 * 60 * 1000) // Reset our local clock
        };
        sessionStorage.setItem('app_session', JSON.stringify(newSessionData));
        console.log('[API] Session refreshed successfully');

        return data.session.access_token;
    } catch (err) {
        console.error('Error refreshing session:', err);
        return null;
    }
};

/**
 * Make authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
    let token = await getAuthToken();
    console.log(`[API DEBUG] Request to ${endpoint} with token: ${token ? token.substring(0, 10) + '...' : 'NONE'}`);

    const getHeaders = (authToken) => {
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        // If body is FormData, we MUST NOT set Content-Type
        if (options.body instanceof FormData || (options.headers && options.headers['Content-Type'] === undefined)) {
            delete headers['Content-Type'];
        }
        return headers;
    };

    const config = {
        ...options,
        headers: getHeaders(token)
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    let response = await fetch(url, config);

    // Handle 401 Unauthorized - Attempt Refresh
    if (response.status === 401) {
        console.warn('[API] 401 Unauthorized. Attempting refresh...');
        const newToken = await refreshSession();

        if (newToken) {
            console.log('[API] Retrying request with new token...');
            // Retry with new token
            config.headers = getHeaders(newToken);
            response = await fetch(url, config);
        }
    }

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
