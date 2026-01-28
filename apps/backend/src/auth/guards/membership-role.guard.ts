import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  BadRequestGraphQLError,
  ForbiddenGraphQLError,
} from '../../graphql/errors';
import { MembershipService } from '../../membership/membership.service';
import { OrganizationRole } from '../../organization/enums';
import { ROLES_KEY, type Role } from '../decorators/roles.decorator';

@Injectable()
export class MembershipRoleGuard implements CanActivate {
  private readonly roleMapping: Record<Role, OrganizationRole[]> = {
    [OrganizationRole.OWNER]: [OrganizationRole.OWNER],
    [OrganizationRole.ADMIN]: [OrganizationRole.ADMIN],
    [OrganizationRole.MODERATOR]: [OrganizationRole.MODERATOR],
    [OrganizationRole.VOLUNTEER]: [OrganizationRole.VOLUNTEER],
    STAFF: [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MODERATOR,
    ],
    MEMBER: [
      OrganizationRole.OWNER,
      OrganizationRole.ADMIN,
      OrganizationRole.MODERATOR,
      OrganizationRole.VOLUNTEER,
    ],
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly membershipService: MembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<Role[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
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

    if (!organizationId) {
      throw new BadRequestGraphQLError(
        'Organization ID is required in headers',
      );
    }

    const membership = await this.membershipService.getMembership(
      user.id,
      organizationId,
    );

    if (!membership) {
      throw new ForbiddenGraphQLError(
        'You are not a member of this organization',
      );
    }

    const hasRequiredRole = requiredRoles.some((requiredRole) =>
      this.roleMapping[requiredRole]?.includes(
        membership.role as OrganizationRole,
      ),
    );

    if (!hasRequiredRole) {
      const rolesStr = requiredRoles.join(', ');
      throw new ForbiddenGraphQLError(
        `You do not have the required role to access this resource. Required: ${rolesStr}`,
      );
    }

    return true;
  }
}
