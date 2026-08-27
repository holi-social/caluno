import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/models/user.model';
import { ReimbursementType } from './reimbursement-type.model';

@ObjectType()
export class BundleDownloadStatus {
  @Field(() => User)
  volunteer!: User;

  @Field(() => ReimbursementType)
  reimbursementType!: ReimbursementType;

  @Field(() => Date)
  downloadedAt!: Date;

  @Field(() => User, { nullable: true })
  downloadedByUser?: User | null;
}
