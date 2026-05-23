import {Module} from '@nestjs/common';
import {ReelsService} from './reels.service';
import {ReelsController} from './reels.controller';
import {NotificationsModule} from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [ReelsService],
  controllers: [ReelsController],
  exports: [ReelsService],
})
export class ReelsModule {}
