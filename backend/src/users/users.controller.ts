import { User } from '@prisma/client'
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
@Controller('users')
export class UsersController {
  @Get('me')
  async getProfile(@CurrentUser() user: User) {
    return user;
  }
}
