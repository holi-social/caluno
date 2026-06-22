import { Injectable, Logger } from '@nestjs/common';
import { EventService } from '../event/event.service';
import { MembershipService } from '../membership/membership.service';
import type {
  MembershipRequestEntity,
  MembershipRequestMetadata,
} from '../membership/schemas/membership-request.schema';
import { SubmitFormInput } from '../requirement-profile/inputs/submit-form.input';
import type { FormSubmissionEntity } from '../requirement-profile/schemas/form-submission.schema';
import { FormSubmissionService } from '../requirement-profile/services/form-submission.service';
import { ShiftService } from '../shift/shift.service';

@Injectable()
export class MembershipLifecycleOrchestrator {
  private readonly logger = new Logger(MembershipLifecycleOrchestrator.name);

  constructor(
    private readonly membershipService: MembershipService,
    private readonly shiftService: ShiftService,
    private readonly eventService: EventService,
    private readonly formSubmissionService: FormSubmissionService,
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
    const request = await this.membershipService.rejectMembershipRequest(
      id,
      organizationUnitId,
      reviewerId,
      rejectionReason,
    );

    if (request.userId && request.organizationUnitId) {
      await this.formSubmissionService.rejectByUserAndOrgUnit(
        request.userId,
        request.organizationUnitId,
      );
    }

    return request;
  }

  async submitForm(
    token: string,
    input: SubmitFormInput,
    userId: string,
  ): Promise<FormSubmissionEntity> {
    const submission = await this.formSubmissionService.submit(
      token,
      input,
      userId,
    );

    const organizationUnitId =
      await this.formSubmissionService.findOrganizationUnitIdByFormId(
        submission.formId,
      );
    if (organizationUnitId) {
      const isMember = await this.membershipService.isMemberOfUnitOrAncestor(
        userId,
        organizationUnitId,
      );
      if (!isMember) {
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
          const instance = await this.shiftService.findInstanceById(
            instanceId,
            membershipRequest.organizationUnitId,
          );
          await this.shiftService.joinShift(
            membershipRequest.userId,
            instance.masterId,
            instanceId,
          );
        } catch (e) {
          this.logger.warn(
            `Failed to auto-join shift instance ${instanceId}: ${e}`,
          );
        }
      }
    }

    if (
      !metadata.intendedShiftInstanceIds?.length &&
      metadata.intendedShiftIds?.length
    ) {
      for (const shiftId of metadata.intendedShiftIds) {
        this.logger.warn(
          `Skipped legacy shift auto-join ${shiftId}: no intended shift instance was captured`,
        );
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
            );
          }
        } catch (e) {
          this.logger.warn(`Failed to auto-join event ${eventId}: ${e}`);
        }
      }
    }
  }
}
