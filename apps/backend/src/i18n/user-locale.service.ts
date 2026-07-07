import { Injectable } from '@nestjs/common';
import { type Locale, resolveRequestLocale } from '../graphql/locale';
import { UserService } from '../user/user.service';

@Injectable()
export class UserLocaleService {
  constructor(private readonly userService: UserService) {}

  async resolveForUser(
    userId: string,
    headers: Record<string, unknown> = {},
  ): Promise<Locale> {
    return this.userService.resolveLocale(userId, headers);
  }

  async resolveForEmail(
    email: string,
    headers: Record<string, unknown>,
  ): Promise<Locale> {
    const user = await this.userService.findByEmail(email);
    if (user) {
      return this.resolveForUser(user.id, headers);
    }

    return resolveRequestLocale(headers);
  }
}
