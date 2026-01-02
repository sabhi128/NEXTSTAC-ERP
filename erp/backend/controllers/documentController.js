import db from '../db.js';
import dbAdapter from '../dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '../utils/activityLogger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const isVercel = process.env.VERCEL === '1';
import { supabaseAdmin as supabase } from '../supabaseClient.js'; // Ensure imported

// Multer Config
const storage = isVercel
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${Date.now()}-${uuidv4()}${ext}`);
        }
    });

export const upload = multer({ storage });

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { uploadedBy } = req.body;
        // req.user is populated by verifySupabaseToken middleware
        // For strict role checking from DB if middleware didn't attach it fully?
        // Middleware does attach req.user.role now.
        const userRole = (req.user?.role || 'user').toLowerCase();
        console.log(`[Upload] User: ${req.user?.email}, Role: ${userRole}`);

        // Restriction: Only Admins can upload? User said "Restriction... not showing".
        // Or maybe they mean the pending status logic?
        // Current logic: Super Admin -> Approved, Others -> Pending.
        const status = userRole === 'super_admin' ? 'Approved' : 'Pending';
        console.log(`[Upload] File Status set to: ${status}`);

        const id = uuidv4();
        const name = req.file.originalname;
        const type = req.file.mimetype;
        const size = formatBytes(req.file.size);

        if (isVercel) {
            // --- Vercel: Upload to Supabase Storage ---
            if (!supabase) throw new Error('Supabase client not initialized');

            const filePath = `${id}-${name}`; // Unique path in bucket

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, req.file.buffer, {
                    contentType: type,
                    upsert: false
                });

            if (uploadError) throw new Error(`Storage Upload Failed: ${uploadError.message}`);

            // 2. Insert Metadata into DB
            const { error: dbError } = await supabase
                .from('documents')
                .insert([{
                    id,
                    name,
                    type,
                    size,
                    path: filePath,
                    uploaded_by: uploadedBy || req.user?.email || 'Unknown',
                    status
                }]);

            if (dbError) throw new Error(`DB Insert Failed: ${dbError.message}`);

            logActivity(req, `Uploaded file (${status}): ${name}`, 'Documents');

            return res.status(201).json({
                id,
                name,
                type,
                size,
                uploadedBy: uploadedBy || req.user?.email,
                status,
                date: new Date().toISOString()
            });

        } else {
            // --- Local: SQLite + File System ---
            const filePath = req.file.filename; // From DiskStorage

            const sql = `INSERT INTO documents (id, name, type, size, path, uploaded_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

            db.run(sql, [id, name, type, size, filePath, uploadedBy || 'Admin', status], function (err) {
                if (err) return res.status(500).json({ error: err.message });

                logActivity(req, `Uploaded file (${status}): ${name}`, 'Documents');

                res.status(201).json({
                    id,
                    name,
                    type,
                    size,
                    uploadedBy: uploadedBy || 'Admin',
                    status,
                    date: new Date().toISOString()
                });
            });
        }

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload file: ' + error.message });
    }
};



export const getFiles = async (req, res) => {
    const userEmail = req.user?.email || '';
    console.log(`[getFiles] Requesting User: ${userEmail}`);

    try {
        let userRole = 'user';
        let userName = '';

        // Unified User Lookup via dbAdapter
        const userProfile = await dbAdapter.findUserByEmail(userEmail);
        if (userProfile) {
            userRole = (userProfile.role || 'user').toLowerCase(); // Normalize case!
            userName = userProfile.name || '';
            console.log(`[getFiles] Found Profile - Role: ${userRole}, Name: ${userName}`);
        } else {
            console.warn(`[getFiles] User profile not found for ${userEmail}`);
        }

        let files = [];
        if (isVercel) {
            // Vercel: Fetch from Supabase
            const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            files = data.map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                size: row.size,
                uploadedBy: row.uploaded_by,
                status: row.status || 'Approved',
                date: row.created_at,
                path: row.path
            }));
        } else {
            // Local: Fetch from SQLite
            files = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM documents ORDER BY created_at DESC", [], (err, rows) => {
                    if (err) reject(err); else resolve(rows);
                });
            }).then(rows => rows.map(row => ({
                id: row.id,
                name: row.name,
                type: row.type,
                size: row.size,
                uploadedBy: row.uploaded_by,
                status: row.status || 'Approved',
                date: row.created_at,
                path: row.path
            })));
        }

        console.log(`[getFiles] Total Files Fetched: ${files.length}`);
        files.forEach(f => console.log(` - File: ${f.name} [${f.status}] by ${f.uploadedBy}`));

        // Filter Logic
        const finalFiles = userRole === 'super_admin'
            ? files
            : files.filter(f => f.status === 'Approved' || f.uploadedBy === userEmail || (userName && f.uploadedBy === userName) || f.uploadedBy === req.user?.name);

        console.log(`[getFiles] Final Files Returning: ${finalFiles.length} (Role: ${userRole})`);

        res.json(finalFiles);

    } catch (error) {
        console.error('getFiles Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteFile = async (req, res) => {
    const { id } = req.params;

    try {
        let filePath = '';
        let fileName = '';

        if (isVercel) {
            const { data, error } = await supabase.from('documents').select('path, name').eq('id', id).single();
            if (error) {
                // If not found, maybe just delete from storage if possible?
                return res.status(404).json({ error: 'File not found' });
            }
            filePath = data.path;
            fileName = data.name;

            // Delete from Storage
            const { error: storageError } = await supabase.storage.from('documents').remove([filePath]);
            if (storageError) console.warn('Storage delete failed:', storageError.message);

            // Delete from DB
            const { error: dbError } = await supabase.from('documents').delete().eq('id', id);
            if (dbError) throw new Error(dbError.message);

        } else {
            // Local SQLite
            const row = await new Promise((resolve, reject) => {
                db.get("SELECT path, name FROM documents WHERE id = ?", [id], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });

            if (!row) return res.status(404).json({ error: 'File not found' });
            filePath = path.join(uploadDir, row.path);
            fileName = row.name;

            // Delete from FS
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.warn('Failed to delete physical file:', e.message);
                }
            }

            // Delete from DB
            await new Promise((resolve, reject) => {
                db.run("DELETE FROM documents WHERE id = ?", [id], function (err) {
                    if (err) reject(err); else resolve();
                });
            });
        }

        logActivity(req, `Deleted file: ${fileName}`, 'Documents');
        res.json({ message: 'File deleted successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const approveFile = async (req, res) => {
    const { id } = req.params;
    const userEmail = req.user?.email || '';

    try {
        let userRole = 'user';
        const userProfile = await dbAdapter.findUserByEmail(userEmail);
        if (userProfile) {
            userRole = userProfile.role || 'user';
        }

        if (userRole !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });

        if (isVercel) {
            const { error } = await supabase.from('documents').update({ status: 'Approved' }).eq('id', id);
            if (error) throw new Error(error.message);
        } else {
            await new Promise((resolve, reject) => {
                db.run("UPDATE documents SET status = 'Approved' WHERE id = ?", [id], function (err) {
                    if (err) reject(err); else resolve();
                });
            });
        }

        logActivity(req, `Approved file: ${id}`, 'Documents');
        res.json({ message: 'File approved' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const rejectFile = async (req, res) => {
    const userEmail = req.user?.email || '';

    try {
        let userRole = 'user';
        const userProfile = await dbAdapter.findUserByEmail(userEmail);
        if (userProfile) {
            userRole = userProfile.role || 'user';
        }

        if (userRole !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });

        // Reuse delete logic
        await deleteFile(req, res);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const downloadFile = async (req, res) => {
    const { id } = req.params;

    try {
        if (isVercel) {
            const { data: row, error } = await supabase.from('documents').select('*').eq('id', id).single();
            if (error || !row) return res.status(404).json({ error: 'File not found' });

            const userRole = (req.user?.role || 'user').toLowerCase();
            // Optional: enforce pending check if needed (skipped for now to match local logic)

            // Generate Signed URL
            const { data, error: signedError } = await supabase.storage
                .from('documents')
                .createSignedUrl(row.path, 60); // Valid for 60 seconds

            if (signedError) throw new Error(signedError.message);

            // Redirect to signed URL
            return res.redirect(data.signedUrl);
        } else {
            // Local SQLite
            const row = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM documents WHERE id = ?", [id], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });

            if (!row) return res.status(404).json({ error: 'File not found' });

            const filePath = path.join(uploadDir, row.path);
            if (fs.existsSync(filePath)) {
                res.download(filePath, row.name);
            } else {
                res.status(404).json({ error: 'Physical file missing' });
            }
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Helper
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
