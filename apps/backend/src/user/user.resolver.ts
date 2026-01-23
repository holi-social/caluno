import { Args, Query, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { User } from './models/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @Query(() => User)
    async me(@Session() session: UserSession): Promise<User> {
        return this.userService.findByIdOrThrow(session.user.id);
    }

    @Query(() => User, { nullable: true })
    async user(@Args('id') id: string): Promise<User | null> {
        return this.userService.findById(id);
    }
}
