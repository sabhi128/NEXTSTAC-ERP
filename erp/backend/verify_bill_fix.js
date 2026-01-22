
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Mock Vercel environment for the adapter
process.env.VERCEL = '1';

import dbAdapter from './dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

async function verifyBillCreation() {
    console.log("Starting Verification of Bill Creation Fix...");

    try {
        // 1. Get a vendor to associate with
        console.log("Fetching vendors...");
        const vendors = await dbAdapter.purchasing.getVendors();
        if (vendors.length === 0) {
            console.error("No vendors found. Cannot verify bill creation.");
            return;
        }
        const vendor = vendors[0];
        console.log(`Using Vendor: ${vendor.companyName || vendor.company_name} (ID: ${vendor.id})`);

        // 2. Create a test bill payload (mimicking controller output)
        const testBill = {
            id: uuidv4(),
            billNumber: `TEST-FIX-${Math.floor(Math.random() * 1000)}`,
            vendor: vendor.companyName || vendor.company_name, // Should be ignored/unused by adapter for DB insert
            vendorId: vendor.id, // THE FIX: This should be used
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            amount: 150.00,
            status: 'Pending'
        };

        console.log("Attempting to create bill:", testBill);

        // 3. Call adapter
        const result = await dbAdapter.purchasing.createBill(testBill);
        console.log("SUCCESS! Bill created:", result);

        // 4. Verify it exists
        const bills = await dbAdapter.purchasing.getBills();
        const found = bills.find(b => b.id === testBill.id);

        if (found) {
            console.log("VERIFIED: Found created bill in database.");
            console.log("Bill Details:", found);

            // Cleanup
            await dbAdapter.purchasing.deleteBill(testBill.id);
            console.log("Cleanup: Test bill deleted.");
        } else {
            console.error("FAILED: Bill created but not found in list.");
        }

    } catch (error) {
        console.error("VERIFICATION FAILED with Error:", error);
    }
}

verifyBillCreation();
