import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ForbiddenGraphQLError } from '../../graphql/errors';
import { AuthService } from '../auth.service';
import { Permission } from '../constants';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable({ scope: Scope.REQUEST })
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();
    const {
      req: { user },
      organizationId,
    } = gqlContext;

    if (!user) {
      throw new ForbiddenGraphQLError('You are not authenticated');
    }

    const hasRequiredPermissions =
      await this.authService.hasRequiredPermissions(
        user.id,
        organizationId,
        requiredPermissions,
      );

    if (!hasRequiredPermissions) {
      throw new ForbiddenGraphQLError(
        `You do not have the required permissions to access this resource. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
