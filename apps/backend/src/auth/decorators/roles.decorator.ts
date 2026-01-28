import { SetMetadata } from '@nestjs/common';
import { OrganizationRole } from '../../organization/enums';

export const ROLES_KEY = 'roles';

export type Role =
  | OrganizationRole.OWNER
  | OrganizationRole.ADMIN
  | OrganizationRole.MODERATOR
  | OrganizationRole.VOLUNTEER
  | 'STAFF'
  | 'MEMBER';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
