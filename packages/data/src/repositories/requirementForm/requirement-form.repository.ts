import type {
  CreateFormBlockFieldInput,
  CreateFormBlockInput,
  CreateRequirementFormInput,
  RequiredFormTargetType,
  SubmitFormInput,
  UpdateFormBlockFieldInput,
  UpdateFormBlockInput,
  UpdateRequirementFormInput,
  UpdateUserProfileInput,
} from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export class RequirementFormRepository extends BaseRepository {
  async findBlockById(id: string) {
    const data = await this.sdk.GetFormBlock({ id });
    return data.formBlock;
  }

  async findBlocks(organizationId: string, options: PaginationOptions = {}) {
    const data = await this.sdk.GetFormBlocks({
      organizationId,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
    return data.formBlocks;
  }

  async createBlock(input: CreateFormBlockInput) {
    const data = await this.sdk.CreateFormBlock({ input });
    return data.createFormBlock;
  }

  async updateBlock(id: string, input: UpdateFormBlockInput) {
    const data = await this.sdk.UpdateFormBlock({ id, input });
    return data.updateFormBlock;
  }

  async deleteBlock(id: string) {
    const data = await this.sdk.DeleteFormBlock({ id });
    return data.deleteFormBlock;
  }

  async createBlockField(blockId: string, input: CreateFormBlockFieldInput) {
    const data = await this.sdk.CreateFormBlockField({ blockId, input });
    return data.createFormBlockField;
  }

  async updateBlockField(fieldId: string, input: UpdateFormBlockFieldInput) {
    const data = await this.sdk.UpdateFormBlockField({ fieldId, input });
    return data.updateFormBlockField;
  }

  async deleteBlockField(fieldId: string) {
    const data = await this.sdk.DeleteFormBlockField({ fieldId });
    return data.deleteFormBlockField;
  }

  async findFormById(id: string) {
    const data = await this.sdk.GetRequirementForm({ id });
    return data.requirementForm;
  }

  async findFormByShareToken(token: string) {
    const data = await this.sdk.GetRequirementFormByShareToken({ token });
    return data.requirementFormByShareToken;
  }

  async findForms(organizationId: string, options: PaginationOptions = {}) {
    const data = await this.sdk.GetRequirementForms({
      organizationId,
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
    return data.requirementForms;
  }

  async createForm(input: CreateRequirementFormInput) {
    const data = await this.sdk.CreateRequirementForm({ input });
    return data.createRequirementForm;
  }

  async updateForm(id: string, input: UpdateRequirementFormInput) {
    const data = await this.sdk.UpdateRequirementForm({ id, input });
    return data.updateRequirementForm;
  }

  async deleteForm(id: string) {
    const data = await this.sdk.DeleteRequirementForm({ id });
    return data.deleteRequirementForm;
  }

  async regenerateShareToken(id: string) {
    const data = await this.sdk.RegenerateFormShareToken({ id });
    return data.regenerateFormShareToken;
  }

  async submitForm(token: string, input: SubmitFormInput) {
    const data = await this.sdk.SubmitForm({ token, input });
    return data.submitForm;
  }

  async submitRequiredForm(
    targetType: RequiredFormTargetType,
    targetId: string,
    formId: string,
    input: SubmitFormInput,
  ) {
    const data = await this.sdk.SubmitRequiredForm({
      targetType,
      targetId,
      formId,
      input,
    });
    return data.submitRequiredForm;
  }

  async getMyFormSubmissionByToken(token: string) {
    const data = await this.sdk.GetMyFormSubmissionByToken({ token });
    return data.myFormSubmissionByToken;
  }

  async getMyUserProfile() {
    const data = await this.sdk.GetMyUserProfile();
    return data.myUserProfile;
  }

  async updateMyUserProfile(input: UpdateUserProfileInput) {
    const data = await this.sdk.UpdateMyUserProfile({ input });
    return data.updateMyUserProfile;
  }

  async findSubmissionsByMembershipRequestId(membershipRequestId: string) {
    const data = await this.sdk.GetFormSubmissionsByMembershipRequest({
      membershipRequestId,
    });
    return data.formSubmissionsByMembershipRequest;
  }

  async findSubmissionsForVolunteer(userId: string) {
    const data = await this.sdk.GetFormSubmissionsForVolunteer({ userId });
    return data.formSubmissionsForVolunteer;
  }

  async findMyFormSubmissions(organizationUnitId: string) {
    const data = await this.sdk.GetMyFormSubmissions({ organizationUnitId });
    return data.myFormSubmissions;
  }

  async findMyOrgUnitForms(organizationUnitId: string) {
    const data = await this.sdk.MyOrgUnitForms({ organizationUnitId });
    return data.myOrgUnitForms;
  }

  async findMySubmission(id: string) {
    const data = await this.sdk.MyFormSubmission({ id });
    return data.myFormSubmission;
  }

  async findAdminSubmission(id: string) {
    const data = await this.sdk.GetAdminFormSubmission({ id });
    return data.adminVolunteerSubmission;
  }

  async findSubmissionsByForm(formId: string, options: PaginationOptions = {}) {
    const data = await this.sdk.GetFormSubmissionsByForm({
      formId,
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    });
    return data.formSubmissionsByForm;
  }
}
