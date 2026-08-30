import {Module} from '@nestjs/common';
import {PropertiesService} from './properties.service';
import {PropertiesController} from './properties.controller';
import {NotificationsModule} from '../notifications/notifications.module';
import {SearchesModule} from '../searches/searches.module';

@Module({
  imports: [NotificationsModule, SearchesModule],
  providers: [PropertiesService],
  controllers: [PropertiesController],
  exports: [PropertiesService],
})
export class PropertiesModule {}
