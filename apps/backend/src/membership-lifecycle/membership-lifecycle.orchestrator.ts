import { Injectable, Logger } from '@nestjs/common';
import { EventService } from '../event/event.service';
import { MembershipService } from '../membership/membership.service';
import type {
  MembershipRequestEntity,
  MembershipRequestMetadata,
} from '../membership/schemas/membership-request.schema';
import { RequiredFormTargetType } from '../requirement-profile/enums';
import { SubmitFormInput } from '../requirement-profile/inputs/submit-form.input';
import type { FormSubmissionEntity } from '../requirement-profile/schemas/form-submission.schema';
import { FormSubmissionService } from '../requirement-profile/services/form-submission.service';
import { RequiredFormService } from '../requirement-profile/services/required-form.service';
import { POSTHOG_JOIN_SOURCE } from '../shared/observability/posthog.events';
import { ShiftService } from '../shift/shift.service';

@Injectable()
export class MembershipLifecycleOrchestrator {
  private readonly logger = new Logger(MembershipLifecycleOrchestrator.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly shiftService: ShiftService,
    private readonly eventService: EventService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly requiredFormService: RequiredFormService,
  ) {}

  async approveMembershipRequest(
    id: string,
    organizationUnitId: string,
    reviewerId: string,
  ): Promise<MembershipRequestEntity> {
    const membershipRequest =
      await this.membershipService.approveMembershipRequest(
        id,
        organizationUnitId,
        reviewerId,
      );

    await this.fulfillIntendedJoins(membershipRequest);

    return membershipRequest;
  }

  async rejectMembershipRequest(
    id: string,
    organizationUnitId: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<MembershipRequestEntity> {
    return this.membershipService.rejectMembershipRequest(
      id,
      organizationUnitId,
      reviewerId,
      rejectionReason,
    );
  }

  async submitForm(
    token: string,
    input: SubmitFormInput,
    userId: string,
    organizationUnitId: string,
  ): Promise<FormSubmissionEntity> {
    const submission = await this.formSubmissionService.submit(
      token,
      input,
      userId,
      organizationUnitId,
    );

    const isMember = await this.membershipService.isMemberOfUnitOrAncestor(
      userId,
      organizationUnitId,
    );
    if (!isMember) {
      const requiredFormsSatisfied =
        await this.requiredFormService.areRequiredFormsSatisfied(userId, {
          targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
          targetId: organizationUnitId,
        });
      if (requiredFormsSatisfied) {
        try {
          await this.membershipService.createMembershipRequest(
            userId,
            organizationUnitId,
          );
        } catch (e) {
          // Pending request already exists or transient error — submission is still valid
          this.logger.warn(
            '[FormSubmission] createMembershipRequest skipped',
            e,
          );
        }
      }
    }

    return submission;
  }

  private async fulfillIntendedJoins(
    membershipRequest: MembershipRequestEntity,
  ): Promise<void> {
    const metadata = (membershipRequest.metadata ??
      {}) as MembershipRequestMetadata;

    if (!membershipRequest.userId) {
      return;
    }

    if (metadata.intendedShiftInstanceIds?.length) {
      for (const instanceId of metadata.intendedShiftInstanceIds) {
        try {
          await this.shiftService.findInstanceById(
            instanceId,
            membershipRequest.organizationUnitId,
          );
          await this.shiftService.joinShiftInstance(
            membershipRequest.userId,
            instanceId,
            { source: POSTHOG_JOIN_SOURCE.MEMBERSHIP_APPROVE },
          );
        } catch (e) {
          this.logger.warn(
            `Failed to auto-join shift instance ${instanceId}: ${e}`,
          );
        }
      }
    }

    if (metadata.intendedShiftIds?.length) {
      for (const shiftId of metadata.intendedShiftIds) {
        try {
          await this.shiftService.joinShift(
            membershipRequest.userId,
            shiftId,
            POSTHOG_JOIN_SOURCE.MEMBERSHIP_APPROVE,
          );
        } catch (e) {
          this.logger.warn(`Failed to auto-join shift ${shiftId}: ${e}`);
        }
      }
    }

    if (metadata.intendedEventIds?.length) {
      for (const eventId of metadata.intendedEventIds) {
        try {
          const event = await this.eventService.findByIdPublic(eventId);
          if (event) {
            await this.eventService.joinEvent(
              membershipRequest.userId,
              eventId,
              {
                source: POSTHOG_JOIN_SOURCE.MEMBERSHIP_APPROVE,
              },
            );
          }
        } catch (e) {
          this.logger.warn(`Failed to auto-join event ${eventId}: ${e}`);
        }
      }
    }
  }
}
