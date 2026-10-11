import { BackupService } from '../services/backup.service.js';

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 RUNNING AUTOMATED FIRESTORE BACKUP...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const meta = await BackupService.createBackup();
    console.log(`\n🎉 Backup Completed Successfully!`);
    console.log(`- Snapshot ID:   ${meta.id}`);
    console.log(`- Total Docs:    ${meta.totalDocuments}`);
    console.log(`- Checksum:      ${meta.checksum}`);
    console.log(`- Saved File:    backups/${meta.filePath}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Backup Failed:', err);
    process.exit(1);
  }
}

main();
