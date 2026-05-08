import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailService } from './email.service';

@Controller('api/email')
@Roles('admin')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async emailSenden(
    @Body() body: { to: string; subject: string; text?: string; html?: string },
  ) {
    return this.emailService.sendEmail(body);
  }

  @Post('test')
  async smtpTesten() {
    return this.emailService.verifySmtp();
  }
}
