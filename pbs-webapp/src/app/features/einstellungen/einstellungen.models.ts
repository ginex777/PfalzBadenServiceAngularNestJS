export interface SmtpSettings {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

export interface BackupStatus {
  lastBackupTime?: string;
  files?: string[];
  encryptionEnabled?: boolean;
}

export type EinstellungenTab = 'firma' | 'backup' | 'smtp';
