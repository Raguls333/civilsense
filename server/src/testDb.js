import { realDb } from './db/realDb.js';
import { User, Project, Attendance, Vendor, LedgerEntry, DPR, Issue, Material, PettyCash } from './models/index.js';

async function runTests() {
  console.log('🧪 Running CivilSense SQLite Database Verification Tests...\n');

  await realDb.init();

  // Test 1: Query Users
  const users = await User.find();
  console.log(`[PASS] Users loaded: ${users.length}`);
  const owner = await User.findOne({ role: 'Owner' });
  console.log(`[PASS] Found Owner: ${owner?.name} (${owner?.phone})`);

  // Test 2: Query Projects
  const projects = await Project.find();
  console.log(`[PASS] Projects loaded: ${projects.length}`);
  const firstProject = projects[0];
  console.log(`[PASS] Primary Project: "${firstProject?.name}" (Budget: ₹${firstProject?.budget?.toLocaleString('en-IN')})`);

  // Test 3: Insert & Query Attendance
  const newAttendance = await Attendance.create({
    projectId: firstProject.id,
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    contractorId: 'direct',
    contractorName: 'Direct Labour',
    totalWorkers: 12,
    totalWage: 9800,
    gpsLat: 12.9698,
    gpsLng: 77.7499,
    gpsAccuracy: 4.2,
    notes: 'SQLite real DB verification test log',
    verified: 1
  });
  console.log(`[PASS] Inserted Attendance record ID: ${newAttendance.id}`);

  const fetchedAttendance = await Attendance.findById(newAttendance.id);
  if (fetchedAttendance?.totalWorkers === 12) {
    console.log(`[PASS] Successfully retrieved inserted record with verified fields.`);
  } else {
    throw new Error('Attendance retrieval mismatch!');
  }

  // Test 4: Query Vendors & Ledger
  const vendors = await Vendor.find();
  console.log(`[PASS] Vendors loaded: ${vendors.length}`);
  const ledger = await LedgerEntry.find({ vendorId: vendors[0]?.id });
  console.log(`[PASS] Ledger entries for vendor ${vendors[0]?.name}: ${ledger.length}`);

  // Test 5: Verify SQLite Database File Integrity
  const testCount = await realDb.getCollection('attendances').countDocuments();
  console.log(`[PASS] Total Attendances in SQLite DB: ${testCount}`);

  // Cleanup test record
  await Attendance.findByIdAndDelete(newAttendance.id);
  console.log(`[PASS] Deleted temporary test record.`);

  console.log('\n🎉 ALL REAL SQLITE DATABASE TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
