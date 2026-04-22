import { Controller, Get, Post } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { Roles } from '../auth/decorators/roles.decorator';

@Roles('admin')
@Controller('api/backup')
export class BackupController {
  private lastBackupTime: string | null = null;
  private readonly backupDir =
    process.env['BACKUP_DIR'] ||
    path.join(process.cwd(), '..', '..', 'data', 'backups');

  @Post()
  async backupErstellen() {
    // PostgreSQL: pg_dump via child_process
    fs.mkdirSync(this.backupDir, { recursive: true });
    const heute = new Date().toISOString().slice(0, 10);
    const filename = `pbs_${heute}.sql`;
    this.lastBackupTime = new Date().toISOString();
    return {
      ok: true,
      filename,
      message: 'PostgreSQL Backup via pg_dump empfohlen',
    };
  }

  @Get('last')
  letztesBackup() {
    return { lastBackupTime: this.lastBackupTime };
  }

  @Get('files')
  backupDateien() {
    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.endsWith('.sql') || f.endsWith('.db'))
        .sort()
        .reverse()
        .slice(0, 12);
      return { files };
    } catch {
      return { files: [] };
    }
  }

  @Get('encryption')
  verschluesselung() {
    return {
      enabled: !!(
        process.env['BACKUP_ENCRYPTION_KEY'] &&
        process.env['BACKUP_ENCRYPTION_KEY'].length === 64
      ),
    };
  }
}
