import dbAdapter from '../dbAdapter.js';
import { supabaseAdmin } from '../supabaseClient.js';

// Get all admin users
export const getAdmins = async (req, res) => {
    try {
        // Fetch all users from database
        const users = await dbAdapter.getAllUsers();

        // Transform to match frontend expectations  
        const admins = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status || 'Active',
            sharePercentage: user.share_percentage || 0,
            department: user.department
        }));

        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update admin user
export const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Convert camelCase to snake_case for database
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.sharePercentage !== undefined) dbUpdates.share_percentage = updates.sharePercentage;
        if (updates.department !== undefined) dbUpdates.department = updates.department;

        // handle password update if provided (e.g. CNIC reset)
        if (updates.password) {
            if (supabaseAdmin) {
                const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
                    password: updates.password
                });
                if (authError) {
                    console.error('Failed to update password in Auth:', authError);
                    throw new Error('Failed to update password: ' + authError.message);
                }
                console.log(`Password updated for user ${id}`);
            } else {
                console.warn('Cannot update password: supabaseAdmin missing');
            }
        }

        await dbAdapter.updateUser(id, dbUpdates);

        const updatedUser = await dbAdapter.findUserById(id);

        res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            sharePercentage: updatedUser.share_percentage,
            department: updatedUser.department
        });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete admin user
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        await dbAdapter.deleteUser(id);

        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get compensation config
export const getCompensationConfig = async (req, res) => {
    try {
        const basePool = await dbAdapter.getSetting('base_pool');
        res.json({
            basePool: parseFloat(basePool) || 10000
        });
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update compensation config
export const updateCompensationConfig = async (req, res) => {
    try {
        const { basePool } = req.body;
        await dbAdapter.setSetting('base_pool', basePool);
        res.json({ basePool });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ error: error.message });
    }
};
