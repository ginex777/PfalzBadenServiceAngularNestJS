import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../core/database/prisma.service';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName?: string;
}

interface SendEmailRequest {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadSmtpConfig(): Promise<SmtpConfig> {
    const row = await this.prisma.settings.findUnique({
      where: { key: 'smtp' },
    });
    if (!row) {
      throw new HttpException(
        'SMTP nicht konfiguriert',
        HttpStatus.BAD_REQUEST,
      );
    }
    return JSON.parse(row.value) as SmtpConfig;
  }

  private createTransporter(config: SmtpConfig): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.secure === true || config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
  }

  private async getTransporter(): Promise<{
    config: SmtpConfig;
    transporter: nodemailer.Transporter;
  }> {
    const config = await this.loadSmtpConfig();
    return { config, transporter: this.createTransporter(config) };
  }

  async sendEmail(body: SendEmailRequest) {
    if (!body.to || !body.subject) {
      throw new HttpException(
        'to und subject erforderlich',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const { config, transporter } = await this.getTransporter();
      await transporter.sendMail({
        from: `"${config.fromName ?? 'PBS'}" <${config.user}>`,
        to: body.to,
        subject: body.subject,
        text: body.text || '',
        html: body.html,
      });
      return { ok: true };
    } catch (error) {
      throw new HttpException(
        `E-Mail konnte nicht gesendet werden: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifySmtp() {
    try {
      const { transporter } = await this.getTransporter();
      await transporter.verify();
      return { ok: true, message: 'SMTP Verbindung erfolgreich' };
    } catch (error) {
      throw new HttpException(
        `SMTP-Verbindung fehlgeschlagen: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
