import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../database/database-connection';
import * as schema from '../database/schema';
import { OrganizationRole } from '../organization/models/organization.model';
import { UserMapper } from '../user/mappers/user.mapper';
import { User } from '../user/models/user.model';

@Injectable()
export class MembershipService {
    constructor(
        @Inject(DATABASE_CONNECTION)
        private readonly db: NodePgDatabase<typeof schema>,
        private readonly userMapper: UserMapper,
    ) {}

    async findUsersByRole(
        organizationId: string,
        role: OrganizationRole,
    ): Promise<User[]> {
        const adminMemberships = await this.db.query.memberships.findMany({
            where: and(
                eq(schema.memberships.organizationId, organizationId),
                eq(schema.memberships.role, role),
            ),
            with: {
                user: true,
            },
        });

        const admins = adminMemberships.map((membership) => membership.user);

        return this.userMapper.toArray(admins);
    }
}
