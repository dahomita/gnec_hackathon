import { Injectable } from '@nestjs/common';
import { BaseService } from '../database/base.service';
import { User, Prisma } from '@prisma/client';
import { UserRepository } from './users.repository';

@Injectable()
export class UserService extends BaseService<
  User,
  UserRepository,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor(protected readonly userRepository: UserRepository) {
    super(userRepository);
  }

  protected getEntityName(plural = false): string {
    return plural ? 'users' : 'user';
  }
}
