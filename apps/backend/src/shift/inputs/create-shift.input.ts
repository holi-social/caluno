import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { ShiftVisibility } from '../enums';

registerEnumType(ShiftVisibility, {
  name: 'ShiftVisibility',
});

@InputType()
export class CreateShiftInput {
  @Field(() => String)
  title: string;

  @Field(() => String)
  instructions: string;

  @Field(() => String, { nullable: true })
  projectId: string | null;

  @Field(() => Date)
  startsAt: Date;

  @Field(() => Date)
  endsAt: Date;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => ShiftVisibility, { defaultValue: ShiftVisibility.ALL_MEMBERS })
  visibility: ShiftVisibility;
}
