import {Body, Controller, Get, Param, Patch} from '@nestjs/common';
import {ProfilesService} from './profiles.service';
import {UpdateProfileDto} from './dto/update-profile.dto';
import {CurrentUser} from '../common/decorators/current-user.decorator';

@Controller('profiles')
export class ProfilesController {
  constructor(private profiles: ProfilesService) {}

  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profiles.updateMe(userId, dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser('id') viewerId: string) {
    return this.profiles.getById(id, viewerId);
  }
}
