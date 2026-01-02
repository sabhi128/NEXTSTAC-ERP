import supabase from '../supabaseClient.js';
import dbAdapter from '../dbAdapter.js';

/**
 * Middleware to verify Supabase JWT tokens
 * Protects backend routes by validating the Authorization header
 */
export const verifySupabaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized - No token provided' });
        }

        const token = authHeader.split(' ')[1];

        if (!supabase) {
            console.error('[AUTH ERROR] Supabase client is not initialized. Check Env Vars.');
            return res.status(500).json({ error: 'Server Configuration Error: Supabase Missing' });
        }

        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('[AUTH DEBUG] Token verification failed:', error?.message || 'No user', 'Token:', token.substring(0, 10) + '...');
            return res.status(401).json({ error: `Unauthorized - ${error?.message || 'Invalid token or User not found'}` });
        }

        // Fetch user profile from database to get the Role
        // Supabase Auth user object doesn't have our app-specific 'role' field by default
        let userRole = 'user';
        try {
            const profile = await dbAdapter.findUserByEmail(user.email);
            if (profile) {
                userRole = profile.role || 'user';
            } else {
                console.warn('[AUTH DEBUG] User profile not found in DB for email:', user.email);
            }
        } catch (dbError) {
            console.error('[AUTH DEBUG] DB Profile fetch failed:', dbError);
        }

        // Attach user to request object for use in route handlers
        req.user = { ...user, role: userRole };
        req.userId = user.id;
        req.userEmail = user.email;

        console.log('[AUTH DEBUG] Token verified for:', user.email, 'Role:', userRole);

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Optional middleware for admin-only routes
 * Must be used after verifySupabaseToken
 */
export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.userEmail) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch user profile from database to check role
        const { data: userProfile, error } = await supabase
            .from('users')
            .select('role')
            .eq('email', req.userEmail)
            .single();

        if (error || !userProfile) {
            return res.status(403).json({ error: 'Forbidden - User profile not found' });
        }

        if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden - Admin access required' });
        }

        req.userRole = userProfile.role;
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
