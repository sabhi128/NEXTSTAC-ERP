import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import purchasingRoutes from './routes/purchasingRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

// Debug Route for DB Connection
import { supabaseAdmin } from './supabaseClient.js';
app.get('/api/debug-db', async (req, res) => {
    try {
        const envCheck = {
            HAS_URL: !!process.env.VITE_SUPABASE_URL,
            HAS_ANON: !!process.env.VITE_SUPABASE_ANON_KEY,
            HAS_SERVICE: !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
            IS_VERCEL: process.env.VERCEL === '1'
        };

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'supabaseAdmin is null', env: envCheck });
        }

        const { data, error } = await supabaseAdmin.from('products').select('*').limit(1);
        if (error) {
            return res.status(500).json({ error: error.message, details: error, env: envCheck });
        }

        res.json({ message: 'Connection Successful', count: data.length, sample: data[0], env: envCheck });
    } catch (err) {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});


// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchasing', purchasingRoutes); // Vendors
app.use('/api/system', systemRoutes);         // Logs, Profile
app.use('/api/admin', adminRoutes);           // Admin Management
app.use('/api/documents', documentRoutes);    // File Manager

// Serve Uploads
// (Imports already at top or handled via es modules, but since this is ES module, path/url imports are fine if not duplicated)
// Note: path and fileURLToPath were already imported in my previous insertion block, let's keep one content.

// If previous file had them, find where.
// Block at lines 37-41 was seemingly there or I added it?
// The file view shows I added lines 40-46 which were duplicates of 37-41?
// Let's just create one clean block.

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Financa ERP API is running');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
});

app.get('/api/debug-status', (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRole = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Check if dbAdapter's client is ready
    const isVercel = process.env.VERCEL === '1';

    res.json({
        environment: {
            isVercel: isVercel,
            nodeEnv: process.env.NODE_ENV
        },
        supabase: {
            hasUrl: !!supabaseUrl,
            hasServiceRole: !!serviceRole,
            hasAnonKey: !!anonKey,
            urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'MISSING'
        },
        system: {
            cwd: process.cwd(),
            platform: process.platform
        }
    });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
