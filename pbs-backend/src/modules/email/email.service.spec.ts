import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailService', () => {
  const sendMail = jest.fn();
  const verify = jest.fn();
  const prisma = {
    settings: { findUnique: jest.fn() },
  };

  let service: EmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail,
      verify,
    } as never);
    prisma.settings.findUnique.mockResolvedValue({
      value: JSON.stringify({
        host: 'smtp.example.test',
        port: 587,
        secure: false,
        user: 'pbs@example.test',
        pass: 'secret',
        fromName: 'PBS',
      }),
    });
    service = new EmailService(prisma as never);
  });

  it('sends email through configured SMTP transport', async () => {
    sendMail.mockResolvedValue({});

    await expect(
      service.sendEmail({ to: 'kunde@example.test', subject: 'Hallo' }),
    ).resolves.toEqual({ ok: true });
    expect(sendMail).toHaveBeenCalledWith({
      from: '"PBS" <pbs@example.test>',
      to: 'kunde@example.test',
      subject: 'Hallo',
      text: '',
      html: undefined,
    });
  });

  it('verifies SMTP connectivity', async () => {
    verify.mockResolvedValue(true);

    await expect(service.verifySmtp()).resolves.toEqual({
      ok: true,
      message: 'SMTP Verbindung erfolgreich',
    });
  });
});
