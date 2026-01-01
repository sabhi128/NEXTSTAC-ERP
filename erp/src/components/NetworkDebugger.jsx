import React, { useState, useEffect } from 'react';

const NetworkDebugger = () => {
    const [healthStatus, setHealthStatus] = useState('Checking...');
    const [envVars, setEnvVars] = useState({});
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                // Try to hit the health endpoint
                const res = await fetch('/api/health');
                const text = await res.text();
                setHealthStatus(res.ok ? `OK: ${text}` : `Error: ${res.status} ${res.statusText}`);
            } catch (e) {
                setHealthStatus(`Request Failed: ${e.message}`);
            }
        };

        setEnvVars({
            VITE_API_URL: import.meta.env.VITE_API_URL,
            VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
            VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set (Hidden)' : 'Missing',
            BASE_URL: window.location.origin
        });

        checkHealth();
    }, []);

    if (!isVisible) return <button onClick={() => setIsVisible(true)} style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999 }}>🐞</button>;

    return (
        <div style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: '350px',
            backgroundColor: '#1e293b',
            color: '#fff',
            padding: '15px',
            borderRadius: '8px',
            zIndex: 9999,
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            fontFamily: 'monospace'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>🐞 Vercel Debugger</strong>
                <button onClick={() => setIsVisible(false)}>X</button>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <strong>Health Check (/api/health):</strong>
                <div style={{ color: healthStatus.startsWith('OK') ? '#4ade80' : '#f87171' }}>
                    {healthStatus}
                </div>
            </div>

            <div>
                <strong>Env Variables:</strong>
                <pre style={{ overflow: 'auto' }}>
                    {JSON.stringify(envVars, null, 2)}
                </pre>
            </div>

            <div style={{ marginTop: '10px', borderTop: '1px solid #334155', paddingTop: '5px' }}>
                <p>If Health is Error/Failed, the Backend is likely not running or unreachable.</p>
            </div>
        </div>
    );
};

export default NetworkDebugger;
