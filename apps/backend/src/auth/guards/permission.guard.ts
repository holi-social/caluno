import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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

    const { user, organizationUnitId, isGraphql } =
      this.resolveRequestContext(context);

    if (!user) {
      this.throwForbidden('You are not authenticated', isGraphql);
    }

    const hasRequiredPermissions =
      await this.authService.hasRequiredPermissions(
        user.id,
        organizationUnitId ?? '',
        requiredPermissions,
      );

    if (!hasRequiredPermissions) {
      this.throwForbidden(
        `You do not have the required permissions to access this resource. Required: ${requiredPermissions.join(', ')}`,
        isGraphql,
      );
    }

    return true;
  }

  private resolveRequestContext(context: ExecutionContext): {
    user?: { id: string };
    organizationUnitId?: string;
    isGraphql: boolean;
  } {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<{
        user?: { id: string };
        headers: Record<string, string | string[] | undefined>;
      }>();

      return {
        user: request.user,
        organizationUnitId: this.readHeader(
          request.headers['x-organization-unit-id'],
        ),
        isGraphql: false,
      };
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    return {
      user: gqlContext.req?.user,
      organizationUnitId: gqlContext.organizationUnitId,
      isGraphql: true,
    };
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }

  private throwForbidden(message: string, isGraphql: boolean): never {
    if (isGraphql) {
      throw new ForbiddenGraphQLError(message);
    }

    throw new ForbiddenException(message);
  }
}
