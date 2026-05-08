import {
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Roles } from '../auth/decorators/roles.decorator';

const execFileAsync = promisify(execFile);

@Roles('admin')
@Controller('api/backup')
export class BackupController {
  private lastBackupTime: string | null = null;
  private readonly backupDir =
    process.env['BACKUP_DIR'] ||
    path.join(process.cwd(), '..', '..', 'data', 'backups');

  @Post()
  async backupErstellen() {
    const dbUrl = process.env['DATABASE_URL'];
    if (!dbUrl) {
      throw new HttpException(
        'DATABASE_URL nicht konfiguriert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    fs.mkdirSync(this.backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `pbs_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      await execFileAsync('pg_dump', ['--no-password', dbUrl, '-f', filepath]);
    } catch (err) {
      throw new HttpException(
        `pg_dump fehlgeschlagen: ${err instanceof Error ? err.message : 'unbekannter Fehler'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.lastBackupTime = new Date().toISOString();
    return { ok: true, filename, path: filepath };
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
