import {Body, Controller, Get, HttpCode, Post, UseGuards} from '@nestjs/common';
import {AuthService} from './auth.service';
import {LoginDto, RefreshDto, RegisterDto} from './dto/auth.dto';
import {Public} from '../common/decorators/public.decorator';
import {CurrentUser} from '../common/decorators/current-user.decorator';
import {JwtAuthGuard} from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('logout')
  logout(
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<RefreshDto>,
  ) {
    return this.auth.logout(userId, dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }
}
