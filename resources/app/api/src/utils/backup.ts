import fs from 'fs';
import path from 'path';

export function createBackup(filePath: string): string {
  const backupDir = path.dirname(filePath);
  const backupPath = path.join(backupDir, `data-backup-${Date.now()}.json`);
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

export function restoreBackup(backupPath: string, targetPath: string): void {
  fs.copyFileSync(backupPath, targetPath);
}
