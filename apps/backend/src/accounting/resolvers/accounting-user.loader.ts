import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import type { UserEntity } from '../../auth/schemas/auth.schema';
import { RegisterLoader } from '../../graphql/interceptors';
import { UserService } from '../../user/user.service';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class AccountingUserLoader {
  constructor(private readonly userService: UserService) {}

  public readonly userById = new DataLoader<string, UserEntity | null>(
    async (userIds) => {
      const users = await this.userService.findByIds([...userIds]);
      const usersById = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => usersById.get(id) ?? null);
    },
  );
}
