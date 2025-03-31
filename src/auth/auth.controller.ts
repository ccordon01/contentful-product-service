import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/sign-in')
  signIn(): Promise<{
    accesToken: string;
  }> {
    return this.authService.signIn();
  }
}
