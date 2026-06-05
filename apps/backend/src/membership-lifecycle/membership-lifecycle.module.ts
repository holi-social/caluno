import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { MembershipRequestMapper } from '../membership/mappers/membership-request.mepper';
import { MembershipModule } from '../membership/membership.module';
import { FormSubmissionMapper } from '../requirement-profile/mappers/form-submission.mapper';
import { RequirementProfileModule } from '../requirement-profile/requirement-profile.module';
import { ShiftModule } from '../shift/shift.module';
import { MembershipLifecycleOrchestrator } from './membership-lifecycle.orchestrator';
import { MembershipLifecycleMutationResolver } from './membership-lifecycle-mutation.resolver';

@Module({
  imports: [
    MembershipModule,
    ShiftModule,
    EventModule,
    RequirementProfileModule,
  ],
  providers: [
    MembershipLifecycleOrchestrator,
    MembershipLifecycleMutationResolver,
    MembershipRequestMapper,
    FormSubmissionMapper,
  ],
})
export class MembershipLifecycleModule {}
