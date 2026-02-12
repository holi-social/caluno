import { InputType, PartialType } from '@nestjs/graphql';
import { CreateShiftInput } from './create-shift.input';

@InputType()
export class UpdateShiftInput extends PartialType(CreateShiftInput) {}
