import { Controller, Get, Header, StreamableFile } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('privacy-policy.pdf')
  @AllowAnonymous()
  @Header('Cache-Control', 'public, max-age=0, must-revalidate')
  streamPrivacyPolicy(): StreamableFile {
    return this.legalService.streamCurrentPrivacyPolicy();
  }
}
