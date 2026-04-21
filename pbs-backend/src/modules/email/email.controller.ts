import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as nodemailer from 'nodemailer';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
}

@Controller('api/email')
export class EmailController {
  constructor(private readonly prisma: PrismaService) {}

  private async getTransporter(): Promise<nodemailer.Transporter> {
    const row = await this.prisma.settings.findUnique({
      where: { key: 'smtp' },
    });
    if (!row)
      throw new HttpException(
        'SMTP nicht konfiguriert',
        HttpStatus.BAD_REQUEST,
      );
    const s = JSON.parse(row.value) as SmtpConfig;
    return nodemailer.createTransport({
      host: s.host,
      port: s.port || 587,
      secure: s.secure === true || s.port === 465,
      auth: { user: s.user, pass: s.pass },
    });
  }

  @Post('send')
  async emailSenden(
    @Body() body: { to: string; subject: string; text?: string; html?: string },
  ) {
    if (!body.to || !body.subject)
      throw new HttpException(
        'to und subject erforderlich',
        HttpStatus.BAD_REQUEST,
      );
    try {
      const row = await this.prisma.settings.findUnique({
        where: { key: 'smtp' },
      });
      const s = row ? (JSON.parse(row.value) as SmtpConfig) : null;
      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from: `"${s?.fromName ?? 'PBS'}" <${s?.user}>`,
        to: body.to,
        subject: body.subject,
        text: body.text || '',
        html: body.html,
      });
      return { ok: true };
    } catch (e) {
      throw new HttpException(
        'E-Mail konnte nicht gesendet werden: ' + (e as Error).message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  async smtpTesten() {
    try {
      const t = await this.getTransporter();
      await t.verify();
      return { ok: true, message: 'SMTP Verbindung erfolgreich' };
    } catch (e) {
      throw new HttpException(
        'SMTP-Verbindung fehlgeschlagen: ' + (e as Error).message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
