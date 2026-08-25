import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { FilePurpose } from '../enums';

export class PresignUploadDto {
  @IsEnum(FilePurpose)
  purpose!: FilePurpose;

  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @IsInt()
  @Min(1)
  byteSize!: number;

  @IsOptional()
  @IsUUID()
  organizationUnitId?: string | null;
}
