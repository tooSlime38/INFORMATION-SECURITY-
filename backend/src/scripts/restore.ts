import { BackupService } from '../services/backup.service.js';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('♻️ RUNNING DATABASE RESTORATION & DISASTER RECOVERY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const backups = await BackupService.listBackups();

  if (backups.length === 0) {
    console.error('❌ No backup snapshots found in backend/backups/');
    process.exit(1);
  }

  // Restore the latest backup
  const latestBackup = backups[0];
  console.log(`Selecting latest backup snapshot: ${latestBackup.id}`);
  console.log(`Snapshot contains: ${latestBackup.totalDocuments} documents`);

  try {
    const result = await BackupService.restoreBackup(latestBackup.id);
    console.log(`\n🎉 Disaster Recovery Completed!`);
    console.log(`- Restored Docs: ${result.restoredDocuments}`);
    console.log(`- Snapshot ID:   ${latestBackup.id}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Restoration Failed:', err);
    process.exit(1);
  }
}

main();
