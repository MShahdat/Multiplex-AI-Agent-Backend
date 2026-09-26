import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import passport from 'passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/roles.guard.js';
import { prefix } from '../../utils/global.prefix.js';
import '../../lib/passport.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard]
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(passport.authenticate('google', { scope: ['profile', 'email'] }))
      .forRoutes({ path: `${prefix}/auth/google`, method: RequestMethod.GET });

    consumer
      .apply(passport.authenticate('google', { session: false }))
      .forRoutes({ path: `${prefix}/auth/google/callback`, method: RequestMethod.GET });
  }
}
