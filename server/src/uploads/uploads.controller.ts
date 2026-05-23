import {Controller, Get, Query} from '@nestjs/common';
import {UploadsService} from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  // Any authenticated user can request a signature (avatars, reels, property media).
  // Resource-specific permissions are enforced at the create endpoints.
  @Get('signature')
  signature(@Query('folder') folder?: string) {
    return this.uploads.signUpload(folder || 'reels');
  }
}
