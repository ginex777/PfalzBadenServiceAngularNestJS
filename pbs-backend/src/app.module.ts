import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { VertraegeModule } from './modules/vertraege/vertraege.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { DatabaseModule } from './core/database/database.module';
import { KundenModule } from './modules/kunden/kunden.module';
import { RechnungenModule } from './modules/rechnungen/rechnungen.module';
import { AngeboteModule } from './modules/angebote/angebote.module';
import { BuchhaltungModule } from './modules/buchhaltung/buchhaltung.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { MitarbeiterModule } from './modules/mitarbeiter/mitarbeiter.module';
import { MuellplanModule } from './modules/muellplan/muellplan.module';
import { HausmeisterModule } from './modules/hausmeister/hausmeister.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { BenachrichtigungenModule } from './modules/benachrichtigungen/benachrichtigungen.module';
import { WiederkehrendModule } from './modules/wiederkehrend/wiederkehrend.module';
import { MahnungenModule } from './modules/mahnungen/mahnungen.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { BelegeModule } from './modules/belege/belege.module';
import { DatevModule } from './modules/datev/datev.module';
import { BackupModule } from './modules/backup/backup.module';
import { EmailModule } from './modules/email/email.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration — available everywhere via ConfigService
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting — 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    DatabaseModule,
    KundenModule,
    RechnungenModule,
    AngeboteModule,
    BuchhaltungModule,
    MarketingModule,
    MitarbeiterModule,
    MuellplanModule,
    HausmeisterModule,
    TasksModule,
    SettingsModule,
    AuditModule,
    BenachrichtigungenModule,
    WiederkehrendModule,
    MahnungenModule,
    PdfModule,
    BelegeModule,
    DatevModule,
    BackupModule,
    EmailModule,
    DashboardModule,
    AuthModule,
    VertraegeModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global JWT guard — all routes protected unless @Public() is applied
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
