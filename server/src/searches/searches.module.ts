import {Module} from '@nestjs/common';
import {SearchesController} from './searches.controller';
import {SearchesService} from './searches.service';
import {NotificationsModule} from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SearchesController],
  providers: [SearchesService],
  exports: [SearchesService],
})
export class SearchesModule {}
