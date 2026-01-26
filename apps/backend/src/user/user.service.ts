import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from '../auth/schemas/auth.schema';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { UserMapper } from './mappers/user.mapper';
import type { User } from './models/user.model';

@Injectable()
export class UserService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly mapper: UserMapper,
  ) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    return this.mapper.toModel(user);
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    return this.mapper.toModelOrThrow(user);
  }
}
