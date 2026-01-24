import dbAdapter from './dbAdapter.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    console.log("--- Verifying Remote Bill Creation ---");
    try {
        // 1. Fetch Vendors
        console.log("Fetching vendors...");
        const vendors = await dbAdapter.purchasing.getVendors();
        console.log(`Found ${vendors.length} vendors.`);

        if (vendors.length === 0) {
            console.error("No vendors found! Cannot test bill creation.");
            return;
        }

        const vendor = vendors[0];
        console.log(`Using Vendor: ${vendor.companyName || vendor.company_name} (ID: ${vendor.id})`);

        // 2. Create Bill Payload
        const bill = {
            id: crypto.randomUUID(),
            billNumber: `TEST-BILL-${Math.floor(Math.random() * 1000)}`,
            vendorId: vendor.id,
            vendor: vendor.companyName || vendor.company_name,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            amount: 100.50,
            status: 'Pending'
        };

        // 3. Create Bill
        console.log("Creating Bill...", bill);
        const result = await dbAdapter.purchasing.createBill(bill);
        console.log("Bill Created Successfully!", result);

        // 4. Verify/Cleanup (Optional)
        console.log("Verify: Deleting test bill...");
        await dbAdapter.purchasing.deleteBill(bill.id);
        console.log("Test bill deleted.");

    } catch (err) {
        console.error("FAILED:", err);
    }
}

run();
