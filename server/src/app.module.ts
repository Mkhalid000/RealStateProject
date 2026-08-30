import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD} from '@nestjs/core';
import {PrismaModule} from './prisma/prisma.module';
import {RealtimeModule} from './realtime/realtime.module';
import {AuthModule} from './auth/auth.module';
import {ProfilesModule} from './profiles/profiles.module';
import {PropertiesModule} from './properties/properties.module';
import {ReelsModule} from './reels/reels.module';
import {SocialModule} from './social/social.module';
import {ChatModule} from './chat/chat.module';
import {NotificationsModule} from './notifications/notifications.module';
import {BillingModule} from './billing/billing.module';
import {UploadsModule} from './uploads/uploads.module';
import {AdminModule} from './admin/admin.module';
import {LeadsModule} from './leads/leads.module';
import {AdsModule} from './ads/ads.module';
import {BlogModule} from './blog/blog.module';
import {SearchesModule} from './searches/searches.module';
import {JwtAuthGuard} from './common/guards/jwt-auth.guard';
import {RolesGuard} from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    ProfilesModule,
    PropertiesModule,
    ReelsModule,
    SocialModule,
    ChatModule,
    NotificationsModule,
    BillingModule,
    UploadsModule,
    AdminModule,
    LeadsModule,
    AdsModule,
    BlogModule,
    SearchesModule,
  ],
  providers: [
    // Auth on every route by default; @Public() opts out.
    {provide: APP_GUARD, useClass: JwtAuthGuard},
    // Role checks where @Roles() is present.
    {provide: APP_GUARD, useClass: RolesGuard},
  ],
})
export class AppModule {}
