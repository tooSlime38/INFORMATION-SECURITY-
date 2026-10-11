import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { db } from '../config/firebase.js';
import { AuditService } from './audit.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../../backups');

export interface BackupMetadata {
  id: string;
  timestamp: string;
  collections: string[];
  totalDocuments: number;
  checksum: string; // SHA-256 of the backup payload
  filePath: string;
  status: 'COMPLETED' | 'FAILED';
}

export class BackupService {
  private static readonly TARGET_COLLECTIONS = [
    'users',
    'usernames',
    'twoFactor',
    'sessions',
    'auditLogs',
  ];

  private static ensureBackupDir(): void {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  /**
   * Executes a full snapshot export of all Firestore collections.
   */
  public static async createBackup(): Promise<BackupMetadata> {
    this.ensureBackupDir();
    const backupId = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const timestamp = new Date().toISOString();
    const exportData: Record<string, any[]> = {};
    let totalDocs = 0;

    console.log(`📦 [Backup] Starting backup operation: ${backupId}`);

    try {
      for (const colName of this.TARGET_COLLECTIONS) {
        const snapshot = await db.collection(colName).get();
        exportData[colName] = snapshot.docs.map((doc: any) => ({
          _docId: doc.id,
          ...doc.data(),
        }));
        totalDocs += exportData[colName].length;
      }

      const rawJson = JSON.stringify(exportData, null, 2);
      const checksum = crypto.createHash('sha256').update(rawJson).digest('hex');

      const fileName = `${backupId}.json`;
      const filePath = path.join(BACKUPS_DIR, fileName);

      fs.writeFileSync(filePath, rawJson, 'utf8');

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        collections: this.TARGET_COLLECTIONS,
        totalDocuments: totalDocs,
        checksum,
        filePath: fileName,
        status: 'COMPLETED',
      };

      // Record in backupLogs collection
      await db.collection('backupLogs').doc(backupId).set(metadata);

      await AuditService.log('BACKUP_CREATED_SUCCESS', {
        details: { backupId, totalDocuments: totalDocs, checksum },
        severity: 'INFO',
      });

      console.log(`✅ [Backup] Backup created successfully: ${fileName} (${totalDocs} documents)`);
      return metadata;
    } catch (err: any) {
      console.error(`❌ [Backup] Backup operation failed:`, err);
      await AuditService.log('BACKUP_FAILED', {
        details: { backupId, error: err?.message },
        severity: 'CRITICAL',
      });
      throw err;
    }
  }

  /**
   * Lists available backup snapshots on disk and database.
   */
  public static async listBackups(): Promise<BackupMetadata[]> {
    this.ensureBackupDir();
    try {
      const snapshot = await db.collection('backupLogs').get();
      if (!snapshot.empty) {
        const list = snapshot.docs.map((d: any) => d.data() as BackupMetadata);
        return list.sort(
          (a: BackupMetadata, b: BackupMetadata) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    } catch {
      // Fallback to reading disk
    }

    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
    return files.map((fileName) => {
      const fullPath = path.join(BACKUPS_DIR, fileName);
      const content = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(content).digest('hex');
      const data = JSON.parse(content);
      const totalDocs = Object.values(data).reduce(
        (acc: number, cur: any) => acc + (cur.length || 0),
        0
      );

      return {
        id: path.basename(fileName, '.json'),
        timestamp: fs.statSync(fullPath).mtime.toISOString(),
        collections: Object.keys(data),
        totalDocuments: totalDocs,
        checksum,
        filePath: fileName,
        status: 'COMPLETED',
      };
    });
  }

  /**
   * Restores Firestore data from a specified backup archive.
   */
  public static async restoreBackup(backupId: string): Promise<{ restoredDocuments: number }> {
    this.ensureBackupDir();
    const fileName = backupId.endsWith('.json') ? backupId : `${backupId}.json`;
    const filePath = path.join(BACKUPS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup snapshot file not found: ${fileName}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw) as Record<string, any[]>;
    let restoredCount = 0;

    console.log(`♻️ [Restore] Initiating restoration from snapshot: ${fileName}`);

    try {
      for (const [colName, docs] of Object.entries(data)) {
        for (const item of docs) {
          const docId = item._docId;
          const cleanData = { ...item };
          delete cleanData._docId;

          await db.collection(colName).doc(docId).set(cleanData);
          restoredCount++;
        }
      }

      await AuditService.log('BACKUP_RESTORED_SUCCESS', {
        details: { backupId, restoredDocuments: restoredCount },
        severity: 'CRITICAL',
      });

      console.log(`✅ [Restore] Database successfully restored (${restoredCount} documents).`);
      return { restoredDocuments: restoredCount };
    } catch (err: any) {
      console.error(`❌ [Restore] Restoration failed:`, err);
      await AuditService.log('BACKUP_RESTORE_FAILED', {
        details: { backupId, error: err?.message },
        severity: 'CRITICAL',
      });
      throw err;
    }
  }
}
