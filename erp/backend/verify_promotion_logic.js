import dbAdapter from './dbAdapter.js';
import { v4 as uuidv4 } from 'uuid';

async function runTest() {
    console.log("--- Verifying Promotion Logic (Direct DB Adapter) ---");

    try {
        // 1. Create Employee
        const empId = uuidv4();
        const emp = {
            id: empId,
            firstName: 'Promo',
            lastName: 'Tester',
            email: `promo_${Date.now()}@test.com`,
            position: 'Junior Dev',
            department: 'Engineering',
            salary: '50000',
            promotionLevel: 'L1',
            status: 'Active',
            joinDate: new Date().toISOString(),
            phone: '1234567890',
            address: '123 Test St',
            cnic: '00000-0000000-0'
        };

        console.log("1. Creating Employee:", emp.firstName);
        await dbAdapter.hr.createEmployee(emp);
        console.log("   - Created.");

        // 2. Update Employee (Promote)
        console.log("2. Promoting Employee (Junior -> Senior)...");
        const updates = {
            position: 'Senior Dev',
            salary: '80000',
            promotionLevel: 'L2',
            updatedBy: 'TestScript'
        };
        await dbAdapter.hr.updateEmployee(empId, updates);
        console.log("   - Updated.");

        // 3. Check History
        console.log("3. Fetching History...");
        const history = await dbAdapter.hr.getEmployeeHistory(empId);
        console.log("   - History Records Found:", history.length);

        if (history.length > 0) {
            const record = history[0];
            console.log("   - Latest Record:", record);

            // Assertions
            const passed =
                record.old_position === 'Junior Dev' &&
                record.new_position === 'Senior Dev' &&
                record.old_level === 'L1' &&
                record.new_level === 'L2' &&
                record.old_salary === '50000' &&
                record.new_salary === '80000';

            if (passed) {
                console.log("✅ SUCCESS: History record accurately reflects the promotion.");
            } else {
                console.error("❌ FAILURE: History record mismatch.", record);
            }
        } else {
            console.error("❌ FAILURE: No history record created.");
        }

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

runTest();
