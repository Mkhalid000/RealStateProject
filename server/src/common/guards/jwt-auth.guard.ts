import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {AuthGuard} from '@nestjs/passport';
import {IS_PUBLIC_KEY} from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // Always run passport so a valid token populates request.user — even on
  // @Public routes (lets the public reels feed personalize likedByMe).
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // On @Public routes, tolerate a missing/invalid token (optional auth);
  // on protected routes, enforce a valid user.
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return user ?? undefined;
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
