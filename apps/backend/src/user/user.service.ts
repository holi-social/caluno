import { Inject, Injectable } from '@nestjs/common';
import type { UserEntity } from '../auth/schemas/auth.schema';
import type { Database } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';

@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async findById(id: string): Promise<UserEntity | undefined> {
    return this.db.query.users.findFirst({
      where: { id },
    });
  }

  async findByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.db.query.users.findFirst({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
