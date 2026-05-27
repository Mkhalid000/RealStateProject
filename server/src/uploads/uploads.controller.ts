import {Controller, Get} from '@nestjs/common';
import {UploadsService} from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  // Any authenticated user can request upload auth (avatars, reels, property media).
  // Resource-specific permissions are enforced at the create endpoints.
  @Get('signature')
  signature() {
    return this.uploads.signUpload();
  }
}
