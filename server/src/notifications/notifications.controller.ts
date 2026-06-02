import {Body, Controller, Delete, Get, Patch, Post} from '@nestjs/common';
import {NotificationsService} from './notifications.service';
import {CurrentUser} from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.notifications.list(userId);
  }

  @Get('unread-count')
  unread(@CurrentUser('id') userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Patch('read-all')
  readAll(@CurrentUser('id') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  /** Register this device's FCM token for push. */
  @Post('device-token')
  registerDevice(
    @CurrentUser('id') userId: string,
    @Body() body: {token: string; platform?: string},
  ) {
    return this.notifications.registerDevice(userId, body.token, body.platform);
  }

  /** Remove a device token (e.g. on logout). */
  @Delete('device-token')
  removeDevice(@Body() body: {token: string}) {
    return this.notifications.removeDevice(body.token);
  }
}
