import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TimeRecord {
    @Field(() => ID)
    id: string;

    @Field(() => Date)
    startedAt: Date;

    @Field(() => Date)
    endedAt: Date;

    @Field(() => String, { nullable: true })
    notes: string | null;

    @Field(() => Date)
    createdAt: Date;
}
