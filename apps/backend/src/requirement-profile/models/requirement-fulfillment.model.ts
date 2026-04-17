import { Field, ID, InterfaceType, ObjectType } from '@nestjs/graphql';
import { createPaginatedResponseType } from '../../graphql/paginated-response.model';
import { User } from '../../user/models/user.model';
import { RequirementFulfillmentStatus, RequirementType } from '../enums';
import { OrganizationUserProfile } from './organization-user-profile.model';
import { Requirement } from './requirement.model';
import { RequirementProfileSubmission } from './requirement-profile-submission.model';

type RequirementFulfillmentValue = {
  text?: string | null;
  date?: string | null;
  checked?: boolean | null;
  documentId?: string | null;
};

function parseValue(value: string | null): RequirementFulfillmentValue | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as RequirementFulfillmentValue;
  } catch {
    return null;
  }
}

@InterfaceType({
  resolveType(value: RequirementFulfillment) {
    switch (value.type) {
      case RequirementType.DOCUMENT:
        return RequirementFulfillmentUpload;
      case RequirementType.CHECK:
        return RequirementFulfillmentCheck;
      case RequirementType.DATE:
        return RequirementFulfillmentDate;
      case RequirementType.TEXT:
        return RequirementFulfillmentText;
      default:
        return null;
    }
  },
})
export class RequirementFulfillment {
  @Field(() => ID)
  id: string;

  @Field(() => OrganizationUserProfile, { nullable: true })
  organizationUserProfile: OrganizationUserProfile | null;

  @Field(() => RequirementType)
  type: RequirementType;

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

@ObjectType({
  implements: () => RequirementFulfillment,
})
export class RequirementFulfillmentUpload extends RequirementFulfillment {
  @Field(() => String, { nullable: true })
  get documentId(): string | null {
    return parseValue(this.value)?.documentId ?? null;
  }

  set documentId(value: string | null) {
    this.value = JSON.stringify({ documentId: value });
  }
}

@ObjectType({
  implements: () => RequirementFulfillment,
})
export class RequirementFulfillmentCheck extends RequirementFulfillment {
  @Field(() => Boolean, { nullable: true })
  get checked(): boolean | null {
    return parseValue(this.value)?.checked ?? null;
  }

  set checked(value: boolean | null) {
    this.value = JSON.stringify({ checked: value });
  }
}

@ObjectType({
  implements: () => RequirementFulfillment,
})
export class RequirementFulfillmentText extends RequirementFulfillment {
  @Field(() => String, { nullable: true })
  get text(): string | null {
    return parseValue(this.value)?.text ?? null;
  }
}

@ObjectType({
  implements: () => RequirementFulfillment,
})
export class RequirementFulfillmentDate extends RequirementFulfillment {
  @Field(() => Date, { nullable: true })
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
