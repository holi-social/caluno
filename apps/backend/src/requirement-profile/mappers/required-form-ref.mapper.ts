import { Injectable } from '@nestjs/common';
import { RequiredFormRef } from '../../organization/models/organization-unit-required-form.model';
import type { RequirementFormEntity } from '../schemas/requirement-form.schema';
import { RequirementFormMapper } from './requirement-form.mapper';

export type RequiredFormRefRow = {
  form: RequirementFormEntity;
  order: number;
};

@Injectable()
export class RequiredFormRefMapper {
  constructor(private readonly requirementFormMapper: RequirementFormMapper) {}

  toModelOrThrow(row: RequiredFormRefRow): RequiredFormRef {
    return {
      form: this.requirementFormMapper.toModelOrThrow(row.form),
      order: row.order,
    };
  }

  toArray(rows: RequiredFormRefRow[]): RequiredFormRef[] {
    return rows.map((row) => this.toModelOrThrow(row));
  }
}
