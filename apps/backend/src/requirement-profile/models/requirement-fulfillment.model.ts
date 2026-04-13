import { Field, ID, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { RequirementType } from '../enums';
import { User } from '../../user/models/user.model';
import { RequirementFulfillmentStatus } from '../enums';
import { OrganizationUserProfile } from './organization-user-profile.model';
import { Requirement } from './requirement.model';
import { RequirementProfileSubmission } from './requirement-profile-submission.model';

type RequirementFulfillmentValue = {
  text?: string | null;
  date?: string | null;
  checked?: boolean | null;
  documentId?: string | null;
};

function parseValue(
  value: string | null,
): RequirementFulfillmentValue | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as RequirementFulfillmentValue;
  } catch {
    return null;
  }
}

@ObjectType()
export class RequirementFulfillment {
  @Field(() => ID)
  id: string;

  @Field(() => OrganizationUserProfile, { nullable: true })
  organizationUserProfile: OrganizationUserProfile | null;

  @Field(() => RequirementType)
  type: RequirementType;

  @Field(() => String, { nullable: true })
  value: string | null;

  @Field(() => RequirementFulfillmentStatus)
  status: RequirementFulfillmentStatus;

  @Field(() => Date, { nullable: true })
  submittedAt: Date | null;

  @Field(() => Date, { nullable: true })
  reviewedAt: Date | null;

  @Field(() => RequirementProfileSubmission)
  submission: RequirementProfileSubmission;

  @Field(() => Requirement)
  requirement: Requirement;

  @Field(() => User, { nullable: true })
  reviewedBy: User | null;
}

export class RequirementFulfillmentUpload extends RequirementFulfillment {
  get documentId(): string | null {
    return parseValue(this.value)?.documentId ?? null;
  }

  set documentId(value: string | null) {
    this.value = JSON.stringify({ documentId: value });
  }
}

export class RequirementFulfillmentCheck extends RequirementFulfillment {
  get checked(): boolean | null {
    return parseValue(this.value)?.checked ?? null;
  }

  set checked(value: boolean | null) {
    this.value = JSON.stringify({ checked: value });
  }
}

export class RequirementFulfillmentText extends RequirementFulfillment {
  get text(): string | null {
    return parseValue(this.value)?.text ?? null;
  }
}

export class RequirementFulfillmentDate extends RequirementFulfillment {
  get date(): Date | null {
    const date = parseValue(this.value)?.date;
    if (!date) {
      return null;
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }
}

export const RequirementFulfillmentPaginatedResponse =
  createPaginatedResponseType<RequirementFulfillment>(
    RequirementFulfillment,
    'RequirementFulfillment',
  );

export type RequirementFulfillmentPaginatedResponse = InstanceType<
  typeof RequirementFulfillmentPaginatedResponse
>;
