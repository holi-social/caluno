import { registerEnumType } from '@nestjs/graphql';

export enum JoinStatus {
  NONE = 'NONE',
  JOINED = 'JOINED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  REQUIREMENTS_NEEDED = 'REQUIREMENTS_NEEDED',
}

registerEnumType(JoinStatus, {
  name: 'JoinStatus',
});
